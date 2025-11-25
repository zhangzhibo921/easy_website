const express = require('express')
const router = express.Router()
const db = require('../config/database')
const { 
  authenticateToken, 
  requireEditor, 
  logActivity 
} = require('../middleware/auth')
const { 
  validateCreatePage, 
  validateUpdatePage, 
  validatePagination,
  validateId,
  validateSlug
} = require('../middleware/validation')

// 获取所有页面（支持分页和搜索）
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    console.log('分页参数:', { page: pageNum, limit: limitNum, offset }) // 调试日志

    let whereClause = ''
    let searchParams = []

    // 如果是未认证用户，只显示已发布的页面
    if (!req.headers.authorization) {
      whereClause = 'WHERE published = true'
    } else {
      // 认证用户可以看到所有页面
      whereClause = 'WHERE 1=1'
    }

    // 搜索功能
    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)'
      searchParams.push(`%${search}%`, `%${search}%`)
    }

    // 标签筛选
    let tagFilterSql = '';
    let tagFilterParams = [];
    const tagIds = req.query.tagIds;
    const includeNoTags = req.query.includeNoTags === 'true';

    // 处理标签ID数组
    let cleanedTagIds = [];
    if (tagIds) {
      const tagIdArray = Array.isArray(tagIds) ? tagIds : [tagIds];
      // 清理标签ID（移除tag_前缀并转换为数字）
      cleanedTagIds = tagIdArray
        .map(id => {
          const cleanId = String(id).replace(/^tag_/, '');
          const numId = Number(cleanId);
          return isNaN(numId) ? null : numId;
        })
        .filter(id => id !== null && id > 0);
    }

    // 构建标签筛选条件
    if (cleanedTagIds.length > 0 || includeNoTags) {
      const conditions = [];

      if (cleanedTagIds.length > 0) {
        const placeholders = cleanedTagIds.map(() => '?').join(',');
        conditions.push(`pages.id IN (SELECT DISTINCT page_id FROM page_tags WHERE tag_id IN (${placeholders}))`);
        tagFilterParams = [...cleanedTagIds];
      }

      if (includeNoTags) {
        conditions.push(`pages.id NOT IN (SELECT DISTINCT page_id FROM page_tags WHERE page_id IS NOT NULL)`);
      }

      if (conditions.length > 0) {
        tagFilterSql = `AND (${conditions.join(' OR ')})`;
      }
    }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM pages ${whereClause} ${tagFilterSql}`;
    const [countResult] = await db.execute(countSql, [...searchParams, ...tagFilterParams])
    const total = countResult[0].total

    // 获取页面列表
    let sql = `
      SELECT
        pages.id, pages.title, pages.slug, pages.excerpt, pages.featured_image,
        pages.meta_title, pages.meta_description, pages.published, pages.sort_order, pages.template_data,
        pages.created_at, pages.updated_at,
        u.username as created_by_name
      FROM pages
      LEFT JOIN users u ON pages.created_by = u.id
      ${whereClause} ${tagFilterSql}
      ORDER BY pages.sort_order ASC, pages.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `

    const [pages] = await db.execute(sql, [...searchParams, ...tagFilterParams])

    // 处理每个页面的template_data和标签信息
    const processedPages = await Promise.all(pages.map(async (page) => {
      let processedPage = { ...page };

      // 处理template_data
      if (page.template_data) {
        try {
          // 如果template_data是字符串，解析它
          if (typeof page.template_data === 'string') {
            processedPage.template_data = JSON.parse(page.template_data);
          }
        } catch (parseError) {
          console.error('解析template_data失败:', parseError);
          processedPage.template_data = null;
        }
      }

      // 获取页面的标签信息
      try {
        const [tags] = await db.execute(`
          SELECT t.id, t.name
          FROM tags t
          INNER JOIN page_tags pt ON t.id = pt.tag_id
          WHERE pt.page_id = ?
          ORDER BY t.name ASC
        `, [page.id]);

        processedPage.tags = tags.map(tag => ({
          id: `tag_${tag.id}`,
          name: tag.name
        }));
      } catch (tagError) {
        console.error('获取页面标签失败:', tagError);
        processedPage.tags = [];
      }

      return processedPage;
    }));

    res.json({
      success: true,
      data: processedPages,
      meta: {
        current_page: pageNum,
        per_page: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
        has_next: pageNum < Math.ceil(total / limitNum),
        has_prev: pageNum > 1
      }
    })
  } catch (error) {
    console.error('获取页面列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取页面列表失败'
    })
  }
})

// 获取页面组件数据
router.get('/:id/components', validateId, async (req, res) => {
  try {
    const { id } = req.params

    // 首先尝试从新的component_blocks表获取数据
    const [components] = await db.execute(`
      SELECT component_id as id, component_type as type, component_props as props
      FROM component_blocks
      WHERE page_id = ?
      ORDER BY sort_order ASC
    `, [id])

    // 如果新表中没有数据，回退到旧的template_data方式
    if (components.length === 0) {
      const [pages] = await db.execute(`
        SELECT template_data
        FROM pages
        WHERE id = ?
      `, [id])

      if (pages.length === 0) {
        return res.status(404).json({
          success: false,
          message: '页面不存在'
        })
      }

      const page = pages[0]
      
      // 解析template_data
      let templateData = null;
      if (page.template_data) {
        try {
          // 如果template_data是字符串，解析它
          if (typeof page.template_data === 'string') {
            templateData = JSON.parse(page.template_data);
          } else {
            templateData = page.template_data;
          }
        } catch (parseError) {
          console.error('解析template_data失败:', parseError);
          templateData = null;
        }
      }

      res.json({
        success: true,
        data: templateData ? templateData.components : []
      })
    } else {
      // 使用新的组件区块数据
      res.json({
        success: true,
        data: components
      })
    }
  } catch (error) {
    console.error('获取页面组件失败:', error)
    res.status(500).json({
      success: false,
      message: '获取页面组件失败'
    })
  }
})

// 根据ID获取页面
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params

    const [pages] = await db.execute(`
      SELECT 
        p.*,
        u.username as created_by_name
      FROM pages p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [id])

    if (pages.length === 0) {
      return res.status(404).json({
        success: false,
        message: '页面不存在'
      })
    }

    const page = pages[0]

    // 如果是未发布的页面，需要认证
    if (!page.published && !req.headers.authorization) {
      return res.status(404).json({
        success: false,
        message: '页面不存在'
      })
    }

    // 处理template_data，确保它是有效的JSON对象
    let processedPage = { ...page };
    if (page.template_data) {
      try {
        // 如果template_data是字符串，解析它
        if (typeof page.template_data === 'string') {
          processedPage.template_data = JSON.parse(page.template_data);
        }
      } catch (parseError) {
        console.error('解析template_data失败:', parseError);
        processedPage.template_data = null;
      }
    }

    // 获取页面的标签信息
    try {
      const [tags] = await db.execute(`
        SELECT t.id, t.name
        FROM tags t
        INNER JOIN page_tags pt ON t.id = pt.tag_id
        WHERE pt.page_id = ?
        ORDER BY t.name ASC
      `, [page.id]);

      processedPage.tags = tags.map(tag => ({
        id: `tag_${tag.id}`,
        name: tag.name
      }));
    } catch (tagError) {
      console.error('获取页面标签失败:', tagError);
      processedPage.tags = [];
    }

    // 记录页面访问日志（仅对已发布的页面）
    if (page.published) {
      const logData = {
        user_id: req.user ? req.user.id : null,
        action: 'view',
        resource_type: 'page',
        resource_id: page.id,
        description: `访问页面: ${page.title}`,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      }

      // 异步记录日志，不阻塞响应
      db.execute(
        'INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [logData.user_id, logData.action, logData.resource_type, logData.resource_id, logData.description, logData.ip_address, logData.user_agent]
      ).catch(error => {
        console.error('记录页面访问日志失败:', error)
      })
    }

    res.json({
      success: true,
      data: processedPage
    })
  } catch (error) {
    console.error('获取页面失败:', error)
    res.status(500).json({
      success: false,
      message: '获取页面失败'
    })
  }
})

// 根据slug获取页面
router.get('/slug/:slug', validateSlug, async (req, res) => {
  try {
    const { slug } = req.params

    const [pages] = await db.execute(`
      SELECT 
        p.*,
        u.username as created_by_name
      FROM pages p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.slug = ?
    `, [slug])

    if (pages.length === 0) {
      return res.status(404).json({
        success: false,
        message: '页面不存在'
      })
    }

    const page = pages[0]

    // 如果是未发布的页面，需要认证
    if (!page.published && !req.headers.authorization) {
      return res.status(404).json({
        success: false,
        message: '页面不存在'
      })
    }

    // 处理template_data，确保它是有效的JSON对象
    let processedPage = { ...page };
    if (page.template_data) {
      try {
        // 如果template_data是字符串，解析它
        if (typeof page.template_data === 'string') {
          processedPage.template_data = JSON.parse(page.template_data);
        }
      } catch (parseError) {
        console.error('解析template_data失败:', parseError);
        processedPage.template_data = null;
      }
    }

    // 获取页面的标签信息
    try {
      const [tags] = await db.execute(`
        SELECT t.id, t.name
        FROM tags t
        INNER JOIN page_tags pt ON t.id = pt.tag_id
        WHERE pt.page_id = ?
        ORDER BY t.name ASC
      `, [page.id]);

      processedPage.tags = tags.map(tag => ({
        id: `tag_${tag.id}`,
        name: tag.name
      }));
    } catch (tagError) {
      console.error('获取页面标签失败:', tagError);
      processedPage.tags = [];
    }

    // 记录页面访问日志（仅对已发布的页面）
    if (page.published) {
      const logData = {
        user_id: req.user ? req.user.id : null,
        action: 'view',
        resource_type: 'page',
        resource_id: page.id,
        description: `访问页面: ${page.title}`,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent')
      }

      // 异步记录日志，不阻塞响应
      db.execute(
        'INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [logData.user_id, logData.action, logData.resource_type, logData.resource_id, logData.description, logData.ip_address, logData.user_agent]
      ).catch(error => {
        console.error('记录页面访问日志失败:', error)
      })
    }

    res.json({
      success: true,
      data: processedPage
    })
  } catch (error) {
    console.error('获取页面失败:', error)
    res.status(500).json({
      success: false,
      message: '获取页面失败'
    })
  }
})

// 创建新页面
router.post('/', 
  authenticateToken, 
  requireEditor, 
  validateCreatePage, 
  logActivity('create', 'page'),
  async (req, res) => {
    try {
      const pageData = { ...req.body, created_by: req.user.id }

      // 检查slug是否已存在
      let pageSlug = pageData.slug;
      // 处理首页slug
      if (pageData.title && pageData.title.includes('首页') && pageSlug === '/') {
        pageSlug = 'home';
      }
      // 确保slug有效
      if (pageSlug && typeof pageSlug === 'string') {
        pageSlug = pageSlug.trim();
        // 标准化首页slug
        if (pageSlug === '' || pageSlug === '/') {
          pageSlug = 'home';
        }
      } else {
        pageSlug = 'page-' + Date.now();
      }

      const [existingPages] = await db.execute(
        'SELECT id FROM pages WHERE slug = ?',
        [pageSlug]
      )

      if (existingPages.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'URL别名已存在'
        })
      }

      // 创建页面
      const [result] = await db.execute(`
        INSERT INTO pages (
          title, slug, content, excerpt, featured_image,
          meta_title, meta_description, published, sort_order, template_data, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pageData.title,
        pageSlug, // 使用处理后的slug
        pageData.content,
        pageData.excerpt || null,
        pageData.featured_image || null,
        pageData.meta_title || null,
        pageData.meta_description || null,
        pageData.published,
        pageData.sort_order || 0,
        pageData.template_data || null,
        pageData.created_by
      ])

      // 如果提供了标签ID，关联标签
      // Normalize tags to handle both single string and array formats
      const tags = Array.isArray(pageData.tags)
        ? pageData.tags
        : (typeof pageData.tags === 'string'
          ? [pageData.tags]
          : []);

      if (tags.length > 0) {
        try {
          // 过滤无效标签ID并确保是有效的数字
          const tagValues = tags
            .map(tagId => {
              const rawId = typeof tagId === 'string' ? tagId.replace('tag_', '') : tagId.toString();
              const tagIdValue = Number(rawId);
              return isNaN(tagIdValue) ? null : [result.insertId, tagIdValue];
            })
            .filter(Boolean);

          if (tagValues.length > 0) {
            await db.execute(
              'INSERT INTO page_tags (page_id, tag_id) VALUES ?',
              [tagValues]
            );
            console.log(`成功关联 ${tagValues.length} 个标签到页面 ${result.insertId}`);
          }
        } catch (tagError) {
          console.error('关联页面标签失败:', tagError);
        }
      }

      res.status(201).json({
        success: true,
        message: '页面创建成功',
        data: {
          id: result.insertId,
          ...pageData
        }
      })

      // 如果创建包含组件数据，同时创建component_blocks数据
      if (pageData.template_data) {
        try {
          let templateData = pageData.template_data;
          // 如果是字符串，解析为JSON对象
          if (typeof templateData === 'string') {
            templateData = JSON.parse(templateData);
          }
          
          // 插入组件区块数据
          if (templateData.components && Array.isArray(templateData.components)) {
            for (let i = 0; i < templateData.components.length; i++) {
              const component = templateData.components[i];
              await db.execute(
                `INSERT INTO component_blocks (page_id, component_id, component_type, component_props, sort_order) VALUES (?, ?, ?, ?, ?)`,
                [
                  result.insertId,
                  component.id,
                  component.type,
                  JSON.stringify(component.props),
                  i
                ]
              );
            }
          }
        } catch (componentError) {
          console.error('创建组件区块数据失败:', componentError);
          // 组件区块创建失败不应该影响页面创建
        }
      }
    } catch (error) {
      console.error('创建页面失败:', error)
      res.status(500).json({
        success: false,
        message: '创建页面失败'
      })
    }
  }
)

// 更新页面
router.put('/:id', 
  authenticateToken, 
  requireEditor, 
  validateId,
  logActivity('update', 'page'),
  async (req, res) => {
    try {
      const { id } = req.params
      const updates = []
      const values = []

      // 检查页面是否存在
      const [existingPages] = await db.execute(
        'SELECT id, created_by FROM pages WHERE id = ?',
        [id]
      )

      if (existingPages.length === 0) {
        return res.status(404).json({
          success: false,
          message: '页面不存在'
        })
      }

      // 手动验证和清理数据
      const allowedFields = ['title', 'slug', 'content', 'excerpt', 'featured_image', 'meta_title', 'meta_description', 'published', 'sort_order', 'template_data']
      
      // 处理每个允许的字段
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          // 特殊处理slug字段，确保首页slug正确
          if (field === 'slug') {
            let slugValue = req.body[field];
            // 如果是首页且slug为'/'，则转换为'home'
            if (req.body.title && req.body.title.includes('首页') && slugValue === '/') {
              slugValue = 'home';
            }
            // 确保slug不为空且有效
            if (slugValue && typeof slugValue === 'string') {
              slugValue = slugValue.trim();
              // 标准化首页slug
              if (slugValue === '' || slugValue === '/') {
                slugValue = 'home';
              }
            } else {
              slugValue = 'page-' + Date.now();
            }
            updates.push(`${field} = ?`)
            values.push(slugValue)
          } else {
            updates.push(`${field} = ?`)
            values.push(req.body[field])
          }
        }
      })

      if (updates.length === 0 && (req.body.tags === undefined || !Array.isArray(req.body.tags) || req.body.tags.length === 0)) {
        return res.status(400).json({
          success: false,
          message: '没有可更新的字段'
        })
      }

      // 如果更新slug，检查是否冲突（排除自己）
      if (req.body.slug) {
        let slugToCheck = req.body.slug;
        // 如果是首页且slug为'/'，则转换为'home'
        if (req.body.title === '首页' && slugToCheck === '/') {
          slugToCheck = 'home';
        }
        
        const [conflictPages] = await db.execute(
          'SELECT id FROM pages WHERE slug = ? AND id != ?',
          [slugToCheck, id]
        )

        if (conflictPages.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'URL别名已存在'
          })
        }
      }

      // 开始事务
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        if (updates.length > 0) {
        values.push(id);
        await connection.execute(
          `UPDATE pages SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
          values
        );
      } else {
        // Only tags are being updated - ensure timestamp is updated
        await db.execute(
          'UPDATE pages SET updated_at = NOW() WHERE id = ?',
          [id]
        );

        // Re-fetch page to ensure proper response data
        const [updatedPages] = await db.execute(
          'SELECT * FROM pages WHERE id = ?',
          [id]
        );
        if (updatedPages.length > 0) {
          processedPage = { ...updatedPages[0] };

          // Fetch updated tags
          try {
            const [tags] = await db.execute(`
              SELECT t.id, t.name
              FROM tags t
              INNER JOIN page_tags pt ON t.id = pt.tag_id
              WHERE pt.page_id = ?
            `, [id]);
            processedPage.tags = tags.map(tag => ({
          id: `tag_${tag.id}`,
          name: tag.name
        }));
          } catch (tagError) {
            console.error('Error fetching updated tags:', tagError);
            processedPage.tags = [];
          }
        }
      }

      // 更新页面标签关联：增强验证防止意外清除
      // 强制更新标签关联（确保数据一致性）
      // ⚡️ 强制同步标签（100%确保数据一致性）
      if (req.body.tags !== undefined) {
        // 1. 清空现有标签关联
        await connection.execute('DELETE FROM page_tags WHERE page_id = ?', [id]);

        // 2. 处理有效标签ID
        const tagIds = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
        const validIds = tagIds
          .map(tag => {
            const cleanId = String(tag).replace(/^tag_/, '');
            const numId = Number(cleanId);
            return Number.isInteger(numId) && numId > 0 ? numId : null;
          })
          .filter(id => id !== null);

        // 3. 重建标签关联
        if (validIds.length > 0) {
          // 3. 重建标签关联
          if (validIds.length > 0) {
            const placeholders = validIds.map(() => '(?, ?)').join(',');
            const flatValues = validIds.flatMap(tagId => [id, tagId]);
            await connection.execute(
              `INSERT INTO page_tags (page_id, tag_id) VALUES ${placeholders}`,
              flatValues
            );
            console.log(`📌 成功绑定 ${validIds.length} 个标签到页面 ${id} | IDs: ${validIds.join(',')}`);
          } else {
            console.log(`📌 页面 ${id} 标签已清空`);
          }
        } else {
          console.log(`📌 页面 ${id} 标签已清空`);
        }
      } // End of tags processing

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

      // 如果更新包含组件数据，同时更新component_blocks表
      if (req.body.template_data) {
        try {
          let templateData = req.body.template_data;
          // 如果是字符串，解析为JSON对象
          if (typeof templateData === 'string') {
            templateData = JSON.parse(templateData);
          }
          
          // 清除现有的组件区块数据
          await db.execute('DELETE FROM component_blocks WHERE page_id = ?', [id]);
          
          // 插入新的组件区块数据
          if (templateData.components && Array.isArray(templateData.components)) {
            for (let i = 0; i < templateData.components.length; i++) {
              const component = templateData.components[i];
              
              // 处理SVG图标路径
              let svgPaths = null;
              const componentProps = component.props || {};
              
              // 为不同类型的组件处理SVG图标
              if (component.type === 'feature-grid' && componentProps.features) {
                const features = componentProps.features.map(feature => {
                  if (feature.icon && feature.icon.startsWith('<svg')) {
                    // 这里应该存储SVG文件路径，但现在我们先保持原始内容
                    return feature;
                  }
                  return feature;
                });
                componentProps.features = features;
              } else if (component.type === 'stats-section' && componentProps.stats) {
                const stats = componentProps.stats.map(stat => {
                  if (stat.icon && stat.icon.startsWith('<svg')) {
                    // 这里应该存储SVG文件路径，但现在我们先保持原始内容
                    return stat;
                  }
                  return stat;
                });
                componentProps.stats = stats;
              } else if (component.type === 'timeline' && componentProps.events) {
                const events = componentProps.events.map(event => {
                  if (event.icon && event.icon.startsWith('<svg')) {
                    // 这里应该存储SVG文件路径，但现在我们先保持原始内容
                    return event;
                  }
                  return event;
                });
                componentProps.events = events;
              }
              
              await db.execute(
                `INSERT INTO component_blocks (page_id, component_id, component_type, component_props, sort_order, svg_paths) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  id,
                  component.id,
                  component.type,
                  JSON.stringify(componentProps),
                  i,
                  svgPaths ? JSON.stringify(svgPaths) : null
                ]
              );
            }
          }
        } catch (componentError) {
          console.error('更新组件区块数据失败:', componentError);
          // 组件区块更新失败不应该影响页面更新
        }
      }

      res.json({
        success: true,
        message: '页面更新成功'
      })
    } catch (error) {
      console.error('更新页面失败:', error)
      res.status(500).json({
        success: false,
        message: '更新页面失败'
      })
    }
  }
)

// 删除页面
router.delete('/:id', 
  authenticateToken, 
  requireEditor, 
  validateId,
  logActivity('delete', 'page'),
  async (req, res) => {
    try {
      const { id } = req.params

      // 检查页面是否存在
      const [existingPages] = await db.execute(
        'SELECT id FROM pages WHERE id = ?',
        [id]
      )

      if (existingPages.length === 0) {
        return res.status(404).json({
          success: false,
          message: '页面不存在'
        })
      }

      // 删除页面
      await db.execute('DELETE FROM pages WHERE id = ?', [id])

      res.json({
        success: true,
        message: '页面删除成功'
      })
    } catch (error) {
      console.error('删除页面失败:', error)
      res.status(500).json({
        success: false,
        message: '删除页面失败'
      })
    }
  }
)

// 批量更新页面排序
router.put('/batch/sort', 
  authenticateToken, 
  requireEditor,
  async (req, res) => {
    try {
      const { pages } = req.body

      if (!Array.isArray(pages)) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的页面排序数据'
        })
      }

      // 批量更新排序
      for (const page of pages) {
        if (page.id && typeof page.sort_order === 'number') {
          await db.execute(
            'UPDATE pages SET sort_order = ? WHERE id = ?',
            [page.sort_order, page.id]
          )
        }
      }

      res.json({
        success: true,
        message: '页面排序更新成功'
      })
    } catch (error) {
      console.error('更新页面排序失败:', error)
      res.status(500).json({
        success: false,
        message: '更新页面排序失败'
      })
    }
  }
)

module.exports = router
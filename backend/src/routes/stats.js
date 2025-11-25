const express = require('express')
const router = express.Router()
const db = require('../config/database')
const { authenticateToken, requireEditor } = require('../middleware/auth')

// 获取仪表盘统计数据
router.get('/dashboard', authenticateToken, requireEditor, async (req, res) => {
  try {
    // 获取页面统计（总页面数、已发布页面数）
    const [pageStats] = await db.execute(`
      SELECT
        COUNT(*) as total_pages,
        SUM(CASE WHEN published = true THEN 1 ELSE 0 END) as published_pages,
        SUM(CASE WHEN published = false THEN 1 ELSE 0 END) as draft_pages
      FROM pages
    `)

    // 获取用户统计
    const [userStats] = await db.execute(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN role = 'editor' THEN 1 ELSE 0 END) as editor_users,
        SUM(CASE WHEN role = 'viewer' THEN 1 ELSE 0 END) as viewer_users
      FROM users
    `)

    // 获取访问量统计
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 获取总访问量
    const [totalVisits] = await db.execute(`
      SELECT COUNT(*) as total_visits
      FROM activity_logs
      WHERE action = 'view' AND resource_type = 'page'
    `);

    // 获取当天访问量
    const [todayVisits] = await db.execute(`
      SELECT COUNT(*) as today_visits
      FROM activity_logs
      WHERE action = 'view' AND resource_type = 'page'
      AND DATE(created_at) = CURDATE()
    `);

    // 获取近一周访问量
    const [weekVisits] = await db.execute(`
      SELECT COUNT(*) as week_visits
      FROM activity_logs
      WHERE action = 'view' AND resource_type = 'page'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // 获取近一月访问量
    const [monthVisits] = await db.execute(`
      SELECT COUNT(*) as month_visits
      FROM activity_logs
      WHERE action = 'view' AND resource_type = 'page'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // 获取最近活动
    const [recentActivities] = await db.execute(`
      SELECT
        al.id,
        al.action,
        al.resource_type,
        al.description,
        al.created_at,
        u.username
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `)

    // 获取最近创建的页面
    const [recentPages] = await db.execute(`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.published,
        p.created_at,
        u.username as created_by_name
      FROM pages p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `)

    // 获取系统状态信息
    const [systemStats] = await db.execute(`
      SELECT
        table_name,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY (data_length + index_length) DESC
    `);

    // 计算总数据库大小
    const totalSize = systemStats.reduce((sum, table) => sum + (table.size_mb || 0), 0);

    // 获取服务器状态信息
    const os = require('os');

    // CPU 使用率（更准确的计算）
    const startCpuUsage = process.cpuUsage();
    const startCpuInfo = os.cpus();

    // 短暂延迟以计算CPU使用率
    const start = Date.now();
    while (Date.now() - start < 100) {
      // 空循环，消耗一些CPU时间
    }

    const endCpuUsage = process.cpuUsage();
    const totalCpus = os.cpus().length;

    // 计算CPU使用率百分比
    const userDiff = endCpuUsage.user - startCpuUsage.user;
    const systemDiff = endCpuUsage.system - startCpuUsage.system;
    const totalDiff = userDiff + systemDiff;
    const cpuPercent = Math.min(100, Math.round((totalDiff / (1000 * 100 * totalCpus)) * 100));

    // 内存使用情况
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryPercent = Math.round((usedMem / totalMem) * 100);

    // 磁盘使用情况
    let diskInfo = {
      total: 'N/A',
      used: 'N/A',
      available: 'N/A',
      percent: 'N/A'
    };
    try {
      const fs = require('fs');
      const path = require('path');

      // 获取磁盘使用情况
      const diskStats = fs.statfsSync(path.resolve(__dirname, '../../'));
      const total = diskStats.blocks * diskStats.bsize;
      const free = diskStats.bavail * diskStats.bsize;
      const used = total - free;
      const percent = Math.round((used / total) * 100);

      // 转换为GB并格式化
      diskInfo = {
        total: (total / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        used: (used / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        available: (free / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        percent: percent + '%'
      };
    } catch (error) {
      console.error('获取磁盘使用情况失败:', error);
      diskInfo = {
        total: 'N/A',
        used: 'N/A',
        available: 'N/A',
        percent: 'N/A'
      };
    }

    res.json({
      success: true,
      data: {
        // 页面统计
        total_pages: pageStats[0].total_pages,
        published_pages: pageStats[0].published_pages,

        // 访问量统计
        total_visits: totalVisits[0].total_visits,
        today_visits: todayVisits[0].today_visits,
        week_visits: weekVisits[0].week_visits,
        month_visits: monthVisits[0].month_visits,

        // 用户统计
        total_users: userStats[0].total_users,

        // 最近活动和页面
        recent_activities: recentActivities,
        recent_pages: recentPages,

        // 系统状态
        system_status: {
          service: '正常',
          database: '连接正常',
          cpu_percent: cpuPercent,
          memory: {
            total: (totalMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            used: (usedMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            percent: memoryPercent
          },
          storage: diskInfo
        }
      }
    })
  } catch (error) {
    console.error('获取仪表盘统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    })
  }
})

// 获取页面访问统计
router.get('/pages', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { period = '30' } = req.query
    const days = parseInt(period)

    // 获取页面列表及其统计信息
    const [pageStats] = await db.execute(`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.published,
        p.created_at,
        p.updated_at,
        u.username as created_by_name,
        (SELECT COUNT(*) FROM activity_logs WHERE resource_type = 'page' AND resource_id = p.id AND action = 'view') as view_count
      FROM pages p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY view_count DESC, p.updated_at DESC
    `)

    res.json({
      success: true,
      data: pageStats
    })
  } catch (error) {
    console.error('获取页面统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取页面统计失败'
    })
  }
})

// 获取详细分析数据（用于统计分析页面）
router.get('/analytics', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { range = '7days' } = req.query

    // 计算日期范围
    let dateCondition = ''
    switch(range) {
      case '24h':
        dateCondition = 'AND al.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
        break
      case '7days':
        dateCondition = 'AND al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        break
      case '30days':
        dateCondition = 'AND al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        break
      case '90days':
        dateCondition = 'AND al.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)'
        break
      default:
        dateCondition = 'AND al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    }

    const visitorIdentifier = `
      COALESCE(
        CAST(al.user_id AS CHAR(64) CHARACTER SET utf8mb4),
        CAST(al.ip_address AS CHAR(64) CHARACTER SET utf8mb4),
        CAST(CONCAT('ua:', SUBSTRING(MD5(al.user_agent), 1, 12)) AS CHAR(64) CHARACTER SET utf8mb4)
      )
    `

    // 获取页面浏览趋势数据
    const [pageViewsTrend] = await db.execute(`
      SELECT
        DATE(al.created_at) as date,
        COUNT(*) as views
      FROM activity_logs al
      WHERE al.action = 'view' AND al.resource_type = 'page'
      ${dateCondition}
      GROUP BY DATE(al.created_at)
      ORDER BY date
    `)

    // 获取热门页面
    const [popularPages] = await db.execute(`
      SELECT
        p.title,
        COUNT(al.id) as view_count
      FROM activity_logs al
      JOIN pages p ON al.resource_id = p.id
      WHERE al.action = 'view' AND al.resource_type = 'page'
      ${dateCondition}
      GROUP BY p.id, p.title
      ORDER BY view_count DESC
      LIMIT 10
    `)

    // 获取用户活动分布
    const [userActivity] = await db.execute(`
      SELECT
        al.action,
        COUNT(*) as count
      FROM activity_logs al
      WHERE al.action IN ('login', 'view', 'create', 'update', 'delete')
      ${dateCondition}
      GROUP BY al.action
    `)

    // 获取设备类型统计（优化的检测算法）
    const [deviceStats] = await db.execute(`
      SELECT
        CASE
          WHEN al.user_agent LIKE '%Mobile%' AND al.user_agent NOT LIKE '%iPad%' THEN '移动端'
          WHEN al.user_agent LIKE '%iPad%' OR (al.user_agent LIKE '%Android%' AND al.user_agent LIKE '%Mobile%' = false) THEN '平板'
          WHEN al.user_agent LIKE '%Tablet%' THEN '平板'
          ELSE '桌面端'
        END as device_type,
        COUNT(*) as count
      FROM activity_logs al
      WHERE al.user_agent IS NOT NULL
      ${dateCondition}
      GROUP BY device_type
    `)

    // 获取浏览器统计
    const [browserStats] = await db.execute(`
      SELECT
        CASE
          WHEN al.user_agent LIKE '%Chrome%' THEN 'Chrome'
          WHEN al.user_agent LIKE '%Firefox%' THEN 'Firefox'
          WHEN al.user_agent LIKE '%Safari%' THEN 'Safari'
          WHEN al.user_agent LIKE '%Edge%' THEN 'Edge'
          ELSE '其他'
        END as browser,
        COUNT(*) as count
      FROM activity_logs al
      WHERE al.user_agent IS NOT NULL
      ${dateCondition}
      GROUP BY browser
    `)

    // 获取关键指标
    const [engagementMetrics] = await db.execute(`
      WITH ordered_views AS (
        SELECT
          al.id,
          al.resource_id,
          ${visitorIdentifier} AS visitor_id,
          al.created_at,
          CASE
            WHEN LAG(al.created_at) OVER (PARTITION BY ${visitorIdentifier} ORDER BY al.created_at) IS NULL THEN 1
            WHEN TIMESTAMPDIFF(MINUTE, LAG(al.created_at) OVER (PARTITION BY ${visitorIdentifier} ORDER BY al.created_at), al.created_at) > 30 THEN 1
            ELSE 0
          END AS is_new_session
        FROM activity_logs al
        WHERE al.action = 'view' AND al.resource_type = 'page'
        ${dateCondition}
      ),
      sessionized AS (
        SELECT
          *,
          SUM(is_new_session) OVER (PARTITION BY visitor_id ORDER BY created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_index
        FROM ordered_views
      ),
      event_metrics AS (
        SELECT
          resource_id,
          visitor_id,
          CONCAT(visitor_id, '-', session_index) AS session_id,
          COALESCE(
            LEAST(
              1800,
              GREATEST(
                1,
                TIMESTAMPDIFF(
                  SECOND,
                  created_at,
                  LEAD(created_at) OVER (PARTITION BY visitor_id, session_index ORDER BY created_at)
                )
              )
            ),
            30
          ) AS duration_seconds
        FROM sessionized
      ),
      session_lengths AS (
        SELECT
          CONCAT(visitor_id, '-', session_index) AS session_id,
          COUNT(*) AS page_count
        FROM sessionized
        GROUP BY session_id
      )
      SELECT
        (SELECT COUNT(*) FROM session_lengths) as total_sessions,
        COUNT(*) as total_page_views,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        IFNULL(AVG(duration_seconds), 0) as avg_duration_seconds,
        IFNULL(
          (
            SELECT
              SUM(CASE WHEN page_count = 1 THEN 1 ELSE 0 END)
            FROM session_lengths
          ) / NULLIF((SELECT COUNT(*) FROM session_lengths), 0),
          0
        ) as bounce_ratio
      FROM event_metrics
    `)

    const [pageDetails] = await db.execute(`
      WITH ordered_views AS (
        SELECT
          al.id,
          al.resource_id,
          ${visitorIdentifier} AS visitor_id,
          al.created_at,
          CASE
            WHEN LAG(al.created_at) OVER (PARTITION BY ${visitorIdentifier} ORDER BY al.created_at) IS NULL THEN 1
            WHEN TIMESTAMPDIFF(MINUTE, LAG(al.created_at) OVER (PARTITION BY ${visitorIdentifier} ORDER BY al.created_at), al.created_at) > 30 THEN 1
            ELSE 0
          END AS is_new_session
        FROM activity_logs al
        WHERE al.action = 'view' AND al.resource_type = 'page'
        ${dateCondition}
      ),
      sessionized AS (
        SELECT
          *,
          SUM(is_new_session) OVER (PARTITION BY visitor_id ORDER BY created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS session_index
        FROM ordered_views
      ),
      event_metrics AS (
        SELECT
          resource_id,
          visitor_id,
          CONCAT(visitor_id, '-', session_index) AS session_id,
          COALESCE(
            LEAST(
              1800,
              GREATEST(
                1,
                TIMESTAMPDIFF(
                  SECOND,
                  created_at,
                  LEAD(created_at) OVER (PARTITION BY visitor_id, session_index ORDER BY created_at)
                )
              )
            ),
            30
          ) AS duration_seconds
        FROM sessionized
      ),
      session_lengths AS (
        SELECT
          CONCAT(visitor_id, '-', session_index) AS session_id,
          COUNT(*) AS page_count
        FROM sessionized
        GROUP BY session_id
      ),
      aggregated AS (
        SELECT
          em.resource_id,
          COUNT(*) AS views,
          COUNT(DISTINCT em.visitor_id) AS unique_visitors,
          IFNULL(AVG(em.duration_seconds), 0) AS avg_duration_seconds,
          SUM(CASE WHEN sl.page_count = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) AS bounce_ratio
        FROM event_metrics em
        LEFT JOIN session_lengths sl ON em.session_id = sl.session_id
        GROUP BY em.resource_id
      )
      SELECT
        p.title,
        IFNULL(aggregated.views, 0) as views,
        IFNULL(aggregated.unique_visitors, 0) as unique_visitors,
        IFNULL(aggregated.avg_duration_seconds, 0) as avg_time,
        ROUND(IFNULL(aggregated.bounce_ratio, 0) * 100) as bounce_rate
      FROM pages p
      LEFT JOIN aggregated ON aggregated.resource_id = p.id
      ORDER BY COALESCE(aggregated.views, 0) DESC, p.updated_at DESC
      LIMIT 20
    `)

    // 格式化平均停留时间
    const formatAverageTime = (seconds) => {
      if (!seconds || seconds <= 0) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const engagementSummary = engagementMetrics[0] || {
      total_sessions: 0,
      total_page_views: 0,
      unique_visitors: 0,
      avg_duration_seconds: 0,
      bounce_ratio: 0
    }

    res.json({
      success: true,
      data: {
        pageViewsTrend,
        popularPages,
        userActivity,
        deviceStats,
        browserStats,
        metrics: {
          totalVisits: engagementSummary.total_sessions || 0,
          uniqueVisitors: engagementSummary.unique_visitors || 0,
          pageViews: engagementSummary.total_page_views || 0,
          avgTimeOnPage: formatAverageTime(engagementSummary.avg_duration_seconds),
          bounceRate: engagementSummary.bounce_ratio
            ? Math.round(engagementSummary.bounce_ratio * 100)
            : 0
        },
        pageDetails
      }
    })
  } catch (error) {
    console.error('获取分析数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取分析数据失败'
    })
  }
})

// 获取用户活动统计
router.get('/users', authenticateToken, requireEditor, async (req, res) => {
  try {
    // 获取用户活动统计
    const [userActivity] = await db.execute(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        u.last_login,
        (SELECT COUNT(*) FROM pages WHERE created_by = u.id) as pages_created,
        (SELECT COUNT(*) FROM activity_logs WHERE user_id = u.id) as total_activities,
        (SELECT COUNT(*) FROM activity_logs WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as recent_activities
      FROM users u
      ORDER BY recent_activities DESC, u.last_login DESC
    `)

    res.json({
      success: true,
      data: userActivity
    })
  } catch (error) {
    console.error('获取用户统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户统计失败'
    })
  }
})

// 获取系统性能统计
router.get('/system', authenticateToken, requireEditor, async (req, res) => {
  try {
    // 获取数据库大小信息
    const [dbSize] = await db.execute(`
      SELECT
        table_name,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY (data_length + index_length) DESC
    `)

    // 获取表行数统计
    const [tableCounts] = await db.execute(`
      SELECT
        table_name,
        table_rows
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY table_rows DESC
    `)

    // 计算总数据库大小
    const totalSize = dbSize.reduce((sum, table) => sum + table.size_mb, 0)

    // 获取服务器状态信息
    const os = require('os');
    const fs = require('fs').promises;

    // CPU 使用率（更准确的计算）
    const startCpuUsage = process.cpuUsage();
    const startCpuInfo = os.cpus();

    // 短暂延迟以计算CPU使用率
    const start = Date.now();
    while (Date.now() - start < 100) {
      // 空循环，消耗一些CPU时间
    }

    const endCpuUsage = process.cpuUsage();
    const totalCpus = os.cpus().length;

    // 计算CPU使用率百分比
    const userDiff = endCpuUsage.user - startCpuUsage.user;
    const systemDiff = endCpuUsage.system - startCpuUsage.system;
    const totalDiff = userDiff + systemDiff;
    const cpuPercent = Math.min(100, Math.round((totalDiff / (1000 * 100 * totalCpus)) * 100));

    // 内存使用情况
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryPercent = Math.round((usedMem / totalMem) * 100);

    // 磁盘使用情况
    let diskUsage = {
      total: 'N/A',
      used: 'N/A',
      available: 'N/A',
      percent: 'N/A'
    };

    try {
      const fs = require('fs');
      const path = require('path');

      // 获取磁盘使用情况
      const diskStats = fs.statfsSync(path.resolve(__dirname, '../../'));
      const total = diskStats.blocks * diskStats.bsize;
      const free = diskStats.bavail * diskStats.bsize;
      const used = total - free;
      const percent = Math.round((used / total) * 100);

      // 转换为GB并格式化
      diskUsage = {
        total: (total / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        used: (used / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        available: (free / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        percent: percent + '%'
      };
    } catch (error) {
      console.error('获取磁盘使用情况失败:', error);
      // 如果获取失败，保持默认值
      diskUsage = {
        total: 'N/A',
        used: 'N/A',
        available: 'N/A',
        percent: 'N/A'
      };
    }

    res.json({
      success: true,
      data: {
        database: {
          total_size_mb: totalSize,
          tables: dbSize
        },
        table_counts: tableCounts,
        server_info: {
          node_version: process.version,
          uptime: process.uptime(),
          memory_usage: memUsage,
          environment: process.env.NODE_ENV || 'development'
        },
        system_status: {
          service: '正常',
          database: '连接正常',
          storage_total: diskUsage.total,
          storage_used: diskUsage.used,
          storage_available: diskUsage.available,
          storage_percent: diskUsage.percent,
          cpu_percent: cpuPercent,
          memory_total: totalMem,
          memory_used: usedMem,
          memory_percent: memoryPercent
        }
      }
    })
  } catch (error) {
    console.error('获取系统统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取系统统计失败'
    })
  }
})

// 获取活动日志
router.get('/logs', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      action, 
      resource_type, 
      user_id,
      start_date,
      end_date 
    } = req.query

    const offset = (page - 1) * limit
    let whereClause = 'WHERE 1=1'
    const params = []

    // 筛选条件
    if (action) {
      whereClause += ' AND al.action = ?'
      params.push(action)
    }

    if (resource_type) {
      whereClause += ' AND al.resource_type = ?'
      params.push(resource_type)
    }

    if (user_id) {
      whereClause += ' AND al.user_id = ?'
      params.push(user_id)
    }

    if (start_date) {
      whereClause += ' AND al.created_at >= ?'
      params.push(start_date)
    }

    if (end_date) {
      whereClause += ' AND al.created_at <= ?'
      params.push(end_date)
    }

    // 获取总数
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM activity_logs al
      ${whereClause}
    `, params)

    // 获取日志列表
    const [logs] = await db.execute(`
      SELECT 
        al.id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.description,
        al.ip_address,
        al.created_at,
        u.username
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset])

    const total = countResult[0].total

    res.json({
      success: true,
      data: logs,
      meta: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    })
  } catch (error) {
    console.error('获取活动日志失败:', error)
    res.status(500).json({
      success: false,
      message: '获取活动日志失败'
    })
  }
})

module.exports = router

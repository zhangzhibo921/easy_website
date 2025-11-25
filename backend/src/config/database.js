const mysql = require('mysql2/promise')

// 调试：显示环境变量
console.log('🔧 数据库配置调试信息:')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '未设置')
console.log('DB_NAME:', process.env.DB_NAME)

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Start_123',
  database: process.env.DB_NAME || 'tech_website',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00'
}

// 创建连接池
const pool = mysql.createPool(dbConfig)

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ 数据库连接成功')
    connection.release()
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    process.exit(1)
  }
}

// 初始化数据库表
async function initDatabase() {
  try {
    // 创建用户表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // 创建页面表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL COMMENT '页面标题',
        slug VARCHAR(200) NOT NULL COMMENT 'URL别名',
        content LONGTEXT NOT NULL COMMENT '页面内容',
        excerpt TEXT COMMENT '页面摘要',
        featured_image VARCHAR(500) DEFAULT NULL COMMENT '特色图片',
        meta_title VARCHAR(200) DEFAULT NULL COMMENT 'SEO标题',
        meta_description TEXT COMMENT 'SEO描述',
        published BOOLEAN DEFAULT false COMMENT '是否发布',
        sort_order INT DEFAULT 0 COMMENT '排序',
        created_by INT DEFAULT NULL COMMENT '创建者ID',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        category VARCHAR(50) DEFAULT 'general' COMMENT '页面分类',
        template_data JSON DEFAULT NULL COMMENT '模板数据',
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // 创建标签表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建页面-标签关联表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS page_tags (
        page_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (page_id, tag_id),
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 创建设置表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value LONGTEXT,
        setting_type ENUM('string', 'text', 'number', 'boolean', 'json') DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // 创建活动日志表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id INT,
        description TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    console.log('✅ 数据库表初始化完成')
    
    // 插入默认管理员账户
    await createDefaultAdmin()
    
    // 插入默认设置
    await createDefaultSettings()

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message)
  }
}

// 创建默认管理员
async function createDefaultAdmin() {
  try {
    const bcrypt = require('bcryptjs')
    const [existingAdmin] = await pool.execute(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    )

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      await pool.execute(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin@example.com', 'admin']
      )
      console.log('✅ 默认管理员账户创建成功')
      console.log('📝 用户名: admin')
      console.log('📝 密码: admin123')
      console.log('⚠️  请登录后立即修改默认密码')
    }
  } catch (error) {
    console.error('❌ 创建默认管理员失败:', error.message)
  }
}

// 创建默认设置
async function createDefaultSettings() {
  const defaultSettings = [
    { key: 'site_name', value: '科技公司官网', type: 'string', description: '网站名称' },
    { key: 'site_description', value: '现代化科技公司官网，提供专业的技术服务', type: 'text', description: '网站描述' },
    { key: 'company_name', value: '科技公司', type: 'string', description: '公司名称' },
    { key: 'site_logo', value: '/logo.png', type: 'string', description: '网站Logo' },
    { key: 'site_favicon', value: '/favicon.ico', type: 'string', description: '网站图标' },
    { key: 'contact_email', value: 'contact@example.com', type: 'string', description: '联系邮箱' },
    { key: 'contact_phone', value: '400-123-4567', type: 'string', description: '联系电话' },
    { key: 'address', value: '北京市朝阳区科技园', type: 'string', description: '公司地址' },
    { key: 'icp_number', value: '京ICP备xxxxxxxx号', type: 'string', description: '备案号' },
    { key: 'social_links', value: '{}', type: 'json', description: '社交媒体链接' }
  ]

  for (const setting of defaultSettings) {
    try {
      await pool.execute(
        'INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
        [setting.key, setting.value, setting.type, setting.description]
      )
    } catch (error) {
      console.error(`设置 ${setting.key} 插入失败:`, error.message)
    }
  }
  
  console.log('✅ 默认设置创建完成')
}

// 启动时初始化
testConnection().then(() => {
  initDatabase()
})

module.exports = pool
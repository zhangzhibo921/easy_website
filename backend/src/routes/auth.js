const express = require('express')
const bcrypt = require('bcryptjs')
const router = express.Router()
const db = require('../config/database')
const { 
  authenticateToken, 
  generateToken, 
  logActivity 
} = require('../middleware/auth')
const {
  validateLogin,
  validateUpdateProfile
} = require('../middleware/validation')

// 用户登录
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body

    console.log('调试登录:', { username, password }) // 调试日志

    // 查找用户
    const [users] = await db.execute(
      'SELECT id, username, password, email, role FROM users WHERE username = ?',
      [username]
    )

    if (users.length === 0) {
      console.log('用户不存在:', username) // 调试日志
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const user = users[0]

    console.log('数据库中的密码:', user.password) // 调试日志
    console.log('输入的密码:', password) // 调试日志

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('密码匹配结果:', isValidPassword) // 调试日志
    
    if (!isValidPassword) {
      console.log('密码不匹配') // 调试日志
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 更新最后登录时间
    await db.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    )

    // 生成JWT令牌
    const token = generateToken(user.id)

    // 记录登录日志
    await db.execute(
      'INSERT INTO activity_logs (user_id, action, resource_type, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [
        user.id,
        'login',
        'auth',
        `用户 ${user.username} 登录系统`,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      ]
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    })
  }
})


// 获取当前用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name, language, role, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      data: users[0]
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    })
  }
})

// 更新用户信息
router.put('/profile', authenticateToken, validateUpdateProfile, async (req, res) => {
  try {
    const { email, currentPassword, newPassword, firstName, lastName, language } = req.body
    const updates = []
    const values = []

    // 更新邮箱
    if (email) {
      // 检查邮箱是否已被其他用户使用
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      )

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被其他用户使用'
        })
      }

      updates.push('email = ?')
      values.push(email)
    }

    // 更新个人资料
    if (firstName !== undefined) {
      updates.push('first_name = ?')
      values.push(firstName || null)
    }

    if (lastName !== undefined) {
      updates.push('last_name = ?')
      values.push(lastName || null)
    }

    if (language !== undefined) {
      updates.push('language = ?')
      values.push(language || 'zh-CN')
    }

    // 更新密码
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: '修改密码需要提供当前密码'
        })
      }

      // 验证当前密码
      const [users] = await db.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
      )

      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password)
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: '当前密码错误'
        })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)
      updates.push('password = ?')
      values.push(hashedPassword)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可更新的字段'
      })
    }

    // 执行更新
    values.push(req.user.id)
    await db.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    )

    res.json({
      success: true,
      message: '用户信息更新成功'
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    })
  }
})

// 用户登出
router.post('/logout', authenticateToken, logActivity('logout', 'auth'), (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  })
})

// 检查认证状态
router.get('/check', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: true,
      user: req.user
    }
  })
})


module.exports = router
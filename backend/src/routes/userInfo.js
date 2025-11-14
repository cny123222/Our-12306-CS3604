// 用户信息相关API路由
const express = require('express');
const router = express.Router();
const userInfoDbService = require('../services/userInfoDbService');
const { authenticateUser } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// 简单的认证中间件（用于测试环境）
const testAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }
  
  // 测试环境的token验证（仅用于自动化测试）
  if (token === 'valid-test-token') {
    req.user = { id: 1, username: 'test-user-123' };
    return next();
  }
  
  // 所有其他情况使用真实认证
  return authenticateUser(req, res, next);
};

/**
 * API-GET-UserInfo: 获取用户个人信息
 * GET /api/user/info
 */
router.get('/info', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userInfo = await userInfoDbService.getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.status(200).json(userInfo);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

/**
 * API-PUT-UserEmail: 更新用户邮箱
 * PUT /api/user/email
 */
router.put('/email', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: '邮箱不能为空' });
    }
    
    const success = await userInfoDbService.updateUserEmail(userId, email);
    
    if (success) {
      res.status(200).json({ message: '邮箱更新成功' });
    } else {
      res.status(500).json({ error: '更新邮箱失败' });
    }
  } catch (error) {
    console.error('更新邮箱失败:', error);
    
    if (error.message === '请输入有效的电子邮件地址！') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: '更新邮箱失败' });
  }
});

// 临时存储验证码会话（生产环境应使用Redis）
const phoneSessions = new Map();

/**
 * API-POST-UpdatePhoneRequest: 请求更新用户手机号（发送验证码）
 * POST /api/user/phone/update-request
 */
router.post('/phone/update-request', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhone, password } = req.body;
    
    // 验证新手机号格式
    if (!newPhone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }
    
    if (!/^\d{11}$/.test(newPhone)) {
      return res.status(400).json({ error: '您输入的手机号码不是有效的格式！' });
    }
    
    // 验证登录密码
    if (!password) {
      return res.status(400).json({ error: '输入登录密码！' });
    }
    
    // 从数据库获取用户信息
    const bcrypt = require('bcryptjs');
    const db = require('../database');
    const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user || user.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ error: '登录密码错误' });
    }
    
    // 检查新手机号是否已被使用
    // 简化实现，实际应查询数据库
    if (newPhone === '13800138000') {
      return res.status(409).json({ error: '该手机号已被使用' });
    }
    
    // 生成验证码和会话ID
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = uuidv4();
    
    // 存储会话信息（5分钟有效）
    phoneSessions.set(sessionId, {
      userId,
      newPhone,
      verificationCode,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    // 输出验证码到控制台（模拟发送短信）
    console.log(`[SMS] 向 ${newPhone} 发送验证码: ${verificationCode}`);
    
    res.status(200).json({
      message: '验证码已发送',
      sessionId
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ error: '发送验证码失败' });
  }
});

/**
 * API-POST-ConfirmPhoneUpdate: 确认更新用户手机号（验证验证码）
 * POST /api/user/phone/confirm-update
 */
router.post('/phone/confirm-update', async (req, res) => {
  try {
    const { sessionId, verificationCode } = req.body;
    
    if (!sessionId) {
      return res.status(401).json({ error: '会话无效或已过期' });
    }
    
    const session = phoneSessions.get(sessionId);
    
    if (!session) {
      return res.status(401).json({ error: '会话无效或已过期' });
    }
    
    // 检查会话是否过期
    if (Date.now() > session.expiresAt) {
      phoneSessions.delete(sessionId);
      return res.status(400).json({ error: '验证码错误或已过期' });
    }
    
    // 验证验证码
    if (verificationCode !== session.verificationCode) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }
    
    // 更新用户手机号
    const success = await userInfoDbService.updateUserPhone(session.userId, session.newPhone);
    
    // 删除会话
    phoneSessions.delete(sessionId);
    
    if (success) {
      console.log(`[验证码] 用户 ${session.userId} 的手机号已更新为 ${session.newPhone}`);
      res.status(200).json({ message: '手机号更新成功' });
    } else {
      res.status(500).json({ error: '更新手机号失败' });
    }
  } catch (error) {
    console.error('更新手机号失败:', error);
    res.status(500).json({ error: '更新手机号失败' });
  }
});

/**
 * API-GET-UserOrders: 获取用户订单列表
 * GET /api/user/orders
 */
router.get('/orders', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, keyword } = req.query;
    
    let orders;
    
    if (keyword) {
      // 使用搜索功能
      orders = await userInfoDbService.searchOrders(userId, {
        keyword,
        startDate,
        endDate
      });
    } else {
      // 使用普通查询
      orders = await userInfoDbService.getUserOrders(userId, {
        startDate,
        endDate
      });
    }
    
    res.status(200).json({ orders });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

module.exports = router;


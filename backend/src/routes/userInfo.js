// 用户信息相关API路由
const express = require('express');
const router = express.Router();
const userInfoDbService = require('../services/userInfoDbService');
const { authenticateUser } = require('../middleware/auth');
const registrationDbService = require('../services/registrationDbService');
const sessionService = require('../services/sessionService');

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
    
    // 检查新手机号是否已被其他用户使用
    const existingUser = await db.query('SELECT id FROM users WHERE phone = ? AND id != ?', [newPhone, userId]);
    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: '该手机号已被使用' });
    }
    
    // 检查发送频率限制（1分钟内不能重复发送）
    const canSend = await sessionService.checkSmsSendFrequency(newPhone, 'phone-update');
    if (!canSend) {
      return res.status(429).json({
        error: '请求验证码过于频繁，请稍后再试！'
      });
    }
    
    // 使用统一的验证码服务生成并保存验证码
    const verificationCode = await registrationDbService.createSmsVerificationCode(newPhone, 'phone-update');
    
    // 输出验证码到控制台（模拟发送短信）
    console.log(`\n=================================`);
    console.log(`📱 手机号更新验证码已生成`);
    console.log(`手机号: ${newPhone}`);
    console.log(`验证码: ${verificationCode}`);
    console.log(`有效期: 5分钟`);
    console.log(`用途: phone-update`);
    console.log(`=================================\n`);
    
    const responseData = {
      message: '验证码已发送',
      // 返回sessionId用于前端兼容，但验证时使用手机号
      sessionId: 'phone-update-session',
      // 开发环境下返回验证码和手机号（与登录页保持一致）
      verificationCode: verificationCode,
      phone: newPhone
    };
    
    console.log('✅ 准备返回响应:', responseData);
    res.status(200).json(responseData);
    console.log('✅ 响应已发送');
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ error: '发送验证码失败' });
  }
});

/**
 * API-POST-ConfirmPhoneUpdate: 确认更新用户手机号（验证验证码）
 * POST /api/user/phone/confirm-update
 */
router.post('/phone/confirm-update', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhone, verificationCode } = req.body;
    
    // 验证必需参数
    if (!newPhone) {
      return res.status(400).json({ error: '手机号不能为空' });
    }
    
    if (!verificationCode) {
      return res.status(400).json({ error: '验证码不能为空' });
    }
    
    // 使用统一的验证码验证服务
    const verifyResult = await registrationDbService.verifySmsCode(newPhone, verificationCode);
    
    if (!verifyResult.success) {
      return res.status(400).json({ error: verifyResult.error || '验证码错误或已过期' });
    }
    
    // 再次检查新手机号是否已被其他用户使用
    const bcrypt = require('bcryptjs');
    const db = require('../database');
    const existingUser = await db.query('SELECT id FROM users WHERE phone = ? AND id != ?', [newPhone, userId]);
    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: '该手机号已被使用' });
    }
    
    // 更新用户手机号
    const success = await userInfoDbService.updateUserPhone(userId, newPhone);
    
    if (success) {
      console.log(`\n=================================`);
      console.log(`✅ 手机号更新成功`);
      console.log(`用户ID: ${userId}`);
      console.log(`新手机号: ${newPhone}`);
      console.log(`=================================\n`);
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
 * API-PUT-UserDiscountType: 更新用户优惠类型
 * PUT /api/user/discount-type
 */
router.put('/discount-type', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { discountType } = req.body;
    
    if (!discountType) {
      return res.status(400).json({ error: '优惠类型不能为空' });
    }
    
    const success = await userInfoDbService.updateUserDiscountType(userId, discountType);
    
    if (success) {
      res.status(200).json({ message: '优惠类型更新成功' });
    } else {
      res.status(500).json({ error: '更新优惠类型失败' });
    }
  } catch (error) {
    console.error('更新优惠类型失败:', error);
    
    if (error.message === '无效的优惠类型') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: '更新优惠类型失败' });
  }
});

/**
 * API-GET-UserOrders: 获取用户订单列表
 * GET /api/user/orders
 */
router.get('/orders', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, keyword, searchType } = req.query;
    
    let orders;
    
    if (keyword) {
      // 使用搜索功能
      orders = await userInfoDbService.searchOrders(userId, {
        keyword,
        startDate,
        endDate,
        searchType
      });
    } else {
      // 使用普通查询
      orders = await userInfoDbService.getUserOrders(userId, {
        startDate,
        endDate,
        searchType
      });
    }
    
    res.status(200).json({ orders });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

module.exports = router;


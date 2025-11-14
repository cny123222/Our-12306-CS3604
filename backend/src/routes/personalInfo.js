/**
 * 个人信息相关API路由
 * 为个人信息页提供HTTP接口
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const personalInfoDbService = require('../services/personalInfoDbService');
const registrationDbService = require('../services/registrationDbService');
const bcrypt = require('bcryptjs');

/**
 * API-GET-UserInfo: 获取用户个人信息
 * GET /api/user/info
 */
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userInfo = await personalInfoDbService.getUserInfo(userId);
    
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
router.put('/email', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: '请提供邮箱地址' });
    }
    
    const success = await personalInfoDbService.updateUserEmail(userId, email);
    
    if (success) {
      res.status(200).json({ message: '邮箱更新成功' });
    } else {
      res.status(400).json({ error: '更新邮箱失败' });
    }
  } catch (error) {
    console.error('更新邮箱失败:', error);
    if (error.message.includes('电子邮件')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: '更新邮箱失败' });
  }
});

/**
 * API-POST-UpdatePhoneRequest: 请求更新用户手机号（发送验证码）
 * POST /api/user/phone/update-request
 */
router.post('/phone/update-request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhone, password } = req.body;
    
    // 验证参数
    if (!newPhone) {
      return res.status(400).json({ error: '请提供新手机号' });
    }
    
    if (!password) {
      return res.status(400).json({ error: '输入登录密码！' });
    }
    
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(newPhone)) {
      return res.status(400).json({ error: '您输入的手机号码不是有效的格式！' });
    }
    
    // 验证新手机号未被使用
    const dbService = require('../services/dbService');
    const existingUser = await dbService.get(
      'SELECT id FROM users WHERE phone = ?',
      [newPhone]
    );
    
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: '该手机号已被使用' });
    }
    
    // 验证用户密码
    const user = await dbService.get(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: '密码错误' });
    }
    
    // 生成并发送验证码
    const code = await registrationDbService.createSmsVerificationCode(newPhone);
    
    // 存储更新请求的会话信息
    const sessionService = require('../services/sessionService');
    const sessionId = require('uuid').v4();
    const sessionData = {
      userId,
      newPhone,
      purpose: 'phone_update'
    };
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟
    await sessionService.createSession(sessionId, sessionData, expiresAt);
    
    // 控制台显示验证码
    console.log(`[SMS] 发送验证码 ${code} 到 ${newPhone}`);
    
    res.status(200).json({ 
      message: '验证码已发送', 
      sessionId,
      verificationCode: code // 开发环境返回，生产环境应删除
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
    
    if (!sessionId || !verificationCode) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 验证会话
    const sessionService = require('../services/sessionService');
    const session = await sessionService.getSession(sessionId);
    
    if (!session || !session.user_data) {
      return res.status(401).json({ error: '会话无效或已过期' });
    }
    
    const sessionData = session.user_data;
    
    if (sessionData.purpose !== 'phone_update') {
      return res.status(400).json({ error: '会话类型错误' });
    }
    
    // 验证短信验证码
    const verifyResult = await registrationDbService.verifySmsCode(
      sessionData.newPhone,
      verificationCode
    );
    
    if (!verifyResult.success) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }
    
    // 更新手机号
    const success = await personalInfoDbService.updateUserPhone(
      sessionData.userId,
      sessionData.newPhone
    );
    
    if (success) {
      // 删除会话
      await sessionService.deleteSession(sessionId);
      
      console.log(`用户 ${sessionData.userId} 成功更新手机号为 ${sessionData.newPhone}`);
      res.status(200).json({ message: '手机号更新成功' });
    } else {
      res.status(400).json({ error: '更新手机号失败' });
    }
  } catch (error) {
    console.error('更新手机号失败:', error);
    if (error.message.includes('已被使用')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: '更新手机号失败' });
  }
});

/**
 * API-GET-UserOrders: 获取用户订单列表
 * GET /api/user/orders
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, keyword } = req.query;
    
    let orders;
    
    if (keyword) {
      // 如果有关键词，使用搜索功能
      orders = await personalInfoDbService.searchOrders(userId, {
        keyword,
        startDate,
        endDate
      });
    } else {
      // 否则，获取所有订单（可选日期筛选）
      orders = await personalInfoDbService.getUserOrders(userId, {
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


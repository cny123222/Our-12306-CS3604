const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

/**
 * API-GET-UserProfile: 获取用户个人信息
 * Route: GET /api/user/profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // TODO: 实现获取用户信息逻辑
    // 1. 从req.user获取用户ID
    // 2. 查询数据库获取用户完整信息
    // 3. 返回用户信息，手机号中间四位脱敏
    
    throw new Error('功能尚未实现');
  } catch (error) {
    res.status(500).json({ error: error.message || '获取用户信息失败' });
  }
});

/**
 * API-PUT-UserContactInfo: 更新用户联系方式（邮箱）
 * Route: PUT /api/user/contact-info
 */
router.put('/contact-info', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    
    // TODO: 实现更新邮箱逻辑
    // 1. 验证邮箱格式
    // 2. 更新数据库
    // 3. 返回成功响应
    
    throw new Error('功能尚未实现');
  } catch (error) {
    res.status(500).json({ error: error.message || '更新失败' });
  }
});

/**
 * API-POST-VerifyPhoneChange: 验证并更新用户手机号
 * Route: POST /api/user/verify-phone-change
 */
router.post('/verify-phone-change', authMiddleware, async (req, res) => {
  try {
    const { newPhone, password, verificationCode } = req.body;
    
    // TODO: 实现手机号更新逻辑
    // 1. 验证手机号格式（11位数字）
    // 2. 验证登录密码
    // 3. 验证手机验证码
    // 4. 更新数据库
    // 5. 控制台显示向什么手机号发送了什么验证码
    
    throw new Error('功能尚未实现');
  } catch (error) {
    res.status(500).json({ error: error.message || '更新失败' });
  }
});

/**
 * API-GET-UserOrders: 获取用户历史订单列表
 * Route: GET /api/user/orders
 */
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, keyword } = req.query;
    
    // TODO: 实现获取订单列表逻辑
    // 1. 根据日期范围和关键词筛选订单
    // 2. 订单信息保存期限为30日
    // 3. 返回订单列表
    
    throw new Error('功能尚未实现');
  } catch (error) {
    res.status(500).json({ error: error.message || '获取订单列表失败' });
  }
});

module.exports = router;


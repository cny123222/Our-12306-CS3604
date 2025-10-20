const express = require('express');
const jwt = require('jsonwebtoken');
const UserRepository = require('../database/userRepository');

const router = express.Router();
const userRepo = new UserRepository();

// API-GET-UserProfile: 获取用户个人信息
router.get('/profile', async (req, res) => {
  try {
    // 验收标准：
    // - 当访问令牌有效时，返回用户完整信息
    // - 当访问令牌无效或过期时，返回401状态码
    // - 当用户不存在时，返回404状态码
    
    const authHeader = req.headers.authorization;
    
    // 检查是否提供了认证头
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    // 检查认证头格式
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌格式'
      });
    }

    // 提取token
    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    let decoded;
    try {
      // 验证JWT token
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '认证令牌已过期'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: '无效的认证令牌'
        });
      }
    }

    // 获取用户信息
    const user = await userRepo.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 返回用户信息（不包含敏感信息）
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      realName: null, // 数据库中暂无此字段
      idCard: user.id_card_last4 ? `****${user.id_card_last4}` : null, // 只显示后4位
      userType: 'normal', // 默认值
      status: 'active', // 默认值
      createdAt: user.created_at,
      lastLoginTime: user.last_login_time
    };

    res.status(200).json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
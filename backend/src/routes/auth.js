const express = require('express');
const { body, validationResult } = require('express-validator');
const UserRepository = require('../database/userRepository');
const VerificationRepository = require('../database/verificationRepository');

const router = express.Router();
const userRepo = new UserRepository();
const verificationRepo = new VerificationRepository();

// API-POST-Login: 处理用户登录请求
router.post('/login', [
  body('loginId').notEmpty().withMessage('请输入用户名！'),
  body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6位！')
], async (req, res) => {
  try {
    // TODO: 实现用户登录逻辑
    // 验收标准：
    // - 当用户名和密码都正确时，返回200状态码和会话令牌
    // - 当用户名或密码为空时，返回400状态码和相应错误信息
    // - 当用户名或密码错误时，返回401状态码
    // - 成功验证后需要进行短信验证
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    throw new Error('Login API not implemented');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// API-POST-SendSmsCode: 发送短信验证码
router.post('/send-sms-code', [
  body('sessionToken').notEmpty().withMessage('会话令牌不能为空'),
  body('idCardLast4').isLength({ min: 4, max: 4 }).withMessage('请输入正确的证件号后4位')
], async (req, res) => {
  try {
    // TODO: 实现发送短信验证码逻辑
    // 验收标准：
    // - 当证件号后4位正确且未超过发送频率限制时，成功发送验证码
    // - 当证件号后4位错误时，返回400状态码
    // - 当1分钟内已发送过验证码时，返回429状态码
    // - 验证码发送到用户绑定的手机号
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    throw new Error('Send SMS code API not implemented');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// API-POST-VerifySmsCode: 验证短信验证码
router.post('/verify-sms-code', [
  body('sessionToken').notEmpty().withMessage('会话令牌不能为空'),
  body('idCardLast4').notEmpty().withMessage('请输入登录账号绑定的证件号后4位'),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('请输入验证码')
], async (req, res) => {
  try {
    // TODO: 实现验证短信验证码逻辑
    // 验收标准：
    // - 当证件号后4位和验证码都正确时，返回完整的用户信息和访问令牌
    // - 当证件号后4位为空时，返回相应错误信息
    // - 当验证码为空或格式错误时，返回相应错误信息
    // - 当验证码错误时，返回验证失败信息
    // - 成功验证后更新用户最后登录时间
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    throw new Error('Verify SMS code API not implemented');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
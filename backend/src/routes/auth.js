const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// API-POST-Login: 用户登录接口
router.post('/login', [
  body('identifier').notEmpty().withMessage('用户名/邮箱/手机号不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6位')
], authController.login);

// API-POST-SendVerificationCode: 发送短信验证码接口
// 注意：控制器支持两种场景（sessionId+idCardLast4 和 phoneNumber），验证逻辑在控制器中处理
router.post('/send-verification-code', authController.sendVerificationCode);

// API-POST-VerifyLogin: 短信验证登录接口
// 注意：控制器支持两种场景（sessionId 和 phoneNumber），验证逻辑在控制器中处理
router.post('/verify-login', authController.verifyLogin);

// API-GET-HomePage: 获取首页内容接口
router.get('/homepage', authController.getHomePage);

// API-GET-ForgotPassword: 忘记密码页面接口
router.get('/forgot-password', authController.getForgotPassword);

module.exports = router;
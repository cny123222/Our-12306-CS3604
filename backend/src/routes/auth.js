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
router.post('/send-verification-code', [
  body('sessionId').notEmpty().withMessage('会话ID不能为空'),
  body('idCardLast4').isLength({ min: 4, max: 4 }).withMessage('请输入证件号后4位')
], authController.sendVerificationCode);

// API-POST-VerifyLogin: 短信验证登录接口
router.post('/verify-login', [
  body('sessionId').notEmpty().withMessage('会话ID不能为空'),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('请输入6位验证码')
], authController.verifyLogin);

// API-GET-HomePage: 获取首页内容接口
router.get('/homepage', authController.getHomePage);

// API-GET-ForgotPassword: 忘记密码页面接口
router.get('/forgot-password', authController.getForgotPassword);

module.exports = router;
/**
 * 注册相关路由
 * 源文件：backend/src/routes/register.js
 * 测试文件：backend/test/routes/register.test.js
 */

const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');

// POST /api/auth/validate-username - 验证用户名
router.post('/validate-username', (req, res) => {
  registerController.validateUsername(req, res);
});

// POST /api/auth/validate-password - 验证密码
router.post('/validate-password', (req, res) => {
  registerController.validatePassword(req, res);
});

// POST /api/auth/validate-name - 验证姓名
router.post('/validate-name', (req, res) => {
  registerController.validateName(req, res);
});

// POST /api/auth/validate-idcard - 验证证件号码
router.post('/validate-idcard', (req, res) => {
  registerController.validateIdCard(req, res);
});

// POST /api/auth/validate-email - 验证邮箱
router.post('/validate-email', (req, res) => {
  registerController.validateEmail(req, res);
});

// POST /api/auth/validate-phone - 验证手机号
router.post('/validate-phone', (req, res) => {
  registerController.validatePhone(req, res);
});

// POST /api/register - 用户注册
router.post('/', (req, res) => {
  registerController.register(req, res);
});

// POST /api/register/send-verification-code - 发送注册验证码
router.post('/send-verification-code', (req, res) => {
  registerController.sendRegistrationVerificationCode(req, res);
});

// POST /api/register/complete - 完成注册
router.post('/complete', (req, res) => {
  registerController.completeRegistration(req, res);
});

// GET /api/terms/service-terms - 获取服务条款
router.get('/service-terms', (req, res) => {
  registerController.getServiceTerms(req, res);
});

// GET /api/terms/privacy-policy - 获取隐私政策
router.get('/privacy-policy', (req, res) => {
  registerController.getPrivacyPolicy(req, res);
});

module.exports = router;


/**
 * 密码重置相关API路由
 * 源文件：backend/src/routes/passwordReset.js
 */

const express = require('express');
const router = express.Router();
const passwordResetService = require('../services/passwordResetService');

/**
 * API-POST-VerifyAccount: 验证账户信息
 * POST /api/password-reset/verify-account
 * 请求参数：{ phone, idCardType, idCardNumber }
 * 返回：{ success, sessionId, phone, error }
 */
router.post('/verify-account', async (req, res) => {
  try {
    const { phone, idCardType, idCardNumber } = req.body;

    // 验证必填字段
    if (!phone || !idCardType || !idCardNumber) {
      return res.status(400).json({
        success: false,
        error: '请填写完整的账户信息'
      });
    }

    // 验证手机号格式
    if (!/^\d{11}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: '请输入正确的手机号码'
      });
    }

    // 调用服务验证账户
    const result = await passwordResetService.verifyAccountInfo(phone, idCardType, idCardNumber);

    if (result.success) {
      return res.status(200).json({
        success: true,
        sessionId: result.sessionId,
        phone: result.phone
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('验证账户信息错误:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误，请稍后重试'
    });
  }
});

/**
 * API-POST-SendResetCode: 发送密码重置验证码
 * POST /api/password-reset/send-code
 * 请求参数：{ sessionId }
 * 返回：{ success, verificationCode, phone, error }
 */
router.post('/send-code', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: '缺少会话ID'
      });
    }

    // 发送验证码
    const result = await passwordResetService.sendResetCode(sessionId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        verificationCode: result.verificationCode, // 开发环境返回验证码
        phone: result.phone
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('发送验证码错误:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误，请稍后重试'
    });
  }
});

/**
 * API-POST-VerifyCode: 验证重置验证码
 * POST /api/password-reset/verify-code
 * 请求参数：{ sessionId, code }
 * 返回：{ success, resetToken, error }
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { sessionId, code } = req.body;

    if (!sessionId || !code) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    // 验证验证码
    const result = await passwordResetService.verifyResetCode(sessionId, code);

    if (result.success) {
      return res.status(200).json({
        success: true,
        resetToken: result.resetToken
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('验证验证码错误:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误，请稍后重试'
    });
  }
});

/**
 * API-POST-ResetPassword: 重置密码
 * POST /api/password-reset/reset-password
 * 请求参数：{ resetToken, newPassword, confirmPassword }
 * 返回：{ success, error }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: '请填写完整信息'
      });
    }

    // 重置密码
    const result = await passwordResetService.resetPassword(resetToken, newPassword, confirmPassword);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: '密码重置成功'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('重置密码错误:', error);
    return res.status(500).json({
      success: false,
      error: '服务器错误，请稍后重试'
    });
  }
});

module.exports = router;


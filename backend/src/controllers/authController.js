const { validationResult } = require('express-validator');
const authService = require('../services/authService');

class AuthController {
  // 用户登录
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: errors.array()[0].msg 
        });
      }

      const { identifier, password } = req.body;
      
      // TODO: 实现登录逻辑
      // 1. 验证用户输入格式
      // 2. 查找用户
      // 3. 验证密码
      // 4. 返回会话ID用于短信验证
      
      res.status(200).json({
        success: false,
        message: '功能尚未实现'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  }

  // 发送短信验证码
  async sendVerificationCode(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: errors.array()[0].msg 
        });
      }

      const { sessionId, idCardLast4 } = req.body;
      
      // TODO: 实现发送验证码逻辑
      // 1. 验证会话ID
      // 2. 验证证件号后4位
      // 3. 检查发送频率限制
      // 4. 生成并发送验证码
      
      res.status(200).json({
        success: false,
        message: '功能尚未实现'
      });
    } catch (error) {
      console.error('Send verification code error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  }

  // 短信验证登录
  async verifyLogin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: errors.array()[0].msg 
        });
      }

      const { sessionId, verificationCode } = req.body;
      
      // TODO: 实现验证码验证逻辑
      // 1. 验证会话ID
      // 2. 验证验证码
      // 3. 更新登录状态
      // 4. 返回用户信息和token
      
      res.status(200).json({
        success: false,
        message: '功能尚未实现'
      });
    } catch (error) {
      console.error('Verify login error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  }

  // 获取首页内容
  async getHomePage(req, res) {
    try {
      // TODO: 实现获取首页内容逻辑
      res.status(200).json({
        success: false,
        message: '功能尚未实现'
      });
    } catch (error) {
      console.error('Get homepage error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  }

  // 忘记密码页面
  async getForgotPassword(req, res) {
    try {
      // TODO: 实现忘记密码页面逻辑
      res.status(200).json({
        success: false,
        message: '功能尚未实现'
      });
    } catch (error) {
      console.error('Get forgot password error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  }
}

module.exports = new AuthController();
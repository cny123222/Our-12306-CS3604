const { validationResult } = require('express-validator');
const authService = require('../services/authService');

class AuthController {
  // 用户登录
  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      
      // 验证必填字段
      const errors = [];
      if (!identifier || identifier.trim() === '') {
        errors.push('用户名/邮箱/手机号不能为空');
      }
      if (!password || password.trim() === '') {
        errors.push('密码不能为空');
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          errors 
        });
      }

      // 验证密码长度
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: '密码长度不能少于6位'
        });
      }

      // 验证用户凭据
      const result = await authService.validateCredentials(identifier, password);
      
      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error
        });
      }

      // 创建登录会话
      const sessionId = await authService.createLoginSession(result.user);
      
      // 生成临时token（用于短信验证前的会话）
      const token = authService.generateToken({
        userId: result.user.id,
        username: result.user.username,
        step: 'pending_verification'
      });

      res.status(200).json({
        success: true,
        sessionId,
        token,
        message: '请进行短信验证'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  }

  // 发送短信验证码（登录用）
  async sendVerificationCode(req, res) {
    try {
      const { phoneNumber, sessionId, idCardLast4 } = req.body;

      console.log('🔍 发送验证码请求:', { sessionId, idCardLast4, phoneNumber });

      // 验证必填字段
      const errors = [];
      
      // 如果提供了sessionId和idCardLast4（短信验证弹窗场景）
      if (sessionId && idCardLast4) {
        // 验证证件号后4位格式
        if (!idCardLast4 || idCardLast4.length !== 4) {
          errors.push('证件号后4位格式不正确');
        }

        if (errors.length > 0) {
          console.log('❌ 验证失败:', errors);
          return res.status(400).json({ 
            success: false, 
            error: errors.join(', ')
          });
        }

        // 生成并发送验证码
        const result = await authService.generateAndSendSmsCode(sessionId, idCardLast4);
        
        // 先检查是否是频率限制错误（429），必须在检查 !result.success 之前
        if (result.code === 429) {
          console.log('❌ 请求过于频繁:', result.error);
          return res.status(429).json({
            success: false,
            error: result.error
          });
        }
        
        // 再检查其他类型的失败（400）
        if (!result.success) {
          console.log('❌ 生成验证码失败:', result.error);
          return res.status(400).json({
            success: false,
            error: result.error
          });
        }

        return res.status(200).json({
          success: true,
          message: result.message,
          // 开发环境下返回验证码和手机号，生产环境应该移除
          verificationCode: result.verificationCode,
          phone: result.phone
        });
      }
      
      // 如果只提供了phoneNumber（直接短信登录场景）
      if (phoneNumber) {
        // 验证手机号格式
        if (!authService.validatePhone(phoneNumber)) {
          errors.push('请输入有效的手机号');
          return res.status(400).json({ 
            success: false, 
            errors 
          });
        }

        // 实现直接短信登录的逻辑
        const registrationDbService = require('../services/registrationDbService');
        const sessionService = require('../services/sessionService');
        
        // 检查发送频率
        const canSend = await sessionService.checkSmsSendFrequency(phoneNumber, 'login');
        if (!canSend) {
          return res.status(429).json({
            success: false,
            error: '请求验证码过于频繁，请稍后再试！'
          });
        }

        // 生成并保存验证码
        const code = await registrationDbService.createSmsVerificationCode(phoneNumber, 'login');

        // TODO: 实际发送短信
        console.log(`[SMS] 发送验证码 ${code} 到 ${phoneNumber}`);

        return res.status(200).json({
          success: true,
          message: '验证码已发送'
        });
      }

      // 缺少必要参数
      return res.status(400).json({
        success: false,
        message: '会话ID不能为空'
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
      const { sessionId, verificationCode, phoneNumber, idCardLast4 } = req.body;

      // 验证必填字段
      const errors = [];
      
      if (!verificationCode) {
        errors.push('验证码不能为空');
      } else if (!/^\d{6}$/.test(verificationCode)) {
        errors.push('验证码必须为6位数字');
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          errors 
        });
      }

      // 如果有sessionId，使用账号密码+短信验证流程
      if (sessionId) {
        const result = await authService.verifySmsCode(sessionId, verificationCode);
        
        if (!result.success) {
          // 区分会话错误(400)和验证码错误(401)
          const statusCode = result.error.includes('会话') ? 400 : 401;
          return res.status(statusCode).json({
            success: false,
            error: result.error
          });
        }

        return res.status(200).json({
          success: true,
          sessionId: result.sessionId,
          token: result.token,
          user: result.user,
          message: '登录成功'
        });
      }

      // 如果只有phoneNumber，使用直接短信登录流程
      if (phoneNumber) {
        const registrationDbService = require('../services/registrationDbService');
        const dbService = require('../services/dbService');
        
        // 验证短信验证码
        const verifyResult = await registrationDbService.verifySmsCode(phoneNumber, verificationCode);
        
        if (!verifyResult.success) {
          return res.status(401).json({
            success: false,
            error: verifyResult.error
          });
        }

        // 查找用户
        const query = 'SELECT * FROM users WHERE phone = ?';
        const user = await dbService.get(query, [phoneNumber]);

        if (!user) {
          return res.status(401).json({
            success: false,
            error: '用户不存在'
          });
        }

        // 创建会话
        const newSessionId = authService.generateSessionId(user.id);
        const token = authService.generateToken({
          userId: user.id,
          username: user.username,
          step: 'verified'
        });

        // 更新最后登录时间
        await dbService.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        return res.status(200).json({
          success: true,
          sessionId: newSessionId,
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone
          },
          message: '登录成功'
        });
      }

      // 缺少必要参数
      return res.status(400).json({
        success: false,
        message: '会话ID或手机号不能为空'
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
      res.status(200).json({
        success: true,
        content: {
          title: '欢迎使用中国铁路12306',
          features: [
            { id: 1, name: '车票预订', icon: 'train', description: '便捷的车票预订服务' },
            { id: 2, name: '行程管理', icon: 'calendar', description: '个人行程提醒和管理' },
            { id: 3, name: '积分兑换', icon: 'gift', description: '积分兑换车票和礼品' },
            { id: 4, name: '餐饮特产', icon: 'food', description: '列车餐饮和特产预订' }
          ],
          announcements: []
        }
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
      res.status(200).json({
        success: true,
        content: {
          title: '忘记密码',
          instructions: [
            '请输入您注册时使用的手机号或邮箱',
            '我们将发送验证码到您的手机或邮箱',
            '验证成功后可以重置密码'
          ],
          contactInfo: {
            phone: '12306',
            email: 'service@12306.cn'
          }
        }
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

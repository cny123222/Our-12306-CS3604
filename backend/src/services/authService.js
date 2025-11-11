const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dbService = require('./dbService');
const sessionService = require('./sessionService');
const registrationDbService = require('./registrationDbService');

class AuthService {
  // 验证用户凭据
  async validateCredentials(identifier, password) {
    try {
      // 识别标识符类型
      const type = this.identifyIdentifierType(identifier);
      
      if (type === 'invalid') {
        return { success: false, error: '用户名或密码错误' };
      }

      // 根据类型查找用户
      let user = null;
      if (type === 'username') {
        user = await registrationDbService.findUserByUsername(identifier);
      } else if (type === 'email') {
        const query = 'SELECT * FROM users WHERE email = ?';
        user = await dbService.get(query, [identifier]);
      } else if (type === 'phone') {
        const query = 'SELECT * FROM users WHERE phone = ?';
        user = await dbService.get(query, [identifier]);
      }

      if (!user) {
        return { success: false, error: '用户名或密码错误' };
      }

      // 验证密码
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return { success: false, error: '用户名或密码错误' };
      }

      return { success: true, user };
    } catch (error) {
      console.error('Validate credentials error:', error);
      throw error;
    }
  }

  // 生成会话ID
  generateSessionId(userId) {
    try {
      return uuidv4();
    } catch (error) {
      console.error('Generate session ID error:', error);
      throw error;
    }
  }

  // 创建登录会话
  async createLoginSession(user) {
    try {
      const sessionId = this.generateSessionId(user.id);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
      
      const sessionData = {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        id_card_type: user.id_card_type,
        id_card_number: user.id_card_number,
        step: 'pending_verification' // 等待短信验证
      };

      await sessionService.createSession(sessionId, sessionData, expiresAt);
      
      return sessionId;
    } catch (error) {
      console.error('Create login session error:', error);
      throw error;
    }
  }

  // 验证证件号后4位
  async validateIdCardLast4(sessionId, idCardLast4) {
    try {
      // 获取会话数据
      const session = await sessionService.getSession(sessionId);
      
      if (!session) {
        return { success: false, error: '会话无效或已过期' };
      }

      // session.user_data 已经在 sessionService.getSession 中被解析了
      const sessionData = session.user_data;
      
      // 验证证件号后4位
      if (!sessionData.id_card_number) {
        return { success: false, error: '请输入正确的用户信息！' };
      }

      const last4 = sessionData.id_card_number.slice(-4);
      if (last4 !== idCardLast4) {
        return { success: false, error: '请输入正确的用户信息！' };
      }

      return { success: true, sessionData };
    } catch (error) {
      console.error('Validate ID card last 4 error:', error);
      throw error;
    }
  }

  // 生成并发送短信验证码
  async generateAndSendSmsCode(sessionId, idCardLast4) {
    try {
      // 验证证件号
      const validation = await this.validateIdCardLast4(sessionId, idCardLast4);
      if (!validation.success) {
        return validation;
      }

      const { sessionData } = validation;

      // 检查发送频率
      const canSend = await sessionService.checkSmsSendFrequency(sessionData.phone);
      if (!canSend) {
        return { success: false, error: '发送过于频繁，请稍后再试', code: 429 };
      }

      // 生成并保存验证码
      const code = await registrationDbService.createSmsVerificationCode(sessionData.phone);

      // TODO: 实际发送短信（这里模拟）
      console.log(`[SMS] 发送验证码 ${code} 到 ${sessionData.phone}`);

      return { success: true, message: '验证码已发送', verificationCode: code };
    } catch (error) {
      console.error('Generate and send SMS code error:', error);
      throw error;
    }
  }

  // 验证短信验证码
  async verifySmsCode(sessionId, verificationCode) {
    try {
      // 获取会话数据
      const session = await sessionService.getSession(sessionId);
      
      if (!session) {
        return { success: false, error: '会话无效或已过期' };
      }

      // session.user_data 已经在 sessionService.getSession 中被解析了
      const sessionData = session.user_data;

      // 验证短信验证码
      const isValid = await registrationDbService.verifySmsCode(sessionData.phone, verificationCode);
      
      if (!isValid) {
        return { success: false, error: '验证码错误或已过期' };
      }

      // 更新会话状态为已验证
      sessionData.step = 'verified';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时
      await sessionService.createSession(sessionId, sessionData, expiresAt);

      // 更新用户最后登录时间
      const updateQuery = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
      await dbService.run(updateQuery, [sessionData.userId]);

      // 查询完整用户信息
      const user = await dbService.get('SELECT * FROM users WHERE id = ?', [sessionData.userId]);

      // 生成token
      const token = this.generateToken(sessionData);

      return { 
        success: true, 
        sessionId, 
        token,
        user: {
          id: sessionData.userId,
          username: sessionData.username,
          email: user?.email,
          phone: user?.phone
        }
      };
    } catch (error) {
      console.error('Verify SMS code error:', error);
      throw error;
    }
  }

  // 生成JWT token（简化版，使用sessionId）
  generateToken(user) {
    try {
      // 简化实现：使用base64编码的用户信息
      const tokenData = {
        userId: user.userId,
        username: user.username,
        timestamp: Date.now()
      };
      return Buffer.from(JSON.stringify(tokenData)).toString('base64');
    } catch (error) {
      console.error('Generate token error:', error);
      throw error;
    }
  }

  // 验证用户名格式
  validateUsername(username) {
    // 用户名：6-30位，字母开头，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{5,29}$/;
    return usernameRegex.test(username);
  }

  // 验证邮箱格式
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号格式
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 识别标识符类型
  identifyIdentifierType(identifier) {
    if (this.validateEmail(identifier)) {
      return 'email';
    } else if (this.validatePhone(identifier)) {
      return 'phone';
    } else if (this.validateUsername(identifier)) {
      return 'username';
    }
    return 'invalid';
  }
}

module.exports = new AuthService();

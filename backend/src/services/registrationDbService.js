/**
 * 注册相关数据库服务
 * 源文件：backend/src/services/registrationDbService.js
 * 测试文件：backend/test/services/registrationDbService.test.js
 */

const dbService = require('./dbService');
const bcrypt = require('bcryptjs');

class RegistrationDbService {
  /**
   * DB-FindUserByUsername - 根据用户名查找用户信息
   */
  async findUserByUsername(username) {
    try {
      const user = await dbService.get(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return user || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * DB-FindUserByIdCardNumber - 根据证件类型和证件号码查找用户信息
   */
  async findUserByIdCardNumber(idCardType, idCardNumber) {
    try {
      const user = await dbService.get(
        'SELECT * FROM users WHERE id_card_type = ? AND id_card_number = ?',
        [idCardType, idCardNumber]
      );
      return user || null;
    } catch (error) {
      console.error('Error finding user by ID card:', error);
      throw error;
    }
  }

  /**
   * DB-CreateUser - 在数据库中创建新用户记录
   */
  async createUser(userData) {
    try {
      // 1. 加密密码
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // 2. 插入用户记录
      const result = await dbService.run(
        `INSERT INTO users (
          username, password, name, email, phone, 
          id_card_type, id_card_number, discount_type, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          userData.username,
          hashedPassword,
          userData.name,
          userData.email || null,
          userData.phone,
          userData.id_card_type,
          userData.id_card_number,
          userData.discount_type
        ]
      );

      // 3. 返回用户ID
      return result.lastID;
    } catch (error) {
      console.error('Error creating user:', error);
      // 检查唯一性约束错误
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('User already exists');
      }
      throw error;
    }
  }

  /**
   * DB-CreateEmailVerificationCode - 创建并存储邮箱验证码记录
   */
  async createEmailVerificationCode(email) {
    try {
      // 1. 生成6位数字验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. 计算过期时间（10分钟）
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      // 3. 存储到数据库
      await dbService.run(
        `INSERT INTO email_verification_codes (
          email, code, created_at, expires_at, sent_status, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          email,
          code,
          now.toISOString(),
          expiresAt.toISOString(),
          'sent',
          now.toISOString()
        ]
      );

      return {
        email: email,
        code: code,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        sent_status: 'sent',
        sent_at: now.toISOString()
      };
    } catch (error) {
      console.error('Error creating email verification code:', error);
      throw error;
    }
  }

  /**
   * DB-VerifyEmailCode - 验证邮箱验证码是否正确且未过期
   */
  async verifyEmailCode(email, code) {
    try {
      // 1. 查找验证码记录（未使用的最新记录）
      const record = await dbService.get(
        `SELECT * FROM email_verification_codes 
         WHERE email = ? AND code = ? AND used = 0
         ORDER BY created_at DESC LIMIT 1`,
        [email, code]
      );

      if (!record) {
        return false;
      }

      // 2. 检查是否过期
      const now = new Date();
      const expiresAt = new Date(record.expires_at);
      if (now > expiresAt) {
        return false;
      }

      // 3. 标记为已使用
      await dbService.run(
        'UPDATE email_verification_codes SET used = 1 WHERE id = ?',
        [record.id]
      );

      return true;
    } catch (error) {
      console.error('Error verifying email code:', error);
      throw error;
    }
  }

  /**
   * 创建短信验证码
   */
  async createSmsVerificationCode(phone) {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5分钟后过期

      await dbService.run(
        `INSERT INTO verification_codes (phone, code, created_at, expires_at, sent_status, sent_at) 
         VALUES (?, ?, ?, ?, 'sent', ?)`,
        [phone, code, now.toISOString(), expiresAt.toISOString(), now.toISOString()]
      );

      return code;
    } catch (error) {
      console.error('Error creating sms verification code:', error);
      throw error;
    }
  }

  /**
   * 验证短信验证码
   */
  async verifySmsCode(phone, code) {
    try {
      const record = await dbService.get(
        `SELECT * FROM verification_codes 
         WHERE phone = ? AND code = ? AND used = 0 
         ORDER BY created_at DESC LIMIT 1`,
        [phone, code]
      );

      if (!record) {
        return false;
      }

      // 检查是否过期
      const now = new Date();
      const expiresAt = new Date(record.expires_at);
      if (now > expiresAt) {
        return false;
      }

      // 标记为已使用
      await dbService.run(
        'UPDATE verification_codes SET used = 1 WHERE id = ?',
        [record.id]
      );

      return true;
    } catch (error) {
      console.error('Error verifying sms code:', error);
      throw error;
    }
  }
}

module.exports = new RegistrationDbService();


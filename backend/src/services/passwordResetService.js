/**
 * 密码重置服务
 * 源文件：backend/src/services/passwordResetService.js
 */

const dbService = require('./dbService');
const registrationDbService = require('./registrationDbService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class PasswordResetService {
  constructor() {
    // 存储密码重置会话
    this.resetSessions = new Map();
    // 存储重置令牌
    this.resetTokens = new Map();
  }

  /**
   * 验证账户信息（手机号+证件类型+证件号码）
   * @param {string} phone - 手机号
   * @param {string} idCardType - 证件类型
   * @param {string} idCardNumber - 证件号码
   * @returns {Object} { success: boolean, sessionId: string, error: string }
   */
  async verifyAccountInfo(phone, idCardType, idCardNumber) {
    try {
      console.log('\n🔍 验证账户信息:', { phone, idCardType, idCardNumber });

      // 查找用户
      const user = await dbService.get(
        'SELECT * FROM users WHERE phone = ? AND id_card_type = ? AND id_card_number = ?',
        [phone, idCardType, idCardNumber]
      );

      if (!user) {
        console.log('❌ 账户信息不匹配');
        return {
          success: false,
          error: '您输入的手机号码或证件号码不正确，请重新输入。'
        };
      }

      // 生成会话ID
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // 存储会话信息
      this.resetSessions.set(sessionId, {
        userId: user.id,
        phone: user.phone,
        username: user.username,
        createdAt: Date.now(),
        verified: false
      });

      console.log('✅ 账户验证成功，生成sessionId:', sessionId);

      return {
        success: true,
        sessionId,
        phone: user.phone
      };
    } catch (error) {
      console.error('验证账户信息失败:', error);
      throw error;
    }
  }

  /**
   * 发送密码重置验证码
   * @param {string} sessionId - 会话ID
   * @returns {Object} { success: boolean, verificationCode: string, phone: string, error: string }
   */
  async sendResetCode(sessionId) {
    try {
      console.log('\n📱 发送密码重置验证码, sessionId:', sessionId);

      // 验证会话
      const session = this.resetSessions.get(sessionId);
      if (!session) {
        console.log('❌ 无效的会话ID');
        return {
          success: false,
          error: '会话已过期，请重新开始'
        };
      }

      // 检查会话是否过期（30分钟）
      if (Date.now() - session.createdAt > 30 * 60 * 1000) {
        this.resetSessions.delete(sessionId);
        console.log('❌ 会话已过期');
        return {
          success: false,
          error: '会话已过期，请重新开始'
        };
      }

      // 生成验证码（120秒有效期）
      const code = await registrationDbService.createSmsVerificationCode(
        session.phone,
        'password-reset'
      );

      console.log('✅ 验证码生成成功:', code);

      return {
        success: true,
        verificationCode: code,
        phone: session.phone
      };
    } catch (error) {
      console.error('发送验证码失败:', error);
      throw error;
    }
  }

  /**
   * 验证重置验证码
   * @param {string} sessionId - 会话ID
   * @param {string} code - 验证码
   * @returns {Object} { success: boolean, resetToken: string, error: string }
   */
  async verifyResetCode(sessionId, code) {
    try {
      console.log('\n🔐 验证重置验证码, sessionId:', sessionId);

      // 验证会话
      const session = this.resetSessions.get(sessionId);
      if (!session) {
        console.log('❌ 无效的会话ID');
        return {
          success: false,
          error: '会话已过期，请重新开始'
        };
      }

      // 验证验证码
      const verifyResult = await registrationDbService.verifySmsCode(session.phone, code);
      
      if (!verifyResult.success) {
        console.log('❌ 验证码验证失败');
        return {
          success: false,
          error: verifyResult.error
        };
      }

      // 生成重置令牌
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // 存储重置令牌（10分钟有效）
      this.resetTokens.set(resetToken, {
        userId: session.userId,
        createdAt: Date.now()
      });

      // 标记会话为已验证
      session.verified = true;

      console.log('✅ 验证码验证成功，生成resetToken');

      return {
        success: true,
        resetToken
      };
    } catch (error) {
      console.error('验证码验证失败:', error);
      throw error;
    }
  }

  /**
   * 重置密码
   * @param {string} resetToken - 重置令牌
   * @param {string} newPassword - 新密码
   * @param {string} confirmPassword - 确认密码
   * @returns {Object} { success: boolean, error: string }
   */
  async resetPassword(resetToken, newPassword, confirmPassword) {
    try {
      console.log('\n🔄 重置密码');

      // 验证令牌
      const tokenData = this.resetTokens.get(resetToken);
      if (!tokenData) {
        console.log('❌ 无效的重置令牌');
        return {
          success: false,
          error: '重置链接已过期，请重新开始'
        };
      }

      // 检查令牌是否过期（10分钟）
      if (Date.now() - tokenData.createdAt > 10 * 60 * 1000) {
        this.resetTokens.delete(resetToken);
        console.log('❌ 重置令牌已过期');
        return {
          success: false,
          error: '重置链接已过期，请重新开始'
        };
      }

      // 验证密码一致性
      if (newPassword !== confirmPassword) {
        console.log('❌ 两次密码输入不一致');
        return {
          success: false,
          error: '两次密码输入不一致'
        };
      }

      // 验证密码格式
      if (newPassword.length < 6) {
        return {
          success: false,
          error: '密码长度不能少于6位'
        };
      }

      // 验证密码复杂度（至少包含字母、数字、下划线中的两种）
      const hasLetter = /[a-zA-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasUnderscore = /_/.test(newPassword);
      const typesCount = [hasLetter, hasNumber, hasUnderscore].filter(Boolean).length;

      if (typesCount < 2) {
        return {
          success: false,
          error: '密码需包含字母、数字、下划线中不少于两种'
        };
      }

      // 加密新密码
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // 更新数据库中的密码
      await dbService.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, tokenData.userId]
      );

      // 清理令牌和相关会话
      this.resetTokens.delete(resetToken);
      // 清理该用户的所有会话
      for (const [sessId, sess] of this.resetSessions.entries()) {
        if (sess.userId === tokenData.userId) {
          this.resetSessions.delete(sessId);
        }
      }

      console.log('✅ 密码重置成功');

      return {
        success: true
      };
    } catch (error) {
      console.error('重置密码失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期的会话和令牌
   */
  cleanupExpiredData() {
    const now = Date.now();
    
    // 清理过期会话（30分钟）
    for (const [sessionId, session] of this.resetSessions.entries()) {
      if (now - session.createdAt > 30 * 60 * 1000) {
        this.resetSessions.delete(sessionId);
      }
    }

    // 清理过期令牌（10分钟）
    for (const [token, tokenData] of this.resetTokens.entries()) {
      if (now - tokenData.createdAt > 10 * 60 * 1000) {
        this.resetTokens.delete(token);
      }
    }
  }
}

// 创建单例
const passwordResetService = new PasswordResetService();

// 定期清理过期数据（每5分钟）
setInterval(() => {
  passwordResetService.cleanupExpiredData();
}, 5 * 60 * 1000);

module.exports = passwordResetService;


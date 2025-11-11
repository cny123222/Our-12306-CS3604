/**
 * 会话服务
 * 处理用户注册会话的管理
 */

const dbService = require('./dbService');
const { v4: uuidv4 } = require('uuid');

class SessionService {
  /**
   * 创建会话
   * 支持两种调用方式：
   * 1. createSession(userData) - 自动生成sessionId和过期时间（用于注册）
   * 2. createSession(sessionId, userData, expiresAt) - 使用指定的sessionId和过期时间（用于登录）
   */
  async createSession(sessionIdOrUserData, userData, expiresAt) {
    try {
      let sessionId, sessionData, expireTime;
      
      // 判断调用方式
      if (typeof sessionIdOrUserData === 'string') {
        // 方式2: createSession(sessionId, userData, expiresAt)
        sessionId = sessionIdOrUserData;
        sessionData = userData;
        expireTime = expiresAt || new Date(Date.now() + 30 * 60 * 1000);
      } else {
        // 方式1: createSession(userData)
        sessionId = uuidv4();
        sessionData = sessionIdOrUserData;
        expireTime = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
      }
      
      await dbService.run(
        `INSERT OR REPLACE INTO sessions (session_id, user_data, expires_at) VALUES (?, ?, ?)`,
        [sessionId, JSON.stringify(sessionData), expireTime.toISOString()]
      );
      
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * 获取会话数据
   */
  async getSession(sessionId) {
    try {
      if (!sessionId) {
        return null;
      }

      const session = await dbService.get(
        `SELECT * FROM sessions WHERE session_id = ? AND expires_at > datetime('now')`,
        [sessionId]
      );

      if (!session) {
        return null;
      }

      return {
        ...session,
        user_data: JSON.parse(session.user_data)
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId) {
    try {
      await dbService.run(
        `DELETE FROM sessions WHERE session_id = ?`,
        [sessionId]
      );
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * 检查邮箱验证码发送频率
   */
  async checkEmailSendFrequency(email) {
    try {
      // 检查最近1分钟内是否已发送
      const recentCode = await dbService.get(
        `SELECT * FROM email_verification_codes 
         WHERE email = ? 
         AND datetime(sent_at) > datetime('now', '-1 minute')
         ORDER BY sent_at DESC LIMIT 1`,
        [email]
      );

      return !recentCode; // 没有最近发送记录则返回true（可以发送）
    } catch (error) {
      console.error('Error checking email send frequency:', error);
      return false;
    }
  }

  /**
   * 检查短信验证码发送频率
   */
  async checkSmsSendFrequency(phone) {
    try {
      // 检查最近1分钟内是否已发送
      const recentCode = await dbService.get(
        `SELECT * FROM verification_codes 
         WHERE phone = ? 
         AND datetime(sent_at) > datetime('now', '-1 minute')
         ORDER BY sent_at DESC LIMIT 1`,
        [phone]
      );

      return !recentCode; // 没有最近发送记录则返回true（可以发送）
    } catch (error) {
      console.error('Error checking sms send frequency:', error);
      return false;
    }
  }
}

module.exports = new SessionService();


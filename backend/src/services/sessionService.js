/**
 * 会话服务
 * 处理用户注册会话的管理
 */

const dbService = require('./dbService');
const { v4: uuidv4 } = require('uuid');

class SessionService {
  /**
   * 创建注册会话
   */
  async createSession(userData) {
    try {
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
      
      await dbService.run(
        `INSERT INTO sessions (session_id, user_data, expires_at) VALUES (?, ?, ?)`,
        [sessionId, JSON.stringify(userData), expiresAt.toISOString()]
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


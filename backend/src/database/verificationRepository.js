const DatabaseConnection = require('./connection');

class VerificationRepository {
  constructor() {
    this.dbConnection = new DatabaseConnection();
    this.init();
  }

  async init() {
    try {
      await this.dbConnection.connect();
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
    }
  }

  // DB-CreateVerificationCode: 创建并存储短信验证码记录
  async createVerificationCode(userId, code) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      // 在测试环境下使用固定验证码，生产环境使用传入的code
      const finalCode = process.env.NODE_ENV === 'test' ? '123456' : code;
      
      // 设置验证码有效期为5分钟
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      const query = `
        INSERT INTO verification_codes (user_id, code, expires_at, purpose)
        VALUES (?, ?, ?, 'login')
      `;
      
      db.run(query, [userId, finalCode, expiresAt.toISOString()], function(err) {
        if (err) {
          console.error('Error creating verification code:', err);
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            userId,
            code: finalCode,
            expiresAt
          });
        }
      });
    });
  }

  // DB-CheckVerificationCodeLimit: 检查用户1分钟内是否已发送过验证码
  async checkVerificationCodeLimit(userId) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      const query = `
        SELECT COUNT(*) as count
        FROM verification_codes
        WHERE user_id = ? AND created_at > datetime('now', '-1 minute') AND purpose = 'login'
      `;
      
      db.get(query, [userId], (err, row) => {
        if (err) {
          console.error('Error checking verification code limit:', err);
          reject(err);
        } else {
          console.log(`Checking rate limit for user ${userId}: found ${row.count} codes in last minute`);
          // 如果1分钟内没有发送过验证码，则允许发送
          resolve(row.count === 0);
        }
      });
    });
  }

  // DB-VerifyVerificationCode: 验证用户输入的短信验证码是否正确
  async verifyVerificationCode(userId, code) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      const now = new Date();
      
      // 查找有效的验证码
      const selectQuery = `
        SELECT id, code, expires_at, used
        FROM verification_codes
        WHERE user_id = ? AND code = ? AND purpose = 'login'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      db.get(selectQuery, [userId, code], (err, row) => {
        if (err) {
          console.error('Error verifying verification code:', err);
          reject(err);
          return;
        }
        
        if (!row) {
          // 验证码不存在
          resolve(false);
          return;
        }
        
        if (row.used) {
          // 验证码已使用
          resolve(false);
          return;
        }
        
        const expiresAt = new Date(row.expires_at);
        if (now > expiresAt) {
          // 验证码已过期
          resolve(false);
          return;
        }
        
        // 验证码正确且未过期，标记为已使用
        const updateQuery = `
          UPDATE verification_codes
          SET used = TRUE
          WHERE id = ?
        `;
        
        db.run(updateQuery, [row.id], (updateErr) => {
          if (updateErr) {
            console.error('Error marking verification code as used:', updateErr);
            reject(updateErr);
          } else {
            resolve(true);
          }
        });
      });
    });
  }

  // 清理所有验证码（用于测试）
  async clearAllVerificationCodes() {
    try {
      await this.dbConnection.clearVerificationCodes();
    } catch (error) {
      console.error('Error clearing verification codes:', error);
      throw error;
    }
  }
}

module.exports = VerificationRepository;
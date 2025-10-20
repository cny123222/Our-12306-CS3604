const DatabaseConnection = require('./connection');

class UserRepository {
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

  // DB-FindUserByUsername: 根据用户名查询用户信息
  async findUserByUsername(loginId) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      // 支持用户名、邮箱、手机号查询
      const query = `
        SELECT id, username, email, phone, password_hash, id_card_last4, 
               last_login_time, created_at
        FROM users 
        WHERE username = ? OR email = ? OR phone = ?
      `;
      
      db.get(query, [loginId, loginId, loginId], (err, row) => {
        if (err) {
          console.error('Error finding user:', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // DB-VerifyUserPassword: 验证用户密码是否正确
  async verifyUserPassword(userId, password) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      const query = `SELECT password_hash FROM users WHERE id = ?`;
      
      db.get(query, [userId], (err, row) => {
        if (err) {
          console.error('Error verifying password:', err);
          reject(err);
        } else if (!row) {
          resolve(false);
        } else {
          // 简单的密码比较（实际项目中应该使用bcrypt等加密）
          resolve(row.password_hash === password);
        }
      });
    });
  }

  // DB-VerifyUserIdCard: 验证用户证件号后4位是否正确
  async verifyUserIdCard(userId, idCardLast4) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      const query = `SELECT id_card_last4 FROM users WHERE id = ?`;
      
      db.get(query, [userId], (err, row) => {
        if (err) {
          console.error('Error verifying ID card:', err);
          reject(err);
        } else if (!row) {
          resolve(false);
        } else {
          resolve(row.id_card_last4 === idCardLast4);
        }
      });
    });
  }

  // DB-GetUserPhoneNumber: 获取用户绑定的手机号码
  async getUserPhoneNumber(userId) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      const query = `SELECT phone FROM users WHERE id = ?`;
      
      db.get(query, [userId], (err, row) => {
        if (err) {
          console.error('Error getting user phone:', err);
          reject(err);
        } else {
          resolve(row ? row.phone : null);
        }
      });
    });
  }

  // DB-GetUserById: 根据用户ID获取完整用户信息
  async getUserById(userId) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      const query = `
        SELECT id, username, email, phone, id_card_last4, 
               created_at, last_login_time
        FROM users 
        WHERE id = ?
      `;
      
      db.get(query, [userId], (err, row) => {
        if (err) {
          console.error('Error getting user by ID:', err);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // DB-UpdateUserLoginTime: 更新用户最后登录时间
  async updateUserLoginTime(userId, loginInfo) {
    return new Promise((resolve, reject) => {
      const db = this.dbConnection.getConnection();
      
      const query = `
        UPDATE users 
        SET last_login_time = ?, login_ip = ?, user_agent = ?
        WHERE id = ?
      `;
      
      const { loginTime, ip, userAgent } = loginInfo;
      
      db.run(query, [loginTime, ip, userAgent, userId], function(err) {
        if (err) {
          console.error('Error updating login time:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }
}

module.exports = UserRepository;
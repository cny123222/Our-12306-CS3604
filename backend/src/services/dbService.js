const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    this.db = null;
    this.init();
  }

  // 初始化数据库连接
  init() {
    const dbPath = process.env.NODE_ENV === 'test' 
      ? process.env.TEST_DB_PATH || './database/test.db'
      : process.env.DB_PATH || './database/railway.db';
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  // 创建数据表
  createTables() {
    // TODO: 创建用户表、验证码表等
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        id_card TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSmsCodesTable = `
      CREATE TABLE IF NOT EXISTS sms_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        code TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    this.db.run(createUsersTable);
    this.db.run(createSmsCodesTable);
  }

  // DB-FindUserByIdentifier: 根据用户名/邮箱/手机号查找用户
  async findUserByIdentifier(identifier, type) {
    return new Promise((resolve, reject) => {
      // TODO: 实现根据标识符查找用户的逻辑
      reject(new Error('功能尚未实现'));
    });
  }

  // DB-VerifyPassword: 验证用户密码
  async verifyPassword(userId, password) {
    return new Promise((resolve, reject) => {
      // TODO: 实现密码验证逻辑
      reject(new Error('功能尚未实现'));
    });
  }

  // DB-CreateSmsCode: 创建短信验证码
  async createSmsCode(userId, phone, code) {
    return new Promise((resolve, reject) => {
      // TODO: 实现创建短信验证码逻辑
      reject(new Error('功能尚未实现'));
    });
  }

  // DB-VerifySmsCode: 验证短信验证码
  async verifySmsCode(userId, code) {
    return new Promise((resolve, reject) => {
      // TODO: 实现验证短信验证码逻辑
      reject(new Error('功能尚未实现'));
    });
  }

  // DB-CheckSmsFrequency: 检查短信发送频率限制
  async checkSmsFrequency(userId) {
    return new Promise((resolve, reject) => {
      // TODO: 实现检查短信发送频率逻辑
      reject(new Error('功能尚未实现'));
    });
  }

  // DB-UpdateLoginStatus: 更新用户登录状态
  async updateLoginStatus(userId, status) {
    return new Promise((resolve, reject) => {
      // TODO: 实现更新登录状态逻辑
      reject(new Error('功能尚未实现'));
    });
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = new DatabaseService();
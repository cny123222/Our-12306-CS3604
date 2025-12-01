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
      ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
      : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
    
    console.log('[dbService] 数据库路径:', dbPath);
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('Connected to SQLite database:', dbPath);
        this.db.exec("PRAGMA journal_mode=WAL;");
        this.db.exec("PRAGMA busy_timeout=5000;");
        this.db.exec("PRAGMA synchronous=NORMAL;");
        this.createTables();
      }
    });
  }

  // 创建数据表
  createTables() {
    // 创建用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT UNIQUE NOT NULL,
        id_card_type TEXT,
        id_card_number TEXT,
        discount_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        UNIQUE(id_card_type, id_card_number)
      )
    `;

    // 创建短信验证码表
    const createVerificationCodesTable = `
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        sent_status TEXT DEFAULT 'sent',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        purpose TEXT DEFAULT 'login'
      )
    `;

    // 创建邮箱验证码表
    const createEmailVerificationCodesTable = `
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        sent_status TEXT DEFAULT 'sent',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建会话表
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        user_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL
      )
    `;

    this.db.run(createUsersTable);
    this.db.run(createVerificationCodesTable);
    this.db.run(createEmailVerificationCodesTable);
    this.db.run(createSessionsTable);
    
    // 数据库迁移：为现有 verification_codes 表添加 purpose 字段
    this.migrateVerificationCodesTable();
  }
  
  // 数据库迁移：添加 purpose 字段
  migrateVerificationCodesTable() {
    // 检查 purpose 列是否存在
    this.db.all("PRAGMA table_info(verification_codes)", (err, columns) => {
      if (err) {
        console.error('Error checking table info:', err);
        return;
      }
      
      const hasPurposeColumn = columns.some(col => col.name === 'purpose');
      
      if (!hasPurposeColumn) {
        // 添加 purpose 列
        this.db.run(
          "ALTER TABLE verification_codes ADD COLUMN purpose TEXT DEFAULT 'login'",
          (err) => {
            if (err) {
              console.error('Error adding purpose column:', err);
            } else {
              console.log('Successfully added purpose column to verification_codes table');
            }
          }
        );
      }
    });
  }

  // 通用查询方法 - 返回单行
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 通用查询方法 - 返回所有行
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 通用执行方法 - INSERT, UPDATE, DELETE
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // 关闭数据库连接
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed');
            this.db = null; // 清空引用
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new DatabaseService();

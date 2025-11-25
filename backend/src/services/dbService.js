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

    // 先创建表，然后等待创建完成后再执行迁移
    this.db.run(createUsersTable);
    this.db.run(createEmailVerificationCodesTable);
    this.db.run(createSessionsTable);
    
    // 创建 verification_codes 表，并在创建完成后执行迁移
    this.db.run(createVerificationCodesTable, (err) => {
      if (err) {
        console.error('Error creating verification_codes table:', err);
      } else {
        // 表创建完成后，执行迁移（为旧数据库添加 purpose 字段）
        // 注意：新创建的表已经包含 purpose 字段，迁移只会对旧数据库生效
        this.migrateVerificationCodesTable();
      }
    });
  }
  
  // 数据库迁移：添加 purpose 字段
  migrateVerificationCodesTable() {
    // 先检查表是否存在
    this.db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='verification_codes'",
      (err, tables) => {
        if (err) {
          console.error('Error checking if verification_codes table exists:', err);
          return;
        }
        
        // 如果表不存在，说明是新数据库，新表已经包含 purpose 字段，不需要迁移
        if (!tables || tables.length === 0) {
          console.log('verification_codes table does not exist yet, migration skipped (table will be created with purpose column)');
          return;
        }
        
        // 表存在，检查 purpose 列是否存在
        this.db.all("PRAGMA table_info(verification_codes)", (err, columns) => {
          if (err) {
            console.error('Error checking table info:', err);
            return;
          }
          
          const hasPurposeColumn = columns.some(col => col.name === 'purpose');
          
          if (!hasPurposeColumn) {
            // 添加 purpose 列（仅对旧数据库）
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
          } else {
            console.log('verification_codes table already has purpose column, migration skipped');
          }
        });
      }
    );
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
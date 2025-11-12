const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const path = require('path')

class DatabaseConfig {
  constructor() {
    this.db = null
    this.testDb = null
  }

  async initDatabase(isTest = false) {
    const dbPath = isTest 
      ? process.env.TEST_DB_PATH || path.join(__dirname, '../../test.db')
      : process.env.DB_PATH || path.join(__dirname, '../../database.db')

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    // 创建用户表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        id_card VARCHAR(18),
        real_name VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )
    `)

    // 创建短信验证码表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sms_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        used BOOLEAN DEFAULT 0,
        INDEX idx_phone_created (phone_number, created_at),
        INDEX idx_expires (expires_at)
      )
    `)

    // 创建会话表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id VARCHAR(36) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `)

    if (isTest) {
      this.testDb = db
      // 插入测试数据
      await this.insertTestData(db)
    } else {
      this.db = db
    }

    return db
  }

  async insertTestData(db) {
    // 插入测试用户
    await db.run(`
      INSERT OR IGNORE INTO users (username, email, phone, password_hash, real_name, id_card) 
      VALUES 
        ('testuser', 'test@example.com', '13800138000', 'hashedpassword123', '张三', '110101199001011234'),
        ('user2', 'user2@example.com', '13900139000', 'hashedpassword456', '李四', '110101199002022345')
    `)

    // 插入有效的短信验证码
    const now = Date.now()
    await db.run(`
      INSERT OR IGNORE INTO sms_codes (phone_number, code, created_at, expires_at) 
      VALUES 
        ('13800138000', '123456', ?, ?),
        ('13900139000', '654321', ?, ?)
    `, [now, now + 300000, now, now + 300000])
  }

  async closeDatabase(isTest = false) {
    if (isTest && this.testDb) {
      await this.testDb.close()
      this.testDb = null
    } else if (this.db) {
      await this.db.close()
      this.db = null
    }
  }

  getDatabase(isTest = false) {
    return isTest ? this.testDb : this.db
  }
}

module.exports = new DatabaseConfig()
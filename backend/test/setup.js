const path = require('path')
const fs = require('fs')
const databaseConfig = require('../src/config/database')

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.TEST_DB_PATH = path.join(__dirname, 'test.db')
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

// 全局测试设置
beforeAll(async () => {
  // 初始化测试数据库
  await databaseConfig.initDatabase(true)
})

afterAll(async () => {
  // 清理测试数据库
  await databaseConfig.closeDatabase(true)
  
  // 删除测试数据库文件
  const testDbPath = process.env.TEST_DB_PATH
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }
})

beforeEach(async () => {
  // 每个测试前清理数据
  const db = databaseConfig.getDatabase(true)
  if (db) {
    await db.run('DELETE FROM sessions')
    await db.run('DELETE FROM sms_codes')
    
    // 重新插入基础测试数据
    await databaseConfig.insertTestData(db)
  }
})

// 全局测试工具函数
global.testUtils = {
  createTestUser: async (userData = {}) => {
    const db = databaseConfig.getDatabase(true)
    const defaultUser = {
      username: 'testuser' + Date.now(),
      email: `test${Date.now()}@example.com`,
      phone: `138${Date.now().toString().slice(-8)}`,
      password_hash: 'hashedpassword',
      real_name: '测试用户',
      id_card: '110101199001011234'
    }
    
    const user = { ...defaultUser, ...userData }
    
    const result = await db.run(`
      INSERT INTO users (username, email, phone, password_hash, real_name, id_card)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [user.username, user.email, user.phone, user.password_hash, user.real_name, user.id_card])
    
    return { ...user, id: result.lastID }
  },
  
  createTestSmsCode: async (phoneNumber, code = '123456') => {
    const db = databaseConfig.getDatabase(true)
    const now = Date.now()
    
    await db.run(`
      INSERT INTO sms_codes (phone_number, code, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `, [phoneNumber, code, now, now + 300000])
    
    return { phoneNumber, code, createdAt: now, expiresAt: now + 300000 }
  },
  
  cleanupTestData: async () => {
    const db = databaseConfig.getDatabase(true)
    if (db) {
      await db.run('DELETE FROM sessions')
      await db.run('DELETE FROM sms_codes')
      await db.run('DELETE FROM users WHERE username LIKE "testuser%"')
    }
  }
}

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [__filename],
  testTimeout: 10000
}
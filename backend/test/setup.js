const path = require('path')
const fs = require('fs')

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.TEST_DB_PATH = path.join(__dirname, 'test.db')
process.env.DB_PATH = path.join(__dirname, 'test.db')
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

// 清理旧的测试数据库 - 添加重试机制
const testDbPath = process.env.TEST_DB_PATH
if (fs.existsSync(testDbPath)) {
  // 多次尝试删除，防止文件被锁定
  let deleted = false
  for (let i = 0; i < 5; i++) {
    try {
      fs.unlinkSync(testDbPath)
      deleted = true
      break
    } catch (err) {
      // 等待100ms后重试
      const start = Date.now()
      while (Date.now() - start < 100) {
        // Busy wait
      }
    }
  }
  // 如果删除失败，不抛出错误，继续使用现有数据库
  if (!deleted) {
    console.log('Warning: Could not delete old test database, reusing existing file')
  }
}

// 导入dbService以初始化数据库
const dbService = require('../src/services/dbService')
const { initTestDatabase } = require('./init-test-db')

// 给数据库一点时间来初始化
beforeAll(async () => {
  // 等待数据库初始化完成
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // 初始化测试数据库（创建表和插入测试数据）
  await initTestDatabase(testDbPath)
  
  // 再等待一下确保数据库完全初始化
  await new Promise(resolve => setTimeout(resolve, 200))
}, 30000)

// 全局测试设置
afterAll(async () => {
  // 关闭数据库连接
  dbService.close()
  
  // 给数据库更多时间来关闭所有连接
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 删除测试数据库文件
  if (fs.existsSync(testDbPath)) {
    try {
      // 多次尝试删除，防止文件被锁定
      let attempts = 0
      const maxAttempts = 5
      while (attempts < maxAttempts) {
        try {
          fs.unlinkSync(testDbPath)
          break
        } catch (err) {
          attempts++
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
      }
    } catch (err) {
      // 忽略最终删除错误
    }
  }
}, 30000)

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [__filename],
  testTimeout: 10000
}
const path = require('path')
const fs = require('fs')

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.TEST_DB_PATH = path.join(__dirname, 'test.db')
process.env.DB_PATH = path.join(__dirname, 'test.db')
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

// 测试数据库路径
const testDbPath = process.env.TEST_DB_PATH

// 延迟导入 dbService，避免与初始化写入并发导致锁
let dbService
const { initTestDatabase } = require('./init-test-db')

// 给数据库一点时间来初始化
beforeAll(async () => {
  // 等待数据库初始化完成
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 初始化测试数据库（创建表和插入测试数据）
  await initTestDatabase(testDbPath)
  
  // 再等待一下确保数据库完全初始化
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 初始化共享数据库服务（在初始化完成之后再打开连接）
  dbService = require('../src/services/dbService')
})

// 全局测试设置
afterAll(async () => {
  // 关闭数据库连接（等待完成）
  if (dbService && dbService.close) {
    await dbService.close()
  }
  
  // 给数据库更多时间来完全释放文件锁
  await new Promise(resolve => setTimeout(resolve, 500))
})

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [__filename],
  testTimeout: 30000
}

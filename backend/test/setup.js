const path = require('path')
const fs = require('fs')

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.TEST_DB_PATH = path.join(__dirname, 'test.db')
process.env.DB_PATH = path.join(__dirname, 'test.db')
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

// 清理旧的测试数据库
const testDbPath = process.env.TEST_DB_PATH
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath)
}

// 导入dbService以初始化数据库
const dbService = require('../src/services/dbService')

// 给数据库一点时间来初始化
beforeAll(async () => {
  // 等待数据库初始化完成
  await new Promise(resolve => setTimeout(resolve, 100))
})

// 全局测试设置
afterAll(async () => {
  // 关闭数据库连接
  dbService.close()
  
  // 给数据库一点时间来关闭
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 删除测试数据库文件
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath)
    } catch (err) {
      // 忽略删除错误
    }
  }
})

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [__filename],
  testTimeout: 10000
}
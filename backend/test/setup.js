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
  try {
    fs.unlinkSync(testDbPath)
  } catch (err) {
    // 文件可能被锁定，等待一下再试
    console.log('等待数据库文件解锁...')
    setTimeout(() => {
      try {
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath)
        }
      } catch (e) {
        // 忽略删除错误，让测试继续
        console.warn('无法删除旧数据库文件，将使用现有文件')
      }
    }, 500)
  }
}

// 导入dbService以初始化数据库
const dbService = require('../src/services/dbService')
const { initTestDatabase } = require('./init-test-db')

// 给数据库一点时间来初始化
beforeAll(async () => {
  // 等待数据库初始化完成
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 初始化测试数据库（创建表和插入测试数据）
  await initTestDatabase(testDbPath)
  
  // 再等待一下确保数据库完全初始化
  await new Promise(resolve => setTimeout(resolve, 100))
})

// 全局测试设置
afterAll(async () => {
  // 关闭数据库连接（等待完成）
  await dbService.close()
  
  // 给数据库更多时间来完全释放文件锁
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 删除测试数据库文件
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath)
    } catch (err) {
      // 在 Windows 上文件可能仍被锁定，忽略删除错误
      console.warn('无法删除测试数据库文件:', err.message)
    }
  }
})

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [__filename],
  testTimeout: 10000
}
const path = require('path')
const fs = require('fs')

process.env.NODE_ENV = 'test'
process.env.TEST_DB_PATH = path.join(__dirname, 'test.db')
process.env.DB_PATH = path.join(__dirname, 'test.db')
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

const dbService = require('../src/services/dbService')
const rawDb = require('../src/database')
const { initTestDatabase } = require('./init-test-db')

const testDbPath = process.env.TEST_DB_PATH

beforeAll(async () => {
  await initTestDatabase(testDbPath)
})

afterAll(async () => {
  await dbService.close()
  await rawDb.close()
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath)
    } catch (err) {}
  }
})

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [__filename],
  testTimeout: 20000
}

const DbService = require('../../src/services/dbService')
const path = require('path')
const fs = require('fs')

describe('DbService', () => {
  let dbService
  const testDbPath = path.join(__dirname, '../test.db')

  beforeEach(async () => {
    // 清理测试数据库
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    
    dbService = new DbService(testDbPath)
    await dbService.init()
  })

  afterEach(async () => {
    if (dbService && dbService.db) {
      await dbService.db.close()
    }
    
    // 清理测试数据库
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
  })

  describe('init', () => {
    it('应该成功初始化数据库', async () => {
      expect(dbService.db).toBeDefined()
    })

    it('应该创建users表', async () => {
      const result = await dbService.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      )
      expect(result).toBeDefined()
      expect(result.name).toBe('users')
    })

    it('应该创建sms_codes表', async () => {
      const result = await dbService.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sms_codes'"
      )
      expect(result).toBeDefined()
      expect(result.name).toBe('sms_codes')
    })
  })

  describe('findUserByUsername', () => {
    beforeEach(async () => {
      // 插入测试用户
      await dbService.db.run(
        'INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)',
        ['testuser', 'test@example.com', '13800138000', 'hashedpassword']
      )
    })

    it('应该找到存在的用户', async () => {
      const user = await dbService.findUserByUsername('testuser')
      
      expect(user).toBeDefined()
      expect(user.username).toBe('testuser')
      expect(user.email).toBe('test@example.com')
      expect(user.phone).toBe('13800138000')
    })

    it('应该返回null对于不存在的用户', async () => {
      const user = await dbService.findUserByUsername('nonexistent')
      
      expect(user).toBeNull()
    })
  })

  describe('findUserByEmail', () => {
    beforeEach(async () => {
      await dbService.db.run(
        'INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)',
        ['testuser', 'test@example.com', '13800138000', 'hashedpassword']
      )
    })

    it('应该找到存在的用户', async () => {
      const user = await dbService.findUserByEmail('test@example.com')
      
      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.username).toBe('testuser')
    })

    it('应该返回null对于不存在的邮箱', async () => {
      const user = await dbService.findUserByEmail('nonexistent@example.com')
      
      expect(user).toBeNull()
    })
  })

  describe('findUserByPhone', () => {
    beforeEach(async () => {
      await dbService.db.run(
        'INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)',
        ['testuser', 'test@example.com', '13800138000', 'hashedpassword']
      )
    })

    it('应该找到存在的用户', async () => {
      const user = await dbService.findUserByPhone('13800138000')
      
      expect(user).toBeDefined()
      expect(user.phone).toBe('13800138000')
      expect(user.username).toBe('testuser')
    })

    it('应该返回null对于不存在的手机号', async () => {
      const user = await dbService.findUserByPhone('13900139000')
      
      expect(user).toBeNull()
    })
  })

  describe('verifyPassword', () => {
    beforeEach(async () => {
      await dbService.db.run(
        'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)',
        [1, 'testuser', 'hashedpassword']
      )
    })

    it('应该验证正确的密码', async () => {
      const isValid = await dbService.verifyPassword(1, 'hashedpassword')
      
      expect(isValid).toBe(true)
    })

    it('应该拒绝错误的密码', async () => {
      const isValid = await dbService.verifyPassword(1, 'wrongpassword')
      
      expect(isValid).toBe(false)
    })

    it('应该处理不存在的用户ID', async () => {
      const isValid = await dbService.verifyPassword(999, 'anypassword')
      
      expect(isValid).toBe(false)
    })
  })

  describe('createSmsCode', () => {
    it('应该成功创建短信验证码记录', async () => {
      const result = await dbService.createSmsCode('13800138000', '123456')
      
      expect(result).toBe(true)
    })

    it('应该能够创建多个验证码记录', async () => {
      const result1 = await dbService.createSmsCode('13800138000', '123456')
      const result2 = await dbService.createSmsCode('13900139000', '654321')
      
      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })
  })

  describe('verifySmsCode', () => {
    beforeEach(async () => {
      // 插入有效的验证码
      await dbService.db.run(
        'INSERT INTO sms_codes (phone_number, code, created_at, expires_at) VALUES (?, ?, ?, ?)',
        ['13800138000', '123456', Date.now(), Date.now() + 300000] // 5分钟后过期
      )
      
      // 插入过期的验证码
      await dbService.db.run(
        'INSERT INTO sms_codes (phone_number, code, created_at, expires_at) VALUES (?, ?, ?, ?)',
        ['13900139000', '654321', Date.now() - 600000, Date.now() - 300000] // 已过期
      )
    })

    it('应该验证有效的验证码', async () => {
      const isValid = await dbService.verifySmsCode('13800138000', '123456')
      
      expect(isValid).toBe(true)
    })

    it('应该拒绝错误的验证码', async () => {
      const isValid = await dbService.verifySmsCode('13800138000', '000000')
      
      expect(isValid).toBe(false)
    })

    it('应该拒绝过期的验证码', async () => {
      const isValid = await dbService.verifySmsCode('13900139000', '654321')
      
      expect(isValid).toBe(false)
    })

    it('应该拒绝不存在的手机号', async () => {
      const isValid = await dbService.verifySmsCode('15800158000', '123456')
      
      expect(isValid).toBe(false)
    })
  })

  describe('checkSmsCodeFrequency', () => {
    beforeEach(async () => {
      // 插入最近的验证码记录
      await dbService.db.run(
        'INSERT INTO sms_codes (phone_number, code, created_at) VALUES (?, ?, ?)',
        ['13800138000', '123456', Date.now() - 30000] // 30秒前
      )
    })

    it('应该检测到频繁发送', async () => {
      const canSend = await dbService.checkSmsCodeFrequency('13800138000')
      
      expect(canSend).toBe(false)
    })

    it('应该允许新手机号发送', async () => {
      const canSend = await dbService.checkSmsCodeFrequency('13900139000')
      
      expect(canSend).toBe(true)
    })
  })

  describe('updateLoginStatus', () => {
    beforeEach(async () => {
      await dbService.db.run(
        'INSERT INTO users (id, username, last_login) VALUES (?, ?, ?)',
        [1, 'testuser', null]
      )
    })

    it('应该更新用户登录状态', async () => {
      const result = await dbService.updateLoginStatus(1)
      
      expect(result).toBe(true)
      
      // 验证更新
      const user = await dbService.db.get('SELECT last_login FROM users WHERE id = ?', [1])
      expect(user.last_login).toBeDefined()
    })

    it('应该处理不存在的用户ID', async () => {
      const result = await dbService.updateLoginStatus(999)
      
      expect(result).toBe(false)
    })
  })
})
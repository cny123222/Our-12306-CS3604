const authService = require('../../src/services/authService')
const bcrypt = require('bcryptjs')
const dbService = require('../../src/services/dbService')

describe('AuthService', () => {
  // 在所有测试前创建测试用户
  beforeAll(async () => {
    // 等待数据库初始化
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 创建测试用户数据
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    try {
      // 插入测试用户（用户名）
      await dbService.run(
        'INSERT OR REPLACE INTO users (username, password, name, id_card_number, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
        ['testuser', hashedPassword, '测试用户', '110101199001011234', '13800138000', 'test@example.com']
      )
    } catch (error) {
      console.error('Failed to create test user:', error)
    }
  })

  describe('validateCredentials', () => {
    it('应该验证有效的用户名和密码', async () => {
      const result = await authService.validateCredentials('testuser', 'password123')
      
      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('user')
      expect(result.user).toHaveProperty('id')
    })

    it('应该拒绝无效的凭据', async () => {
      const result = await authService.validateCredentials('invaliduser', 'wrongpassword')
      
      expect(result).toHaveProperty('success', false)
      expect(result).toHaveProperty('error')
    })

    it('应该支持邮箱验证', async () => {
      const result = await authService.validateCredentials('test@example.com', 'password123')
      
      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('user')
    })

    it('应该支持手机号验证', async () => {
      const result = await authService.validateCredentials('13800138000', 'password123')
      
      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('user')
    })
  })

  describe('generateSessionId', () => {
    it('应该生成有效的会话ID', () => {
      const sessionId = authService.generateSessionId()
      
      expect(typeof sessionId).toBe('string')
      expect(sessionId).toMatch(/^[a-f0-9-]{36}$/)
    })

    it('应该生成唯一的会话ID', () => {
      const sessionId1 = authService.generateSessionId()
      const sessionId2 = authService.generateSessionId()
      
      expect(sessionId1).not.toBe(sessionId2)
    })
  })

  describe('identifyIdentifierType', () => {
    it('应该识别用户名', () => {
      const type = authService.identifyIdentifierType('testuser')
      expect(type).toBe('username')
    })

    it('应该识别邮箱', () => {
      const type = authService.identifyIdentifierType('test@example.com')
      expect(type).toBe('email')
    })

    it('应该识别手机号', () => {
      const type = authService.identifyIdentifierType('13800138000')
      expect(type).toBe('phone')
    })

    it('应该处理无效格式', () => {
      const type = authService.identifyIdentifierType('invalid@')
      expect(type).toBe('invalid')
    })
  })
})
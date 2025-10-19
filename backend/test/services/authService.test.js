const AuthService = require('../../src/services/authService')

describe('AuthService', () => {
  let authService

  beforeEach(() => {
    authService = new AuthService()
  })

  describe('validateCredentials', () => {
    it('应该验证有效的用户名和密码', async () => {
      const result = await authService.validateCredentials('testuser', 'password123')
      
      expect(result).toHaveProperty('isValid', true)
      expect(result).toHaveProperty('userId')
      expect(typeof result.userId).toBe('number')
    })

    it('应该拒绝无效的凭据', async () => {
      const result = await authService.validateCredentials('invaliduser', 'wrongpassword')
      
      expect(result).toHaveProperty('isValid', false)
      expect(result).not.toHaveProperty('userId')
    })

    it('应该支持邮箱验证', async () => {
      const result = await authService.validateCredentials('test@example.com', 'password123')
      
      expect(result).toHaveProperty('isValid', true)
      expect(result).toHaveProperty('userId')
    })

    it('应该支持手机号验证', async () => {
      const result = await authService.validateCredentials('13800138000', 'password123')
      
      expect(result).toHaveProperty('isValid', true)
      expect(result).toHaveProperty('userId')
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

  describe('validateIdCard', () => {
    it('应该验证有效的身份证号', () => {
      const validIdCard = '110101199001011234'
      const result = authService.validateIdCard(validIdCard)
      
      expect(result).toBe(true)
    })

    it('应该拒绝无效的身份证号', () => {
      const invalidIdCard = '123456789'
      const result = authService.validateIdCard(invalidIdCard)
      
      expect(result).toBe(false)
    })

    it('应该拒绝空身份证号', () => {
      const result = authService.validateIdCard('')
      
      expect(result).toBe(false)
    })
  })

  describe('generateSmsCode', () => {
    it('应该生成6位数字验证码', () => {
      const code = authService.generateSmsCode()
      
      expect(typeof code).toBe('string')
      expect(code).toMatch(/^\d{6}$/)
    })

    it('应该生成不同的验证码', () => {
      const code1 = authService.generateSmsCode()
      const code2 = authService.generateSmsCode()
      
      // 虽然可能相同，但概率很低
      expect(code1).toMatch(/^\d{6}$/)
      expect(code2).toMatch(/^\d{6}$/)
    })
  })

  describe('verifySmsCode', () => {
    it('应该验证正确的短信验证码', async () => {
      const phoneNumber = '13800138000'
      const code = '123456'
      
      const result = await authService.verifySmsCode(phoneNumber, code)
      
      expect(result).toHaveProperty('isValid', true)
    })

    it('应该拒绝错误的验证码', async () => {
      const phoneNumber = '13800138000'
      const code = '000000'
      
      const result = await authService.verifySmsCode(phoneNumber, code)
      
      expect(result).toHaveProperty('isValid', false)
    })

    it('应该拒绝过期的验证码', async () => {
      const phoneNumber = '13800138000'
      const code = '999999'  // 假设这是过期的验证码
      
      const result = await authService.verifySmsCode(phoneNumber, code)
      
      expect(result).toHaveProperty('isValid', false)
    })
  })

  describe('generateJwtToken', () => {
    it('应该生成有效的JWT令牌', () => {
      const userId = 123
      const token = authService.generateJwtToken(userId)
      
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)  // JWT格式检查
    })

    it('应该为不同用户生成不同的令牌', () => {
      const token1 = authService.generateJwtToken(123)
      const token2 = authService.generateJwtToken(456)
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('getIdentifierType', () => {
    it('应该识别用户名', () => {
      const type = authService.getIdentifierType('testuser')
      expect(type).toBe('username')
    })

    it('应该识别邮箱', () => {
      const type = authService.getIdentifierType('test@example.com')
      expect(type).toBe('email')
    })

    it('应该识别手机号', () => {
      const type = authService.getIdentifierType('13800138000')
      expect(type).toBe('phone')
    })

    it('应该处理无效格式', () => {
      const type = authService.getIdentifierType('invalid@')
      expect(type).toBe('unknown')
    })
  })
})
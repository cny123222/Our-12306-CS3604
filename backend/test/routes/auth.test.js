const request = require('supertest')
const app = require('../../src/app')
const bcrypt = require('bcryptjs')
const dbService = require('../../src/services/dbService')

describe('Authentication Routes', () => {
  // 在所有测试前创建测试用户
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // 创建测试用户
    await dbService.run(`
      INSERT OR REPLACE INTO users (username, password, email, phone, id_card_type, id_card_number, name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['testuser', hashedPassword, 'test@example.com', '13800138000', '中国居民身份证', '110101199001011234', '测试用户'])
  })
  
  // 每个测试后清理验证码
  afterEach(async () => {
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', ['13800138000'])
  })
  
  // 清理测试数据
  afterAll(async () => {
    await dbService.run('DELETE FROM users WHERE username = ?', ['testuser'])
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', ['13800138000'])
    await dbService.run('DELETE FROM sessions WHERE id LIKE ?', ['%'])
  })
  
  describe('POST /api/auth/login', () => {
    it('应该成功登录有效用户', async () => {
      const loginData = {
        identifier: 'testuser',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('sessionId')
      expect(response.body).toHaveProperty('token')
      expect(response.body.sessionId).toMatch(/^[a-f0-9-]{36}$/)
    })

    it('应该拒绝无效的用户名/密码', async () => {
      const loginData = {
        identifier: 'invaliduser',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', '用户名或密码错误')
    })

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors).toContain('用户名/邮箱/手机号不能为空')
      expect(response.body.errors).toContain('密码不能为空')
    })

    it('应该支持邮箱登录', async () => {
      const loginData = {
        identifier: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('sessionId')
    })

    it('应该支持手机号登录', async () => {
      const loginData = {
        identifier: '13800138000',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('sessionId')
    })
  })

  describe('POST /api/auth/send-verification-code', () => {
    it('应该成功发送短信验证码', async () => {
      const phoneData = {
        phoneNumber: '13800138000'
      }

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send(phoneData)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message', '验证码已发送')
    })

    it('应该验证手机号格式', async () => {
      const phoneData = {
        phoneNumber: 'invalid-phone'
      }

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send(phoneData)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors).toContain('请输入有效的手机号')
    })

    it('应该限制发送频率', async () => {
      const phoneData = {
        phoneNumber: '13800138000'
      }

      // 第一次发送
      await request(app)
        .post('/api/auth/send-verification-code')
        .send(phoneData)
        .expect(200)

      // 立即再次发送应该被限制
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send(phoneData)
        .expect(429)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', '请求验证码过于频繁，请稍后再试！')
    })
  })

  describe('POST /api/auth/verify-login', () => {
    it('应该成功验证短信登录', async () => {
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber: '13800138000' })
        .expect(200)
      
      // 获取刚发送的验证码（从数据库）
      const codeRecord = await dbService.get(
        'SELECT code FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
        ['13800138000']
      )
      
      const verifyData = {
        phoneNumber: '13800138000',
        verificationCode: codeRecord.code
      }

      const response = await request(app)
        .post('/api/auth/verify-login')
        .send(verifyData)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('sessionId')
      expect(response.body).toHaveProperty('token')
    })

    it('应该拒绝无效的验证码', async () => {
      const verifyData = {
        phoneNumber: '13800138000',
        verificationCode: '000000'
      }

      const response = await request(app)
        .post('/api/auth/verify-login')
        .send(verifyData)
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body.error).toMatch(/验证码.*错误|验证码.*过期|验证码校验失败|很抱歉，您输入的短信验证码有误/i)
    })

    it('应该验证验证码格式', async () => {
      const verifyData = {
        phoneNumber: '13800138000',
        verificationCode: '12345'  // 不足6位
      }

      const response = await request(app)
        .post('/api/auth/verify-login')
        .send(verifyData)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors).toContain('验证码必须为6位数字')
    })
  })

  describe('GET /api/auth/homepage', () => {
    it('应该返回首页内容', async () => {
      const response = await request(app)
        .get('/api/auth/homepage')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('content')
      expect(response.body.content).toHaveProperty('title')
      expect(response.body.content).toHaveProperty('features')
      expect(Array.isArray(response.body.content.features)).toBe(true)
    })
  })

  describe('GET /api/auth/forgot-password', () => {
    it('应该返回忘记密码页面信息', async () => {
      const response = await request(app)
        .get('/api/auth/forgot-password')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('content')
      expect(response.body.content).toHaveProperty('title', '忘记密码')
      expect(response.body.content).toHaveProperty('instructions')
    })
  })
})
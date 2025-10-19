const request = require('supertest')
const app = require('../../src/app')

describe('Authentication Routes', () => {
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
      expect(response.body).toHaveProperty('error', '发送过于频繁，请稍后再试')
    })
  })

  describe('POST /api/auth/verify-login', () => {
    it('应该成功验证短信登录', async () => {
      const verifyData = {
        phoneNumber: '13800138000',
        verificationCode: '123456'
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
      expect(response.body).toHaveProperty('error', '验证码错误或已过期')
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
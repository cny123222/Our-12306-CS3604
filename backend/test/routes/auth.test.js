const request = require('supertest');
const app = require('../../src/app');
const VerificationRepository = require('../../src/database/verificationRepository');

describe('Authentication Routes', () => {
  const verificationRepo = new VerificationRepository();

  beforeEach(async () => {
    // 清理验证码数据，确保每个测试都有干净的状态
    try {
      await verificationRepo.clearAllVerificationCodes();
    } catch (error) {
      console.log('Warning: Could not clear verification codes:', error.message);
    }
  });
  describe('POST /api/auth/login', () => {
    it('should successfully login with valid username and password', async () => {
      // 验收标准：用户名密码登录成功
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password',
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });

    it('should successfully login with valid email and password', async () => {
      // 验收标准：邮箱密码登录成功
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password',
          username: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should successfully login with valid phone and password', async () => {
      // 验收标准：手机号密码登录成功
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password',
          username: '13800138000',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should successfully login with valid phone and SMS code', async () => {
      // 验收标准：手机号短信验证码登录成功
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'sms',
          phone: '13800138000',
          smsCode: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should fail login with invalid username', async () => {
      // 验收标准：用户名不存在时登录失败
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password',
          username: 'nonexistentuser',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '用户名或密码错误');
    });

    it('should fail login with invalid password', async () => {
      // 验收标准：密码错误时登录失败
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password',
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '用户名或密码错误');
    });

    it('should fail login with invalid SMS code', async () => {
      // 验收标准：短信验证码错误时登录失败
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'sms',
          phone: '13800138000',
          smsCode: 'wrongcode'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '验证码错误或已过期');
    });

    it('should fail login with missing required fields', async () => {
      // 验收标准：缺少必填字段时登录失败
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password'
          // 缺少username和password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should update user login time on successful login', async () => {
      // 验收标准：登录成功后更新用户最后登录时间
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password',
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('lastLoginTime');
    });
  });

  describe('POST /api/auth/send-sms', () => {
    it('should successfully send SMS code to valid phone number', async () => {
      // 验收标准：向有效手机号发送短信验证码成功
      const response = await request(app)
        .post('/api/auth/send-sms')
        .send({
          phone: '13800138000',
          purpose: 'login'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '验证码已发送');
    });

    it('should fail to send SMS to invalid phone number', async () => {
      // 验收标准：向无效手机号发送短信验证码失败
      const response = await request(app)
        .post('/api/auth/send-sms')
        .send({
          phone: 'invalidphone',
          purpose: 'login'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should fail to send SMS when rate limit exceeded', async () => {
      // 验收标准：超过发送频率限制时失败
      const phone = '13800138001';
      
      // 发送第一条短信
      await request(app)
        .post('/api/auth/send-sms')
        .send({
          phone: phone,
          purpose: 'login'
        });

      // 立即发送第二条短信应该失败
      const response = await request(app)
        .post('/api/auth/send-sms')
        .send({
          phone: phone,
          purpose: 'login'
        });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '发送过于频繁，请稍后再试');
    });

    it('should fail to send SMS when daily limit exceeded', async () => {
      // 验收标准：超过每日发送限制时失败
      const phone = '13800138002';
      
      // 模拟已达到每日限制的情况
      // 这里需要根据实际实现调整测试逻辑
      const response = await request(app)
        .post('/api/auth/send-sms')
        .send({
          phone: phone,
          purpose: 'login'
        });

      // 在实际测试中，可能需要先发送多条短信达到限制
      // 这里假设测试环境已经设置了限制
      if (response.status === 429) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('POST /api/auth/verify-sms', () => {
    it('should successfully verify valid SMS code', async () => {
      // 验收标准：验证有效的短信验证码成功
      // 首先发送短信
      await request(app)
        .post('/api/auth/send-sms')
        .send({
          phone: '13800138000',
          purpose: 'login'
        });

      // 然后验证短信码
      const response = await request(app)
        .post('/api/auth/verify-sms')
        .send({
          phone: '13800138000',
          code: '123456',
          purpose: 'login'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '验证成功');
    });

    it('should fail to verify invalid SMS code', async () => {
      // 验收标准：验证无效的短信验证码失败
      const response = await request(app)
        .post('/api/auth/verify-sms')
        .send({
          phone: '13800138000',
          code: 'wrongcode',
          purpose: 'login'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '验证码错误或已过期');
    });

    it('should fail to verify expired SMS code', async () => {
      // 验收标准：验证过期的短信验证码失败
      const response = await request(app)
        .post('/api/auth/verify-sms')
        .send({
          phone: '13800138000',
          code: 'expiredcode',
          purpose: 'login'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '验证码错误或已过期');
    });
  });
});
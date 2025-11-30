/**
 * 密码重置路由测试
 * 测试文件：backend/test/routes/passwordReset.test.js
 * 对应源文件：backend/src/routes/passwordReset.js
 * 
 * 测试目标：验证密码重置API的各个端点功能
 */

const request = require('supertest');
const app = require('../../src/app');
const bcrypt = require('bcryptjs');
const dbService = require('../../src/services/dbService');
const passwordResetService = require('../../src/services/passwordResetService');

describe('Password Reset Routes', () => {
  let testUserId;
  const testUserData = {
    username: 'testuser_reset',
    password: 'oldPassword123',
    phone: '19805819256',
    idCardType: '居民身份证',
    idCardNumber: '330106200503104027',
    name: '测试用户',
    email: 'test@reset.com'
  };

  // 在所有测试前创建测试用户
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    const result = await dbService.run(`
      INSERT OR REPLACE INTO users (username, password, phone, id_card_type, id_card_number, name, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      testUserData.username,
      hashedPassword,
      testUserData.phone,
      testUserData.idCardType,
      testUserData.idCardNumber,
      testUserData.name,
      testUserData.email
    ]);
    
    testUserId = result.lastID;
  });

  // 每个测试后清理验证码
  afterEach(async () => {
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', [testUserData.phone]);
  });

  // 清理测试数据
  afterAll(async () => {
    await dbService.run('DELETE FROM users WHERE username = ?', [testUserData.username]);
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', [testUserData.phone]);
  });

  describe('POST /api/password-reset/verify-account', () => {
    it('应该成功验证匹配的账户信息', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-account')
        .send({
          phone: testUserData.phone,
          idCardType: testUserData.idCardType,
          idCardNumber: testUserData.idCardNumber
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('phone', testUserData.phone);
      expect(response.body.sessionId).toBeTruthy();
    });

    it('应该拒绝不匹配的证件号码', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-account')
        .send({
          phone: testUserData.phone,
          idCardType: testUserData.idCardType,
          idCardNumber: '110101199001011234' // 错误的证件号
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/不正确/);
    });

    it('应该拒绝不匹配的手机号', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-account')
        .send({
          phone: '13800138000', // 错误的手机号
          idCardType: testUserData.idCardType,
          idCardNumber: testUserData.idCardNumber
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/不正确/);
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-account')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/请填写完整/);
    });

    it('应该验证手机号格式', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-account')
        .send({
          phone: '123', // 无效格式
          idCardType: testUserData.idCardType,
          idCardNumber: testUserData.idCardNumber
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/手机号码/);
    });
  });

  describe('POST /api/password-reset/send-code', () => {
    let sessionId;

    beforeEach(async () => {
      // 先验证账户获取sessionId
      const verifyResponse = await request(app)
        .post('/api/password-reset/verify-account')
        .send({
          phone: testUserData.phone,
          idCardType: testUserData.idCardType,
          idCardNumber: testUserData.idCardNumber
        });
      
      sessionId = verifyResponse.body.sessionId;
    });

    it('应该成功发送验证码', async () => {
      const response = await request(app)
        .post('/api/password-reset/send-code')
        .send({ sessionId })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('verificationCode'); // 开发环境返回
      expect(response.body).toHaveProperty('phone', testUserData.phone);
      expect(response.body.verificationCode).toMatch(/^\d{6}$/);
    });

    it('应该拒绝无效的sessionId', async () => {
      const response = await request(app)
        .post('/api/password-reset/send-code')
        .send({ sessionId: 'invalid-session-id' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/会话|过期/);
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/password-reset/send-code')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/会话ID/);
    });
  });

  describe('POST /api/password-reset/verify-code', () => {
    let sessionId;
    let verificationCode;

    beforeEach(async () => {
      // 验证账户
      const verifyResponse = await request(app)
        .post('/api/password-reset/verify-account')
        .send({
          phone: testUserData.phone,
          idCardType: testUserData.idCardType,
          idCardNumber: testUserData.idCardNumber
        });
      
      sessionId = verifyResponse.body.sessionId;

      // 发送验证码
      const codeResponse = await request(app)
        .post('/api/password-reset/send-code')
        .send({ sessionId });
      
      verificationCode = codeResponse.body.verificationCode;
    });

    it('应该成功验证正确的验证码', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-code')
        .send({ sessionId, code: verificationCode })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('resetToken');
      expect(response.body.resetToken).toBeTruthy();
    });

    it('应该拒绝错误的验证码', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-code')
        .send({ sessionId, code: '000000' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/验证码/);
    });

    it('应该拒绝无效的sessionId', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-code')
        .send({ sessionId: 'invalid', code: verificationCode })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/password-reset/verify-code')
        .send({ sessionId })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/password-reset/reset-password', () => {
    let resetToken;
    const newPassword = 'newPassword123';

    beforeEach(async () => {
      // 完整流程获取resetToken
      const verifyResponse = await request(app)
        .post('/api/password-reset/verify-account')
        .send({
          phone: testUserData.phone,
          idCardType: testUserData.idCardType,
          idCardNumber: testUserData.idCardNumber
        });
      
      const sessionId = verifyResponse.body.sessionId;

      const codeResponse = await request(app)
        .post('/api/password-reset/send-code')
        .send({ sessionId });
      
      const verificationCode = codeResponse.body.verificationCode;

      const verifyCodeResponse = await request(app)
        .post('/api/password-reset/verify-code')
        .send({ sessionId, code: verificationCode });
      
      resetToken = verifyCodeResponse.body.resetToken;
    });

    it('应该成功重置密码', async () => {
      const response = await request(app)
        .post('/api/password-reset/reset-password')
        .send({
          resetToken,
          newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // 验证新密码可以登录
      const user = await dbService.get(
        'SELECT * FROM users WHERE phone = ?',
        [testUserData.phone]
      );
      
      const passwordMatch = await bcrypt.compare(newPassword, user.password);
      expect(passwordMatch).toBe(true);
    });

    it('应该拒绝不一致的密码', async () => {
      const response = await request(app)
        .post('/api/password-reset/reset-password')
        .send({
          resetToken,
          newPassword: 'password123',
          confirmPassword: 'different456'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/不一致/);
    });

    it('应该验证密码长度', async () => {
      const response = await request(app)
        .post('/api/password-reset/reset-password')
        .send({
          resetToken,
          newPassword: '123',
          confirmPassword: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/长度|6/);
    });

    it('应该验证密码复杂度', async () => {
      const response = await request(app)
        .post('/api/password-reset/reset-password')
        .send({
          resetToken,
          newPassword: 'aaaaaa',
          confirmPassword: 'aaaaaa'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/包含|两种/);
    });

    it('应该拒绝无效的resetToken', async () => {
      const response = await request(app)
        .post('/api/password-reset/reset-password')
        .send({
          resetToken: 'invalid-token',
          newPassword,
          confirmPassword: newPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/过期|无效/);
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/password-reset/reset-password')
        .send({ resetToken })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('完整密码重置流程测试', () => {
    it('应该完成从账户验证到密码重置的完整流程', async () => {
      // 步骤1：验证账户
      const verifyResponse = await request(app)
        .post('/api/password-reset/verify-account')
        .send({
          phone: testUserData.phone,
          idCardType: testUserData.idCardType,
          idCardNumber: testUserData.idCardNumber
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      const sessionId = verifyResponse.body.sessionId;

      // 步骤2：发送验证码
      const sendCodeResponse = await request(app)
        .post('/api/password-reset/send-code')
        .send({ sessionId })
        .expect(200);

      expect(sendCodeResponse.body.success).toBe(true);
      const code = sendCodeResponse.body.verificationCode;

      // 步骤3：验证验证码
      const verifyCodeResponse = await request(app)
        .post('/api/password-reset/verify-code')
        .send({ sessionId, code })
        .expect(200);

      expect(verifyCodeResponse.body.success).toBe(true);
      const resetToken = verifyCodeResponse.body.resetToken;

      // 步骤4：重置密码
      const newPassword = 'newPass123';
      const resetResponse = await request(app)
        .post('/api/password-reset/reset-password')
        .send({
          resetToken,
          newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);

      // 验证：使用新密码可以登录
      const user = await dbService.get(
        'SELECT * FROM users WHERE phone = ?',
        [testUserData.phone]
      );
      
      const passwordMatch = await bcrypt.compare(newPassword, user.password);
      expect(passwordMatch).toBe(true);
    });
  });
});


/**
 * 登录功能集成测试
 * 测试登录的完整流程：从注册到登录验证
 */

const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/dbService');

describe('Login Integration Tests', () => {
  let testUser = {
    username: 'logintest001',
    password: 'Test123456',
    name: '测试用户',
    email: 'logintest001@example.com',
    phone: '13700000001',
    idCardType: '二代身份证',
    idCardNumber: '110101199001011234',
    discountType: '无',
    get idCardLast4() {
      return this.idCardNumber.slice(-4);
    }
  };

  beforeAll(async () => {
    // 清理测试数据
    await dbService.run('DELETE FROM users WHERE username = ?', [testUser.username]);
    await dbService.run('DELETE FROM users WHERE phone = ?', [testUser.phone]);
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', [testUser.phone]);
    await dbService.run('DELETE FROM sessions');
  });

  afterEach(async () => {
    // 每个测试后清理验证码和会话，避免干扰
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', [testUser.phone]);
    await dbService.run('DELETE FROM sessions');
  });

  afterAll(async () => {
    // 清理测试数据
    await dbService.run('DELETE FROM users WHERE username = ?', [testUser.username]);
    await dbService.run('DELETE FROM users WHERE phone = ?', [testUser.phone]);
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', [testUser.phone]);
    await dbService.run('DELETE FROM sessions');
  });

  describe('注册到登录完整流程', () => {
    test('完整流程：注册 -> 登录 -> 验证 -> 成功', async () => {
      // 1. 注册
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: testUser.username,
          password: testUser.password,
          confirmPassword: testUser.password,
          idCardType: testUser.idCardType,
          name: testUser.name,
          idCardNumber: testUser.idCardNumber,
          discountType: testUser.discountType,
          email: testUser.email,
          phone: testUser.phone,
          agreedToTerms: true
        });

      expect(registerResponse.status).toBe(201);
      const regSessionId = registerResponse.body.sessionId;
      expect(regSessionId).toBeDefined();

      // 2. 发送注册验证码
      const sendRegCodeResponse = await request(app)
        .post('/api/register/send-verification-code')
        .send({ sessionId: regSessionId });

      expect(sendRegCodeResponse.status).toBe(200);
      const regCode = sendRegCodeResponse.body.verificationCode;
      expect(regCode).toBeDefined();

      // 3. 完成注册
      const completeResponse = await request(app)
        .post('/api/register/complete')
        .send({
          sessionId: regSessionId,
          smsCode: regCode
        });

      expect(completeResponse.status).toBe(201);
      expect(completeResponse.body.message).toContain('注册成功');

      // 清理验证码记录，避免影响登录验证码发送
      await dbService.run('DELETE FROM verification_codes WHERE phone = ?', [testUser.phone]);

      // 4. 登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.username,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      const loginSessionId = loginResponse.body.sessionId;
      expect(loginSessionId).toBeDefined();


      // 5. 发送登录验证码
      const sendLoginCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId: loginSessionId,
          idCardLast4: testUser.idCardNumber.slice(-4)
        });

      expect(sendLoginCodeResponse.status).toBe(200);
      expect(sendLoginCodeResponse.body.success).toBe(true);
      const loginCode = sendLoginCodeResponse.body.verificationCode;
      expect(loginCode).toBeDefined();

      // 6. 验证登录
      const verifyResponse = await request(app)
        .post('/api/auth/verify-login')
        .send({
          sessionId: loginSessionId,
          idCardLast4: testUser.idCardNumber.slice(-4),
          verificationCode: loginCode
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.token).toBeDefined();
      expect(verifyResponse.body.user.username).toBe(testUser.username);
      expect(verifyResponse.body.user.email).toBe(testUser.email);
      expect(verifyResponse.body.user.phone).toBe(testUser.phone);
    });
  });

  describe('错误场景测试', () => {
    let registeredUser = {
      username: 'regtest002',
      password: 'Test123456',
      name: '已注册用户',
      email: 'regtest002@example.com',
      phone: '13700000002',
      idCardType: '二代身份证',
      idCardNumber: '110101199002022345',
      discountType: '无'
    };

    beforeAll(async () => {
      // 注册一个用户用于错误场景测试
      await dbService.run('DELETE FROM users WHERE username = ?', [registeredUser.username]);
      await dbService.run('DELETE FROM users WHERE phone = ?', [registeredUser.phone]);

      const regResponse = await request(app)
        .post('/api/register')
        .send({
          username: registeredUser.username,
          password: registeredUser.password,
          confirmPassword: registeredUser.password,
          idCardType: registeredUser.idCardType,
          name: registeredUser.name,
          idCardNumber: registeredUser.idCardNumber,
          discountType: registeredUser.discountType,
          email: registeredUser.email,
          phone: registeredUser.phone,
          agreedToTerms: true
        });

      const regSessionId = regResponse.body.sessionId;
      const sendCodeResponse = await request(app)
        .post('/api/register/send-verification-code')
        .send({ sessionId: regSessionId });

      const code = sendCodeResponse.body.verificationCode;
      await request(app)
        .post('/api/register/complete')
        .send({
          sessionId: regSessionId,
          smsCode: code
        });
    });

    afterAll(async () => {
      await dbService.run('DELETE FROM users WHERE username = ?', [registeredUser.username]);
      await dbService.run('DELETE FROM users WHERE phone = ?', [registeredUser.phone]);
    });

    test('登录 - 用户名不存在', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistentuser',
          password: 'Test123456'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('用户名或密码错误');
    });

    test('登录 - 密码错误', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: registeredUser.username,
          password: 'WrongPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('用户名或密码错误');
    });

    test('使用邮箱登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: registeredUser.email,
          password: registeredUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('使用手机号登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: registeredUser.phone,
          password: registeredUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('发送验证码 - 证件号后4位错误', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: registeredUser.username,
          password: registeredUser.password
        });

      const sessionId = loginResponse.body.sessionId;

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId: sessionId,
          idCardLast4: '9999'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('请输入正确的用户信息');
    });

    test('验证登录 - 验证码错误', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: registeredUser.username,
          password: registeredUser.password
        });

      const sessionId = loginResponse.body.sessionId;

      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId: sessionId,
          idCardLast4: registeredUser.idCardNumber.slice(-4)
        });

      const response = await request(app)
        .post('/api/auth/verify-login')
        .send({
          sessionId: sessionId,
          idCardLast4: registeredUser.idCardNumber.slice(-4),
          verificationCode: '999999'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('验证码');
    });

    test('验证登录 - 会话已过期', async () => {
      const response = await request(app)
        .post('/api/auth/verify-login')
        .send({
          sessionId: 'invalid-session-id',
          idCardLast4: '1234',
          verificationCode: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('会话');
    });
  });

  // ============ 补充测试：完整登录流程 ============
  describe('完整登录流程测试', () => {
    test('完整流程：用户名→密码→证件号→验证码→成功', async () => {
      // 步骤1：用户名密码登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.username,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      const sessionId = loginResponse.body.sessionId;

      // 步骤2：发送验证码
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4
        });

      expect(sendCodeResponse.status).toBe(200);

      // 获取实际验证码
      const codeRecord = await dbService.get(
        'SELECT code FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
        [testUser.phone]
      );

      // 步骤3：验证登录
      const verifyResponse = await request(app)
        .post('/api/auth/verify-login')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4,
          verificationCode: codeRecord.code
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
    });

    test('完整流程：邮箱→密码→证件号→验证码→成功', async () => {
      // 步骤1：邮箱登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.email,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      const sessionId = loginResponse.body.sessionId;

      // 步骤2：发送验证码
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4
        });

      expect(sendCodeResponse.status).toBe(200);

      // 获取实际验证码
      const codeRecord = await dbService.get(
        'SELECT code FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
        [testUser.phone]
      );

      // 步骤3：验证登录
      const verifyResponse = await request(app)
        .post('/api/auth/verify-login')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4,
          verificationCode: codeRecord.code
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
    });

    test('完整流程：手机号→密码→证件号→验证码→成功', async () => {
      // 步骤1：手机号登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.phone,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      const sessionId = loginResponse.body.sessionId;

      // 步骤2：发送验证码
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4
        });

      expect(sendCodeResponse.status).toBe(200);

      // 获取实际验证码
      const codeRecord = await dbService.get(
        'SELECT code FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
        [testUser.phone]
      );

      // 步骤3：验证登录
      const verifyResponse = await request(app)
        .post('/api/auth/verify-login')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4,
          verificationCode: codeRecord.code
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
    });

    test('错误流程：证件号后4位错误', async () => {
      // 步骤1：正常登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.username,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      const sessionId = loginResponse.body.sessionId;

      // 步骤2：使用错误的证件号发送验证码
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId,
          idCardLast4: '9999'  // 错误的证件号
        });

      // 应该返回错误
      expect(sendCodeResponse.status).toBe(400);
      expect(sendCodeResponse.body.error).toContain('用户信息');
    });

    test('错误流程：验证码错误', async () => {
      // 步骤1：正常登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.username,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      const sessionId = loginResponse.body.sessionId;

      // 步骤2：发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4
        });

      // 步骤3：使用错误的验证码
      const verifyResponse = await request(app)
        .post('/api/auth/verify-login')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4,
          verificationCode: '000000'  // 错误的验证码
        });

      // 应该返回错误
      expect(verifyResponse.status).toBe(401);
      expect(verifyResponse.body.error).toMatch(/验证码.*错误|验证码.*有误/i);
    });

    test('错误流程：验证码过期（模拟）', async () => {
      // 步骤1：正常登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.username,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      const sessionId = loginResponse.body.sessionId;

      // 步骤2：发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4
        });

      // 步骤3：使用不存在的验证码（模拟过期场景）
      const verifyResponse = await request(app)
        .post('/api/auth/verify-login')
        .send({
          sessionId,
          idCardLast4: testUser.idCardLast4,
          verificationCode: '999999'  // 不存在的验证码
        });

      // 应该返回错误
      expect(verifyResponse.status).toBe(401);
      expect(verifyResponse.body.error).toMatch(/验证码.*过期|验证码.*错误|很抱歉，您输入的短信验证码有误/i);
    });
  });
});

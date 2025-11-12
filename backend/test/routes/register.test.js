/**
 * 注册相关API路由测试
 * 测试文件：backend/test/routes/register.test.js
 * 对应源文件：backend/src/routes/register.js
 * 
 * 测试目标：验证所有注册相关的API端点功能
 */

const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/dbService');

describe('Registration API Routes Tests', () => {
  beforeEach(async () => {
    // 清理测试数据
    await dbService.run('DELETE FROM users');
    await dbService.run('DELETE FROM verification_codes');
    await dbService.run('DELETE FROM email_verification_codes');
    await dbService.run('DELETE FROM sessions');
  });

  afterEach(async () => {
    // 清理测试数据
    await dbService.run('DELETE FROM users');
    await dbService.run('DELETE FROM verification_codes');
    await dbService.run('DELETE FROM email_verification_codes');
    await dbService.run('DELETE FROM sessions');
  });

  // ==================== API-POST-ValidateUsername ====================
  describe('POST /api/register/validate-username - 验证用户名', () => {
    test('用户名长度小于6位时应返回400错误', async () => {
      // When: 发送用户名长度小于6位的请求
      const response = await request(app)
        .post('/api/register/validate-username')
        .send({ username: 'abc' })
        .expect(400);

      // Then: 应该返回正确的错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('用户名长度不能少于6个字符！');
    });

    test('用户名长度大于30位时应返回400错误', async () => {
      // When: 发送用户名长度大于30位的请求
      const response = await request(app)
        .post('/api/register/validate-username')
        .send({ username: 'a'.repeat(31) })
        .expect(400);

      // Then: 应该返回正确的错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('用户名长度不能超过30个字符！');
    });

    test('用户名不以字母开头时应返回400错误', async () => {
      // When: 发送以数字开头的用户名
      const response = await request(app)
        .post('/api/register/validate-username')
        .send({ username: '123abc' })
        .expect(400);

      // Then: 应该返回正确的错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('用户名只能由字母、数字和_组成，须以字母开头！');
    });

    test('用户名包含特殊字符时应返回400错误', async () => {
      // When: 发送包含特殊字符的用户名
      const response = await request(app)
        .post('/api/register/validate-username')
        .send({ username: 'user@#$' })
        .expect(400);

      // Then: 应该返回正确的错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('用户名只能由字母、数字和_组成，须以字母开头！');
    });

    test('用户名已存在时应返回409冲突错误', async () => {
      // Given: 数据库中已存在用户
      await dbService.run(
        'INSERT INTO users (username, password, phone, id_card_number) VALUES (?, ?, ?, ?)',
        ['existingUser', 'hashedPassword', '13800138000', '110101199001011234']
      );

      // When: 尝试验证已存在的用户名
      const response = await request(app)
        .post('/api/register/validate-username')
        .send({ username: 'existingUser' })
        .expect(409);

      // Then: 应该返回冲突错误
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('该用户名已经占用，请重新选择用户名！');
    });

    test('合法且未被占用的用户名应返回200成功', async () => {
      // When: 发送合法的用户名
      const response = await request(app)
        .post('/api/register/validate-username')
        .send({ username: 'validUser123' })
        .expect(200);

      // Then: 应该返回成功信息
      expect(response.body.valid).toBe(true);
      expect(response.body.message).toBe('用户名可用');
    });
  });

  // ==================== API-POST-ValidatePassword ====================
  describe('POST /api/register/validate-password - 验证密码', () => {
    test('密码长度小于6位时应返回400错误', async () => {
      // When: 发送长度小于6位的密码
      const response = await request(app)
        .post('/api/register/validate-password')
        .send({ password: 'abc12' })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('密码长度不能少于6个字符！');
    });

    test('密码包含特殊字符时应返回400错误', async () => {
      // When: 发送包含特殊字符的密码
      const response = await request(app)
        .post('/api/register/validate-password')
        .send({ password: 'abc@#$123' })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('格式错误，必须且只能包含字母、数字和下划线中的两种或两种以上！');
    });

    test('密码只包含一种字符类型时应返回400错误', async () => {
      // When: 发送只包含数字的密码
      const response1 = await request(app)
        .post('/api/register/validate-password')
        .send({ password: '123456' })
        .expect(400);

      // When: 发送只包含字母的密码
      const response2 = await request(app)
        .post('/api/register/validate-password')
        .send({ password: 'abcdef' })
        .expect(400);

      // When: 发送只包含下划线的密码
      const response3 = await request(app)
        .post('/api/register/validate-password')
        .send({ password: '______' })
        .expect(400);

      // Then: 都应该返回错误信息
      expect(response1.body.valid).toBe(false);
      expect(response2.body.valid).toBe(false);
      expect(response3.body.valid).toBe(false);
    });

    test('符合规范的密码应返回200成功', async () => {
      // When: 发送符合规范的密码
      const response = await request(app)
        .post('/api/register/validate-password')
        .send({ password: 'abc123' })
        .expect(200);

      // Then: 应该返回成功信息
      expect(response.body.valid).toBe(true);
      expect(response.body.message).toBe('密码格式正确');
    });
  });

  // ==================== API-POST-ValidateName ====================
  describe('POST /api/register/validate-name - 验证姓名', () => {
    test('姓名长度小于3个字符时应返回400错误', async () => {
      // When: 发送过短的姓名
      const response = await request(app)
        .post('/api/register/validate-name')
        .send({ name: '李' })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('允许输入的字符串在3-30个字符之间！');
    });

    test('姓名长度大于30个字符时应返回400错误', async () => {
      // When: 发送过长的姓名
      const response = await request(app)
        .post('/api/register/validate-name')
        .send({ name: '李'.repeat(16) }) // 16个汉字 = 32个字符
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('允许输入的字符串在3-30个字符之间！');
    });

    test('姓名包含特殊字符时应返回400错误', async () => {
      // When: 发送包含特殊字符的姓名
      const response = await request(app)
        .post('/api/register/validate-name')
        .send({ name: '张三@#$' })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('请输入姓名！');
    });

    test('符合规范的姓名应返回200成功', async () => {
      // When: 发送符合规范的中文姓名
      const response1 = await request(app)
        .post('/api/register/validate-name')
        .send({ name: '张三' })
        .expect(200);

      // When: 发送符合规范的英文姓名
      const response2 = await request(app)
        .post('/api/register/validate-name')
        .send({ name: 'John Smith' })
        .expect(200);

      // When: 发送包含点的姓名
      const response3 = await request(app)
        .post('/api/register/validate-name')
        .send({ name: 'John.Smith' })
        .expect(200);

      // Then: 都应该返回成功
      expect(response1.body.valid).toBe(true);
      expect(response2.body.valid).toBe(true);
      expect(response3.body.valid).toBe(true);
    });
  });

  // ==================== API-POST-ValidateIdCard ====================
  describe('POST /api/register/validate-idcard - 验证证件号码', () => {
    test('证件号码长度不是18位时应返回400错误', async () => {
      // When: 发送长度不足18位的证件号码
      const response1 = await request(app)
        .post('/api/register/validate-idcard')
        .send({ 
          idCardType: '居民身份证',
          idCardNumber: '12345'
        })
        .expect(400);

      // When: 发送长度超过18位的证件号码
      const response2 = await request(app)
        .post('/api/register/validate-idcard')
        .send({ 
          idCardType: '居民身份证',
          idCardNumber: '1234567890123456789'
        })
        .expect(400);

      // Then: 都应该返回错误信息
      expect(response1.body.valid).toBe(false);
      expect(response1.body.error).toBe('请正确输入18位证件号码！');
      expect(response2.body.valid).toBe(false);
      expect(response2.body.error).toBe('请正确输入18位证件号码！');
    });

    test('证件号码包含非法字符时应返回400错误', async () => {
      // When: 发送包含特殊字符的证件号码
      const response = await request(app)
        .post('/api/register/validate-idcard')
        .send({ 
          idCardType: '居民身份证',
          idCardNumber: '11010119900101@#$'
        })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('输入的证件编号中包含中文信息或特殊字符！');
    });

    test('证件号码已被注册但实时验证不检查重复', async () => {
      // Given: 数据库中已存在用户
      await dbService.run(
        'INSERT INTO users (username, password, phone, id_card_type, id_card_number) VALUES (?, ?, ?, ?, ?)',
        ['user001', 'hashedPassword', '13800138000', '居民身份证', '110101199001011234']
      );

      // When: 尝试验证已存在的证件号码（实时验证不检查重复）
      const response = await request(app)
        .post('/api/register/validate-idcard')
        .send({ 
          idCardType: '居民身份证',
          idCardNumber: '110101199001011234'
        })
        .expect(200);

      // Then: 应该返回成功（实时验证不检查重复，只在提交时检查）
      expect(response.body.valid).toBe(true);
      expect(response.body.message).toBe('证件号码格式正确');
    });

    test('符合规范的证件号码应返回200成功', async () => {
      // When: 发送符合规范的证件号码
      const response = await request(app)
        .post('/api/register/validate-idcard')
        .send({ 
          idCardType: '居民身份证',
          idCardNumber: '110101199001011235'
        })
        .expect(200);

      // Then: 应该返回成功信息
      expect(response.body.valid).toBe(true);
      expect(response.body.message).toBe('证件号码格式正确');
    });
  });

  // ==================== API-POST-ValidateEmail ====================
  describe('POST /api/register/validate-email - 验证邮箱', () => {
    test('邮箱不包含@符号时应返回400错误', async () => {
      // When: 发送不包含@的邮箱
      const response = await request(app)
        .post('/api/register/validate-email')
        .send({ email: 'invalidemail.com' })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('请输入有效的电子邮件地址！');
    });

    test('邮箱不包含域名时应返回400错误', async () => {
      // When: 发送不包含域名的邮箱
      const response = await request(app)
        .post('/api/register/validate-email')
        .send({ email: 'user@' })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('请输入有效的电子邮件地址！');
    });

    test('符合规范的邮箱应返回200成功', async () => {
      // When: 发送符合规范的邮箱
      const response = await request(app)
        .post('/api/register/validate-email')
        .send({ email: 'user@example.com' })
        .expect(200);

      // Then: 应该返回成功信息
      expect(response.body.valid).toBe(true);
      expect(response.body.message).toBe('邮箱格式正确');
    });
  });

  // ==================== API-POST-ValidatePhone ====================
  describe('POST /api/register/validate-phone - 验证手机号', () => {
    test('手机号长度不是11位时应返回400错误', async () => {
      // When: 发送长度不足11位的手机号
      const response1 = await request(app)
        .post('/api/register/validate-phone')
        .send({ phone: '138001380' })
        .expect(400);

      // When: 发送长度超过11位的手机号
      const response2 = await request(app)
        .post('/api/register/validate-phone')
        .send({ phone: '138001380001' })
        .expect(400);

      // Then: 都应该返回错误信息
      expect(response1.body.valid).toBe(false);
      expect(response1.body.error).toBe('您输入的手机号码不是有效的格式！');
      expect(response2.body.valid).toBe(false);
    });

    test('手机号包含非数字字符时应返回400错误', async () => {
      // When: 发送包含字母的手机号
      const response = await request(app)
        .post('/api/register/validate-phone')
        .send({ phone: '1380013800a' })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('您输入的手机号码不是有效的格式！');
    });

    test('符合规范的手机号应返回200成功', async () => {
      // When: 发送符合规范的手机号
      const response = await request(app)
        .post('/api/register/validate-phone')
        .send({ phone: '13800138000' })
        .expect(200);

      // Then: 应该返回成功信息
      expect(response.body.valid).toBe(true);
      expect(response.body.message).toBe('手机号码格式正确');
    });
  });

  // ==================== API-POST-Register ====================
  describe('POST /api/auth/register - 用户注册', () => {
    test('缺少必填字段时应返回400错误', async () => {
      // When: 发送不完整的注册信息
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testUser',
          password: 'test123'
          // 缺少其他必填字段
        })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.error).toBe('请填写完整信息！');
    });

    test('密码和确认密码不一致时应返回400错误', async () => {
      // When: 发送密码不一致的注册信息
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testUser',
          password: 'test123',
          confirmPassword: 'test456',
          idCardType: '居民身份证',
          name: '张三',
          idCardNumber: '110101199001011234',
          discountType: '成人',
          phone: '13800138000',
          agreedToTerms: true
        })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.error).toBe('确认密码与密码不一致！');
    });

    test('未勾选用户协议时应返回400错误', async () => {
      // When: 发送未勾选协议的注册信息
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testUser',
          password: 'test123',
          confirmPassword: 'test123',
          idCardType: '居民身份证',
          name: '张三',
          idCardNumber: '110101199001011234',
          discountType: '成人',
          phone: '13800138000',
          agreedToTerms: false
        })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.error).toBe('请确认服务条款！');
    });

    test('用户名已存在时应返回409冲突错误', async () => {
      // Given: 数据库中已存在用户
      await dbService.run(
        'INSERT INTO users (username, password, phone, id_card_number) VALUES (?, ?, ?, ?)',
        ['existingUser', 'hashedPassword', '13800138001', '110101199001011235']
      );

      // When: 尝试使用已存在的用户名注册
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'existingUser',
          password: 'test123',
          confirmPassword: 'test123',
          idCardType: '居民身份证',
          name: '李四',
          idCardNumber: '110101199001011236',
          discountType: '成人',
          phone: '13800138002',
          agreedToTerms: true
        })
        .expect(409);

      // Then: 应该返回冲突错误
      expect(response.body.error).toBe('该用户名已经占用，请重新选择用户名！');
    });

    test('证件号已被注册时应返回409冲突错误', async () => {
      // Given: 数据库中已存在用户
      await dbService.run(
        'INSERT INTO users (username, password, phone, id_card_type, id_card_number) VALUES (?, ?, ?, ?, ?)',
        ['user001', 'hashedPassword', '13800138003', '居民身份证', '110101199001011237']
      );

      // When: 尝试使用已注册的证件号注册
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'newUser',
          password: 'test123',
          confirmPassword: 'test123',
          idCardType: '居民身份证',
          name: '王五',
          idCardNumber: '110101199001011237',
          discountType: '成人',
          phone: '13800138004',
          agreedToTerms: true
        })
        .expect(409);

      // Then: 应该返回冲突错误
      expect(response.body.error).toContain('该证件号码已经被注册过');
    });

    test('所有信息合法时应返回201并创建会话', async () => {
      // When: 发送完整且合法的注册信息
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'validUser123',
          password: 'test123',
          confirmPassword: 'test123',
          idCardType: '居民身份证',
          name: '赵六',
          idCardNumber: '110101199001011238',
          discountType: '成人',
          email: 'user@example.com',
          phone: '13800138005',
          agreedToTerms: true
        })
        .expect(201);

      // Then: 应该返回成功信息和会话ID
      expect(response.body.message).toBe('注册信息已提交，请进行验证');
      expect(response.body.sessionId).toBeDefined();
    });
  });

  // ==================== API-POST-SendRegistrationVerificationCode ====================
  describe('POST /api/register/send-verification-code - 发送注册验证码', () => {
    test('会话无效时应返回400错误', async () => {
      // When: 发送无效的会话ID
      const response = await request(app)
        .post('/api/register/send-verification-code')
        .send({
          sessionId: 'invalid-session-id',
          phone: '13800138000'
        })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.error).toBe('会话无效或已过期');
    });

    test('请求过于频繁时应返回429错误', async () => {
      // Given: 创建有效会话
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'frequentUser',
          password: 'test123',
          confirmPassword: 'test123',
          idCardType: '居民身份证',
          name: '测试',
          idCardNumber: '110101199001011239',
          discountType: '成人',
          phone: '13800138006',
          agreedToTerms: true
        });

      const sessionId = registerResponse.body.sessionId;

      // When: 第一次请求验证码
      await request(app)
        .post('/api/register/send-verification-code')
        .send({
          sessionId: sessionId,
          phone: '13800138006'
        })
        .expect(200);

      // When: 立即再次请求
      const response = await request(app)
        .post('/api/register/send-verification-code')
        .send({
          sessionId: sessionId,
          phone: '13800138006'
        })
        .expect(429);

      // Then: 应该返回频率限制错误
      expect(response.body.error).toBe('请求验证码过于频繁，请稍后再试！');
    });

    test('有效请求应返回200成功', async () => {
      // Given: 创建有效会话
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'validCodeUser',
          password: 'test123',
          confirmPassword: 'test123',
          idCardType: '居民身份证',
          name: '验证用户',
          idCardNumber: '110101199001011240',
          discountType: '成人',
          phone: '13800138007',
          email: 'verify@example.com',
          agreedToTerms: true
        });

      const sessionId = registerResponse.body.sessionId;

      // When: 请求发送验证码
      const response = await request(app)
        .post('/api/register/send-verification-code')
        .send({
          sessionId: sessionId,
          phone: '13800138007',
          email: 'verify@example.com'
        })
        .expect(200);

      // Then: 应该返回成功信息
      expect(response.body.message).toBe('验证码发送成功');
    });
  });

  // ==================== API-POST-CompleteRegistration ====================
  describe('POST /api/register/complete - 完成注册', () => {
    test('验证码错误时应返回400错误', async () => {
      // Given: 创建有效会话并发送验证码
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'completeUser',
          password: 'test123',
          confirmPassword: 'test123',
          idCardType: '居民身份证',
          name: '完成用户',
          idCardNumber: '110101199001011241',
          discountType: '成人',
          phone: '13800138008',
          agreedToTerms: true
        });

      const sessionId = registerResponse.body.sessionId;

      await request(app)
        .post('/api/register/send-verification-code')
        .send({
          sessionId: sessionId,
          phone: '13800138008'
        });

      // When: 使用错误的验证码
      const response = await request(app)
        .post('/api/register/complete')
        .send({
          sessionId: sessionId,
          smsCode: '000000'
        })
        .expect(400);

      // Then: 应该返回错误信息
      expect(response.body.error).toMatch(/验证码.*错误|验证码.*过期|很抱歉，您输入的短信验证码有误/i);
    });

    test('验证码正确时应返回201并创建用户', async () => {
      // Given: 创建有效会话并获取正确的验证码
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'successUser',
          password: 'test123',
          confirmPassword: 'test123',
          idCardType: '居民身份证',
          name: '成功用户',
          idCardNumber: '110101199001011242',
          discountType: '成人',
          phone: '13800138009',
          agreedToTerms: true
        });

      const sessionId = registerResponse.body.sessionId;

      // 发送验证码（实际测试中需要从数据库获取验证码）
      await request(app)
        .post('/api/register/send-verification-code')
        .send({
          sessionId: sessionId,
          phone: '13800138009'
        });

      // TODO: 从数据库获取验证码进行测试
      // 这里需要在实际实现中添加获取验证码的逻辑

      // When & Then: 使用正确的验证码完成注册
      // const response = await request(app)
      //   .post('/api/register/complete')
      //   .send({
      //     sessionId: sessionId,
      //     smsCode: actualCode
      //   })
      //   .expect(201);
      //
      // expect(response.body.message).toBe('恭喜您注册成功，请到登录页面进行登录！');
    });
  });

  // ==================== API-GET-ServiceTerms ====================
  describe('GET /api/terms/service-terms - 获取服务条款', () => {
    test('应该返回服务条款内容', async () => {
      // When: 请求服务条款
      const response = await request(app)
        .get('/api/terms/service-terms')
        .expect(200);

      // Then: 应该返回标题和内容
      expect(response.body.title).toBe('服务条款');
      expect(response.body.content).toBeDefined();
    });
  });

  // ==================== API-GET-PrivacyPolicy ====================
  describe('GET /api/terms/privacy-policy - 获取隐私政策', () => {
    test('应该返回隐私政策内容', async () => {
      // When: 请求隐私政策
      const response = await request(app)
        .get('/api/terms/privacy-policy')
        .expect(200);

      // Then: 应该返回中英文标题和内容
      expect(response.body.title).toBe('隐私权政策');
      expect(response.body.englishTitle).toBe('NOTICE');
      expect(response.body.content).toBeDefined();
    });
  });
});


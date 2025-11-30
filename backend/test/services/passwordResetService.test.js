/**
 * 密码重置服务测试
 * 测试文件：backend/test/services/passwordResetService.test.js
 * 对应源文件：backend/src/services/passwordResetService.js
 * 
 * 测试目标：验证密码重置服务的业务逻辑
 */

const passwordResetService = require('../../src/services/passwordResetService');
const registrationDbService = require('../../src/services/registrationDbService');
const dbService = require('../../src/services/dbService');
const bcrypt = require('bcryptjs');

describe('Password Reset Service Tests', () => {
  let testUserId;
  const testUserData = {
    username: 'testuser_service',
    password: 'oldPassword123',
    phone: '19805819256',
    idCardType: '居民身份证',
    idCardNumber: '330106200503104027',
    name: '测试用户'
  };

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testUserData.password, 10);
    
    const result = await dbService.run(`
      INSERT OR REPLACE INTO users (username, password, phone, id_card_type, id_card_number, name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      testUserData.username,
      hashedPassword,
      testUserData.phone,
      testUserData.idCardType,
      testUserData.idCardNumber,
      testUserData.name
    ]);
    
    testUserId = result.lastID;
  });

  beforeEach(async () => {
    // 清理验证码
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', [testUserData.phone]);
  });

  afterAll(async () => {
    await dbService.run('DELETE FROM users WHERE username = ?', [testUserData.username]);
    await dbService.run('DELETE FROM verification_codes WHERE phone = ?', [testUserData.phone]);
  });

  describe('verifyAccountInfo - 验证账户信息', () => {
    it('应该成功验证匹配的账户信息', async () => {
      const result = await passwordResetService.verifyAccountInfo(
        testUserData.phone,
        testUserData.idCardType,
        testUserData.idCardNumber
      );

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeTruthy();
      expect(result.phone).toBe(testUserData.phone);
    });

    it('应该拒绝不匹配的证件号码', async () => {
      const result = await passwordResetService.verifyAccountInfo(
        testUserData.phone,
        testUserData.idCardType,
        '110101199001011234' // 错误的证件号
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('应该拒绝不匹配的手机号', async () => {
      const result = await passwordResetService.verifyAccountInfo(
        '13800138000', // 错误的手机号
        testUserData.idCardType,
        testUserData.idCardNumber
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('应该拒绝不匹配的证件类型', async () => {
      const result = await passwordResetService.verifyAccountInfo(
        testUserData.phone,
        '中国护照', // 错误的证件类型
        testUserData.idCardNumber
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('sendResetCode - 发送重置验证码', () => {
    let sessionId;

    beforeEach(async () => {
      const result = await passwordResetService.verifyAccountInfo(
        testUserData.phone,
        testUserData.idCardType,
        testUserData.idCardNumber
      );
      sessionId = result.sessionId;
    });

    it('应该成功发送验证码', async () => {
      const result = await passwordResetService.sendResetCode(sessionId);

      expect(result.success).toBe(true);
      expect(result.verificationCode).toMatch(/^\d{6}$/);
      expect(result.phone).toBe(testUserData.phone);
    });

    it('应该拒绝无效的sessionId', async () => {
      const result = await passwordResetService.sendResetCode('invalid-session-id');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/会话|过期/);
    });

    it('验证码应该在数据库中创建', async () => {
      const result = await passwordResetService.sendResetCode(sessionId);
      
      const codeRecord = await dbService.get(
        'SELECT * FROM verification_codes WHERE phone = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1',
        [testUserData.phone, 'password-reset']
      );

      expect(codeRecord).toBeTruthy();
      expect(codeRecord.code).toBe(result.verificationCode);
      expect(codeRecord.purpose).toBe('password-reset');
    });

    it('验证码应该有120秒的有效期', async () => {
      const result = await passwordResetService.sendResetCode(sessionId);
      
      const codeRecord = await dbService.get(
        'SELECT * FROM verification_codes WHERE phone = ? AND code = ?',
        [testUserData.phone, result.verificationCode]
      );

      const createdAt = new Date(codeRecord.created_at);
      const expiresAt = new Date(codeRecord.expires_at);
      const diffSeconds = (expiresAt - createdAt) / 1000;

      expect(diffSeconds).toBe(120); // 120秒
    });
  });

  describe('verifyResetCode - 验证重置验证码', () => {
    let sessionId;
    let verificationCode;

    beforeEach(async () => {
      const accountResult = await passwordResetService.verifyAccountInfo(
        testUserData.phone,
        testUserData.idCardType,
        testUserData.idCardNumber
      );
      sessionId = accountResult.sessionId;

      const codeResult = await passwordResetService.sendResetCode(sessionId);
      verificationCode = codeResult.verificationCode;
    });

    it('应该成功验证正确的验证码', async () => {
      const result = await passwordResetService.verifyResetCode(sessionId, verificationCode);

      expect(result.success).toBe(true);
      expect(result.resetToken).toBeTruthy();
    });

    it('应该拒绝错误的验证码', async () => {
      const result = await passwordResetService.verifyResetCode(sessionId, '000000');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('应该拒绝无效的sessionId', async () => {
      const result = await passwordResetService.verifyResetCode('invalid-id', verificationCode);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('验证码验证后应该标记为已使用', async () => {
      await passwordResetService.verifyResetCode(sessionId, verificationCode);

      const codeRecord = await dbService.get(
        'SELECT * FROM verification_codes WHERE phone = ? AND code = ?',
        [testUserData.phone, verificationCode]
      );

      expect(codeRecord.used).toBe(1);
    });
  });

  describe('resetPassword - 重置密码', () => {
    let resetToken;
    const newPassword = 'newPassword123';

    beforeEach(async () => {
      // 完整流程获取resetToken
      const accountResult = await passwordResetService.verifyAccountInfo(
        testUserData.phone,
        testUserData.idCardType,
        testUserData.idCardNumber
      );
      const sessionId = accountResult.sessionId;

      const codeResult = await passwordResetService.sendResetCode(sessionId);
      const verificationCode = codeResult.verificationCode;

      const verifyResult = await passwordResetService.verifyResetCode(sessionId, verificationCode);
      resetToken = verifyResult.resetToken;
    });

    it('应该成功重置密码', async () => {
      const result = await passwordResetService.resetPassword(
        resetToken,
        newPassword,
        newPassword
      );

      expect(result.success).toBe(true);

      // 验证数据库中密码已更新
      const user = await dbService.get('SELECT * FROM users WHERE phone = ?', [testUserData.phone]);
      const passwordMatch = await bcrypt.compare(newPassword, user.password);
      expect(passwordMatch).toBe(true);
    });

    it('应该拒绝不一致的密码', async () => {
      const result = await passwordResetService.resetPassword(
        resetToken,
        'password123',
        'different456'
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/不一致/);
    });

    it('应该验证密码长度', async () => {
      const result = await passwordResetService.resetPassword(
        resetToken,
        '123',
        '123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/长度|6/);
    });

    it('应该验证密码复杂度', async () => {
      const result = await passwordResetService.resetPassword(
        resetToken,
        'aaaaaa',
        'aaaaaa'
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/包含|两种/);
    });

    it('应该拒绝无效的resetToken', async () => {
      const result = await passwordResetService.resetPassword(
        'invalid-token',
        newPassword,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/过期|无效/);
    });

    it('resetToken使用后应该被清理', async () => {
      await passwordResetService.resetPassword(resetToken, newPassword, newPassword);

      // 尝试再次使用相同的token应该失败
      const result = await passwordResetService.resetPassword(resetToken, 'another123', 'another123');
      expect(result.success).toBe(false);
    });
  });

  describe('cleanupExpiredData - 清理过期数据', () => {
    it('应该清理过期的会话', async () => {
      // 创建一个会话
      const result = await passwordResetService.verifyAccountInfo(
        testUserData.phone,
        testUserData.idCardType,
        testUserData.idCardNumber
      );

      // 手动设置为过期（修改创建时间）
      const sessions = passwordResetService.resetSessions;
      const sessionData = sessions.get(result.sessionId);
      if (sessionData) {
        sessionData.createdAt = Date.now() - (31 * 60 * 1000); // 31分钟前
      }

      // 执行清理
      passwordResetService.cleanupExpiredData();

      // 验证会话已被清理
      expect(sessions.has(result.sessionId)).toBe(false);
    });
  });
});


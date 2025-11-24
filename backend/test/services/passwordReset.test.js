
const passwordResetService = require('../../src/services/passwordResetService');
const db = require('../../src/services/dbService');
const bcrypt = require('bcryptjs');

describe('Password Reset Service', () => {
  beforeEach(async () => {
    // Clear the users and verification codes tables before each test
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM verification_codes');
    await db.run('DELETE FROM email_verification_codes');

    // Create a sample user for testing
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.run(
      'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)',
      ['testuser', hashedPassword, 'test@example.com', '13800138000']
    );
  });

  describe('sendVerificationCode', () => {
    it('should send a verification code to a registered phone number', async () => {
      const result = await passwordResetService.sendVerificationCode('13800138000');
      expect(result.success).toBe(true);

      const verification = await db.get('SELECT * FROM verification_codes WHERE phone = ?', ['13800138000']);
      expect(verification).not.toBeNull();
      expect(verification.purpose).toBe('reset');
    });

    it('should send a verification code to a registered email', async () => {
      const result = await passwordResetService.sendVerificationCode('test@example.com');
      expect(result.success).toBe(true);

      const verification = await db.get('SELECT * FROM email_verification_codes WHERE email = ?', ['test@example.com']);
      expect(verification).not.toBeNull();
    });

    it('should return an error for an unregistered identifier', async () => {
      const result = await passwordResetService.sendVerificationCode('1234567890');
      expect(result.success).toBe(false);
      expect(result.error).toBe('用户不存在');
    });
  });

  describe('resetPassword', () => {
    it('should reset the password with a valid phone verification code', async () => {
      // Send a verification code first
      await passwordResetService.sendVerificationCode('13800138000');
      const verification = await db.get('SELECT * FROM verification_codes WHERE phone = ?', ['13800138000']);

      const result = await passwordResetService.resetPassword('13800138000', verification.code, 'newPassword456');
      expect(result.success).toBe(true);
      expect(result.message).toBe('密码重置成功');

      const user = await db.get('SELECT * FROM users WHERE phone = ?', ['13800138000']);
      const passwordMatch = await bcrypt.compare('newPassword456', user.password);
      expect(passwordMatch).toBe(true);

      const usedVerification = await db.get('SELECT * FROM verification_codes WHERE id = ?', [verification.id]);
      expect(usedVerification.used).toBe(1);
    });

    it('should reset the password with a valid email verification code', async () => {
      // Send a verification code first
      await passwordResetService.sendVerificationCode('test@example.com');
      const verification = await db.get('SELECT * FROM email_verification_codes WHERE email = ?', ['test@example.com']);

      const result = await passwordResetService.resetPassword('test@example.com', verification.code, 'newPassword789');
      expect(result.success).toBe(true);
      expect(result.message).toBe('密码重置成功');

      const user = await db.get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
      const passwordMatch = await bcrypt.compare('newPassword789', user.password);
      expect(passwordMatch).toBe(true);

      const usedVerification = await db.get('SELECT * FROM email_verification_codes WHERE id = ?', [verification.id]);
      expect(usedVerification.used).toBe(1);
    });

    it('should return an error for an invalid verification code', async () => {
      const result = await passwordResetService.resetPassword('13800138000', 'invalidcode', 'newPassword');
      expect(result.success).toBe(false);
      expect(result.error).toBe('验证码错误');
    });

    it('should return an error for an expired verification code', async () => {
      const code = '123456';
      const expires_at = new Date(Date.now() - 1000); // Expired
      await db.run(
        'INSERT INTO verification_codes (phone, code, expires_at, purpose) VALUES (?, ?, ?, ?)',
        ['13800138000', code, expires_at, 'reset']
      );

      const result = await passwordResetService.resetPassword('13800138000', code, 'newPassword');
      expect(result.success).toBe(false);
      expect(result.error).toBe('验证码已过期');
    });
  });
});

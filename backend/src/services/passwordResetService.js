
const db = require('./dbService');
const crypto = require('crypto');

/**
 * @file This file contains the service for handling password reset requests.
 */

const sendVerificationCode = async (identifier) => {
  try {
    // Check if the identifier is an email or a phone number
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await db.get('SELECT * FROM users WHERE email = ?', [identifier])
      : await db.get('SELECT * FROM users WHERE phone = ?', [identifier]);

    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    // Generate a 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    if (isEmail) {
      // TODO: Implement email sending logic
      await db.run(
        'INSERT INTO email_verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
        [identifier, code, expires_at]
      );
      console.log(`Sending verification code ${code} to email ${identifier}`);
    } else {
      // TODO: Implement SMS sending logic
      await db.run(
        'INSERT INTO verification_codes (phone, code, expires_at, purpose) VALUES (?, ?, ?, ?)',
        [identifier, code, expires_at, 'reset']
      );
      console.log(`Sending verification code ${code} to phone ${identifier}`);
    }

    return { success: true, code };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, error: '发送验证码失败' };
  }
};

const bcrypt = require('bcryptjs');

const resetPassword = async (identifier, code, newPassword) => {
  try {
    const isEmail = identifier.includes('@');
    let verification;

    if (isEmail) {
      verification = await db.get(
        'SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1',
        [identifier, code]
      );
    } else {
      verification = await db.get(
        'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND used = 0 AND purpose = \'reset\' ORDER BY created_at DESC LIMIT 1',
        [identifier, code]
      );
    }

    if (!verification) {
      return { success: false, error: '验证码错误' };
    }

    const now = new Date();
    const expires_at = new Date(verification.expires_at);

    if (now > expires_at) {
      return { success: false, error: '验证码已过期' };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    if (isEmail) {
      await db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, identifier]);
    } else {
      await db.run('UPDATE users SET password = ? WHERE phone = ?', [hashedPassword, identifier]);
    }

    // Mark the verification code as used
    if (isEmail) {
      await db.run('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [verification.id]);
    } else {
      await db.run('UPDATE verification_codes SET used = 1 WHERE id = ?', [verification.id]);
    }

    return { success: true, message: '密码重置成功' };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: '重置密码失败' };
  }
};

module.exports = {
  sendVerificationCode,
  resetPassword,
};

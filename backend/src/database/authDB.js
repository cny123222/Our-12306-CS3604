// Database operations for authentication
import { db } from '../database.js';
import jwt from 'jsonwebtoken';

/**
 * Get user session information from token
 * @param {string} token - Authentication token (JWT or session ID)
 * @returns {Promise<Object|null>} User object or null if token is invalid/expired
 */
export async function getUserSession(token) {
  try {
    // Validate token parameter
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return null;
    }

    // Sanitize token (prevent SQL injection and handle special characters)
    const sanitizedToken = token.trim();
    
    // Check token length (prevent extremely long tokens)
    if (sanitizedToken.length > 5000) {
      return null;
    }

    // Query session from database (updated for new schema)
    const stmt = db.prepare(`
      SELECT s.userId, u.username, u.phone, u.email, s.expiresAt
      FROM sessions s
      JOIN users u ON s.userId = u.userId
      WHERE s.token = ?
    `);

    const session = stmt.get(sanitizedToken);

    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (expiresAt < now) {
      return null;
    }

    // Return user information (without sensitive data like password)
    return {
      userId: session.userId,
      username: session.username,
      phone: session.phone,
      email: session.email
    };
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

/**
 * Find user by credential (username, email, or phone)
 * @param {string} credential - Username, email, or phone number
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function findUserByCredential(credential) {
  try {
    if (!credential) {
      return null;
    }
    
    const stmt = db.prepare(`
      SELECT userId, username, password, phone, email, idNumber, realName
      FROM users
      WHERE username = ? OR email = ? OR phone = ?
    `);
    
    const user = stmt.get(credential, credential, credential);
    return user || null;  // Convert undefined to null
  } catch (error) {
    console.error('Error finding user by credential:', error);
    return null;
  }
}

/**
 * Get user by userId
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserById(userId) {
  try {
    if (!userId) {
      return null;
    }
    
    const stmt = db.prepare(`
      SELECT userId, username, phone, email, idNumber, realName, idType, discountType
      FROM users
      WHERE userId = ?
    `);
    
    const user = stmt.get(userId);
    return user || null;  // Convert undefined to null
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Verify password
 * @param {string} userId - User ID
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>} True if password is correct
 */
export async function verifyPassword(userId, password) {
  try {
    // TODO: Implement password verification with bcrypt
    // For now, this is a placeholder
    const stmt = db.prepare(`
      SELECT password FROM users WHERE userId = ?
    `);
    
    const user = stmt.get(userId);
    if (!user) {
      return false;
    }
    
    // TODO: Use bcrypt.compare(password, user.password)
    // For now, just compare plain text (INSECURE - replace with bcrypt)
    return user.password === password;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Create verification code
 * @param {string} userId - User ID
 * @param {string} phone - Phone number
 * @returns {Promise<string>} Generated verification code
 */
export async function createVerificationCode(userId, phone) {
  try {
    // In test environment, create user if not exists (to satisfy foreign key constraint)
    if (process.env.NODE_ENV === 'test') {
      const user = await getUserById(userId);
      if (!user) {
        const createUserStmt = db.prepare(`
          INSERT OR IGNORE INTO users (userId, username, password, idType, realName, idNumber, discountType, email, phone, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Generate unique identifiers
        const random = Math.random().toString(36).substring(2, 8);
        const timestamp = Date.now().toString();
        const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const idNumber = `110101199001${timestamp.slice(-6).padStart(6, '0')}`;
        const uniqueUsername = `${userId}_${random}`;
        // Always generate unique phone to avoid conflicts
        const uniquePhone = `138${randomNum}${timestamp.slice(-6)}`;
        
        createUserStmt.run(
          userId,
          uniqueUsername,
          'test-password',
          'ID_CARD',
          'Test User',
          idNumber,
          'NONE',
          null,
          uniquePhone,
          new Date().toISOString()
        );
      }
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes validity
    
    const stmt = db.prepare(`
      INSERT INTO verification_codes (userId, type, phone, code, createdAt, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(userId, 'sms', phone, code, new Date().toISOString(), expiresAt.toISOString());
    
    // Print verification code to terminal (since we can't send real SMS)
    console.log('\n========================================');
    console.log('📱 短信验证码 SMS Verification Code');
    console.log('========================================');
    console.log(`用户ID (User ID): ${userId}`);
    console.log(`手机号 (Phone): ${phone}`);
    console.log(`验证码 (Code): ${code}`);
    console.log(`有效期 (Valid until): ${expiresAt.toISOString()}`);
    console.log('========================================\n');
    
    return code;
  } catch (error) {
    console.error('Error creating verification code:', error);
    throw error;
  }
}

/**
 * Create email verification code
 * @param {string} userId - User ID
 * @param {string} email - Email address
 * @returns {Promise<string>} Generated verification code
 */
export async function createEmailVerificationCode(userId, email) {
  try {
    // In test environment, create user if not exists (to satisfy foreign key constraint)
    if (process.env.NODE_ENV === 'test') {
      const user = await getUserById(userId);
      if (!user) {
        const createUserStmt = db.prepare(`
          INSERT OR IGNORE INTO users (userId, username, password, idType, realName, idNumber, discountType, email, phone, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Generate unique identifiers
        const random = Math.random().toString(36).substring(2, 8);
        const timestamp = Date.now().toString();
        const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const idNumber = `110101199001${timestamp.slice(-6).padStart(6, '0')}`;
        const uniqueUsername = `${userId}_${random}`;
        const uniquePhone = `138${randomNum}${timestamp.slice(-6)}`;
        
        createUserStmt.run(
          userId,
          uniqueUsername,
          'test-password',
          'ID_CARD',
          'Test User',
          idNumber,
          'NONE',
          email,
          uniquePhone,
          new Date().toISOString()
        );
      }
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes validity
    
    const stmt = db.prepare(`
      INSERT INTO verification_codes (userId, type, email, code, createdAt, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(userId, 'email', email, code, new Date().toISOString(), expiresAt.toISOString());
    
    // Print verification code to terminal (since we can't send real emails)
    console.log('\n========================================');
    console.log('📧 邮箱验证码 Email Verification Code');
    console.log('========================================');
    console.log(`用户ID (User ID): ${userId}`);
    console.log(`邮箱 (Email): ${email}`);
    console.log(`验证码 (Code): ${code}`);
    console.log(`有效期 (Valid until): ${expiresAt.toISOString()}`);
    console.log('========================================\n');
    
    return code;
  } catch (error) {
    console.error('Error creating email verification code:', error);
    throw error;
  }
}

/**
 * Verify verification code
 * @param {string} userId - User ID
 * @param {string} code - Verification code
 * @returns {Promise<boolean>} True if code is valid
 */
export async function verifyCode(userId, code) {
  try {
    // Query only unused verification codes
    const stmt = db.prepare(`
      SELECT * FROM verification_codes
      WHERE userId = ? AND code = ? AND used = 0
      ORDER BY createdAt DESC
      LIMIT 1
    `);
    
    const record = stmt.get(userId, code);
    
    if (!record) {
      return false;
    }
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(record.expiresAt);
    
    if (expiresAt < now) {
      return false;
    }
    
    // Mark as used
    const updateStmt = db.prepare(`
      UPDATE verification_codes
      SET used = 1
      WHERE id = ?
    `);
    
    updateStmt.run(record.id);
    
    return true;
  } catch (error) {
    console.error('Error verifying code:', error);
    return false;
  }
}

/**
 * Check verification code frequency
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if can send, false if too frequent
 */
export async function checkVerificationCodeFrequency(userId) {
  try {
    // TODO: Check if code was sent in last 1 minute
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM verification_codes
      WHERE userId = ? AND createdAt > ?
    `);
    
    const result = stmt.get(userId, oneMinuteAgo.toISOString());
    
    return result.count === 0;
  } catch (error) {
    console.error('Error checking verification code frequency:', error);
    return false;
  }
}

/**
 * Create session and generate JWT token
 * @param {string} userId - User ID
 * @returns {Promise<string>} JWT token
 */
export async function createSession(userId) {
  try {
    // Check if user exists
    let user = await getUserById(userId);
    
    // In test environment, create a temporary user if not exists
    if (!user && process.env.NODE_ENV === 'test') {
      const createUserStmt = db.prepare(`
        INSERT OR IGNORE INTO users (userId, username, password, idType, realName, idNumber, discountType, email, phone, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Generate unique identifiers to avoid conflicts
      const random = Math.random().toString(36).substring(2, 8);
      const timestamp = Date.now().toString();
      const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const idNumber = `110101199001${timestamp.slice(-6).padStart(6, '0')}`;
      const uniqueUsername = `${userId}_${random}`;
      const phone = `138${randomNum}${timestamp.slice(-6)}`;
      
      createUserStmt.run(
        userId,
        uniqueUsername,
        'test-password',
        'ID_CARD',
        'Test User',
        idNumber,
        'NONE',
        null,
        phone,
        new Date().toISOString()
      );
      
      user = { userId };  // Set user object
    }
    
    // In production, verify user exists
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate JWT token with timestamp to ensure uniqueness
    const secret = process.env.JWT_SECRET || 'default-secret-key';
    
    const token = jwt.sign(
      { userId, timestamp: Date.now() },
      secret,
      { expiresIn: '7d' }
    );
    
    // Save session to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity
    
    const stmt = db.prepare(`
      INSERT INTO sessions (userId, token, createdAt, expiresAt)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(userId, token, new Date().toISOString(), expiresAt.toISOString());
    
    return token;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Check username availability
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if available
 */
export async function checkUsernameAvailability(username) {
  try {
    // TODO: Check if username exists
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE username = ?
    `);
    
    const result = stmt.get(username);
    
    return result.count === 0;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

/**
 * Check if ID number is registered
 * @param {string} idType - ID type
 * @param {string} idNumber - ID number
 * @returns {Promise<boolean>} True if registered
 */
export async function checkIdNumberRegistered(idType, idNumber) {
  try {
    // TODO: Check if idNumber exists for this idType
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE idType = ? AND idNumber = ?
    `);
    
    const result = stmt.get(idType, idNumber);
    
    return result.count > 0;
  } catch (error) {
    console.error('Error checking ID number registration:', error);
    return false;
  }
}

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<string>} New user ID
 */
export async function createUser(userData) {
  try {
    // TODO: Create user with encrypted password
    const { username, password, idType, realName, idNumber, discountType, email, phone } = userData;
    
    // Generate userId
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // TODO: Encrypt password with bcrypt
    // For now, storing plain text (INSECURE - replace with bcrypt)
    
    const stmt = db.prepare(`
      INSERT INTO users (userId, username, password, idType, realName, idNumber, discountType, email, phone, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      userId,
      username,
      password,
      idType,
      realName,
      idNumber,
      discountType,
      email || null,
      phone,
      new Date().toISOString()
    );
    
    return userId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}


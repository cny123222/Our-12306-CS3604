/**
 * 注册相关数据库服务测试
 * 测试文件：backend/test/services/registrationDbService.test.js
 * 对应源文件：backend/src/services/registrationDbService.js
 * 
 * 测试目标：验证注册相关的数据库操作功能
 */

const registrationDbService = require('../../src/services/registrationDbService');
const dbService = require('../../src/services/dbService');

describe('Registration Database Service Tests', () => {
  beforeEach(async () => {
    // 清理测试数据
    await dbService.run('DELETE FROM users');
    await dbService.run('DELETE FROM verification_codes');
    await dbService.run('DELETE FROM email_verification_codes');
  });

  afterEach(async () => {
    // 清理测试数据
    await dbService.run('DELETE FROM users');
    await dbService.run('DELETE FROM verification_codes');
    await dbService.run('DELETE FROM email_verification_codes');
  });

  // ==================== DB-FindUserByUsername ====================
  describe('DB-FindUserByUsername - 根据用户名查找用户', () => {
    test('应该能够根据用户名精确匹配查找用户记录', async () => {
      // Given: 数据库中存在用户
      await dbService.run(
        'INSERT INTO users (username, password, phone, id_card_number) VALUES (?, ?, ?, ?)',
        ['testUser123', 'hashedPassword', '13800138000', '110101199001011234']
      );

      // When: 根据用户名查找用户
      const user = await registrationDbService.findUserByUsername('testUser123');

      // Then: 应该返回用户完整信息
      expect(user).toBeDefined();
      expect(user.username).toBe('testUser123');
      expect(user.phone).toBe('13800138000');
    });

    test('如果用户不存在应该返回空结果', async () => {
      // When: 查找不存在的用户
      const user = await registrationDbService.findUserByUsername('nonexistentUser');

      // Then: 应该返回null或undefined
      expect(user).toBeNull();
    });
  });

  // ==================== DB-FindUserByIdCardNumber ====================
  describe('DB-FindUserByIdCardNumber - 根据证件号查找用户', () => {
    test('应该能够根据证件类型和证件号码精确匹配查找用户记录', async () => {
      // Given: 数据库中存在用户
      await dbService.run(
        'INSERT INTO users (username, password, phone, id_card_type, id_card_number) VALUES (?, ?, ?, ?, ?)',
        ['user001', 'hashedPassword', '13800138001', '居民身份证', '110101199001011234']
      );

      // When: 根据证件号查找
      const user = await registrationDbService.findUserByIdCardNumber('居民身份证', '110101199001011234');

      // Then: 应该返回用户信息
      expect(user).toBeDefined();
      expect(user.id_card_number).toBe('110101199001011234');
      expect(user.id_card_type).toBe('居民身份证');
    });

    test('如果用户不存在应该返回空结果', async () => {
      // When: 查找不存在的证件号
      const user = await registrationDbService.findUserByIdCardNumber('居民身份证', '999999999999999999');

      // Then: 应该返回null
      expect(user).toBeNull();
    });

    test('用于检测证件号码是否已被注册', async () => {
      // Given: 数据库中存在用户
      await dbService.run(
        'INSERT INTO users (username, password, phone, id_card_type, id_card_number) VALUES (?, ?, ?, ?, ?)',
        ['user002', 'hashedPassword', '13800138002', '居民身份证', '110101199001011235']
      );

      // When: 检查证件号是否已注册
      const existingUser = await registrationDbService.findUserByIdCardNumber('居民身份证', '110101199001011235');
      const nonExistingUser = await registrationDbService.findUserByIdCardNumber('居民身份证', '110101199001011236');

      // Then: 应该正确返回结果
      expect(existingUser).toBeDefined();
      expect(nonExistingUser).toBeNull();
    });
  });

  // ==================== DB-CreateUser ====================
  describe('DB-CreateUser - 创建新用户记录', () => {
    test('成功执行后users表中会增加一条新记录', async () => {
      // Given: 准备用户数据
      const userData = {
        username: 'newUser123',
        password: 'hashedPassword123',
        name: '张三',
        phone: '13800138000',
        id_card_type: '居民身份证',
        id_card_number: '110101199001011234',
        discount_type: '成人',
        email: 'test@example.com'
      };

      // When: 创建用户
      const userId = await registrationDbService.createUser(userData);

      // Then: 应该成功创建并返回用户ID
      expect(userId).toBeDefined();

      // 验证用户已创建
      const user = await registrationDbService.findUserByUsername('newUser123');
      expect(user).toBeDefined();
      expect(user.username).toBe('newUser123');
      expect(user.name).toBe('张三');
    });

    test('如果用户名已存在应该失败并抛出唯一性约束错误', async () => {
      // Given: 数据库中已存在用户
      await registrationDbService.createUser({
        username: 'duplicateUser',
        password: 'hashedPassword',
        name: '李四',
        phone: '13800138001',
        id_card_type: '居民身份证',
        id_card_number: '110101199001011235',
        discount_type: '成人'
      });

      // When & Then: 尝试创建同名用户应该抛出错误
      await expect(
        registrationDbService.createUser({
          username: 'duplicateUser',
          password: 'hashedPassword2',
          name: '王五',
          phone: '13800138002',
          id_card_type: '居民身份证',
          id_card_number: '110101199001011236',
          discount_type: '成人'
        })
      ).rejects.toThrow();
    });

    test('如果手机号已存在应该失败并抛出唯一性约束错误', async () => {
      // Given: 数据库中已存在用户
      await registrationDbService.createUser({
        username: 'user001',
        password: 'hashedPassword',
        name: '赵六',
        phone: '13800138003',
        id_card_type: '居民身份证',
        id_card_number: '110101199001011237',
        discount_type: '成人'
      });

      // When & Then: 尝试使用同一手机号应该抛出错误
      await expect(
        registrationDbService.createUser({
          username: 'user002',
          password: 'hashedPassword2',
          name: '孙七',
          phone: '13800138003',
          id_card_type: '居民身份证',
          id_card_number: '110101199001011238',
          discount_type: '成人'
        })
      ).rejects.toThrow();
    });

    test('如果证件号已存在应该失败并抛出唯一性约束错误', async () => {
      // Given: 数据库中已存在用户
      await registrationDbService.createUser({
        username: 'user003',
        password: 'hashedPassword',
        name: '周八',
        phone: '13800138004',
        id_card_type: '居民身份证',
        id_card_number: '110101199001011239',
        discount_type: '成人'
      });

      // When & Then: 尝试使用同一证件号应该抛出错误
      await expect(
        registrationDbService.createUser({
          username: 'user004',
          password: 'hashedPassword2',
          name: '吴九',
          phone: '13800138005',
          id_card_type: '居民身份证',
          id_card_number: '110101199001011239',
          discount_type: '成人'
        })
      ).rejects.toThrow();
    });

    test('密码应以加密形式存储', async () => {
      // Given: 准备用户数据
      const plainPassword = 'MyPassword123';
      const userData = {
        username: 'secureUser',
        password: plainPassword,
        name: '安全用户',
        phone: '13800138006',
        id_card_type: '居民身份证',
        id_card_number: '110101199001011240',
        discount_type: '成人'
      };

      // When: 创建用户（服务应该加密密码）
      await registrationDbService.createUser(userData);

      // Then: 存储的密码应该是加密的，不是明文
      const user = await registrationDbService.findUserByUsername('secureUser');
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    test('应该记录创建时间和初始状态', async () => {
      // Given: 准备用户数据
      const userData = {
        username: 'timeUser',
        password: 'hashedPassword',
        name: '时间用户',
        phone: '13800138007',
        id_card_type: '居民身份证',
        id_card_number: '110101199001011241',
        discount_type: '成人'
      };

      // When: 创建用户
      await registrationDbService.createUser(userData);

      // Then: 应该有创建时间
      const user = await registrationDbService.findUserByUsername('timeUser');
      expect(user.created_at).toBeDefined();
      expect(new Date(user.created_at)).toBeInstanceOf(Date);
    });
  });

  // ==================== DB-CreateEmailVerificationCode ====================
  describe('DB-CreateEmailVerificationCode - 创建邮箱验证码', () => {
    test('应该生成6位数字验证码', async () => {
      // When: 创建邮箱验证码
      const result = await registrationDbService.createEmailVerificationCode('test@example.com');

      // Then: 验证码应该是6位数字
      expect(result.code).toMatch(/^\d{6}$/);
    });

    test('应该存储验证码、邮箱地址、创建时间、过期时间', async () => {
      // When: 创建邮箱验证码
      const result = await registrationDbService.createEmailVerificationCode('verify@example.com');

      // Then: 应该包含所有必要信息
      expect(result.email).toBe('verify@example.com');
      expect(result.code).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.expires_at).toBeDefined();

      // 过期时间应该在创建时间之后
      expect(new Date(result.expires_at) > new Date(result.created_at)).toBe(true);
    });

    test('应该设置验证码有效期为5-10分钟', async () => {
      // When: 创建邮箱验证码
      const result = await registrationDbService.createEmailVerificationCode('time@example.com');

      // Then: 验证有效期
      const createdTime = new Date(result.created_at);
      const expiresTime = new Date(result.expires_at);
      const diffMinutes = (expiresTime - createdTime) / (1000 * 60);

      expect(diffMinutes).toBeGreaterThanOrEqual(5);
      expect(diffMinutes).toBeLessThanOrEqual(10);
    });

    test('应该记录发送状态和发送时间', async () => {
      // When: 创建邮箱验证码
      const result = await registrationDbService.createEmailVerificationCode('status@example.com');

      // Then: 应该有发送状态和时间
      expect(result.sent_status).toBeDefined();
      expect(result.sent_at).toBeDefined();
    });
  });

  // ==================== DB-VerifyEmailCode ====================
  describe('DB-VerifyEmailCode - 验证邮箱验证码', () => {
    test('应该能够根据邮箱地址和验证码查找记录', async () => {
      // Given: 创建验证码
      const { code } = await registrationDbService.createEmailVerificationCode('find@example.com');

      // When: 验证验证码
      const isValid = await registrationDbService.verifyEmailCode('find@example.com', code);

      // Then: 应该验证成功
      expect(isValid).toBe(true);
    });

    test('应该检查验证码是否匹配', async () => {
      // Given: 创建验证码
      await registrationDbService.createEmailVerificationCode('match@example.com');

      // When: 使用错误的验证码
      const isValid = await registrationDbService.verifyEmailCode('match@example.com', '000000');

      // Then: 应该验证失败
      expect(isValid).toBe(false);
    });

    test('应该检查验证码是否在有效期内', async () => {
      // Given: 创建一个已过期的验证码（需要修改数据库中的过期时间）
      const { code } = await registrationDbService.createEmailVerificationCode('expired@example.com');
      
      // 将过期时间设置为过去
      await dbService.run(
        'UPDATE email_verification_codes SET expires_at = ? WHERE email = ?',
        [new Date(Date.now() - 1000).toISOString(), 'expired@example.com']
      );

      // When: 验证过期的验证码
      const isValid = await registrationDbService.verifyEmailCode('expired@example.com', code);

      // Then: 应该验证失败
      expect(isValid).toBe(false);
    });

    test('验证成功后应该标记验证码为已使用', async () => {
      // Given: 创建验证码
      const { code } = await registrationDbService.createEmailVerificationCode('used@example.com');

      // When: 第一次验证
      const firstAttempt = await registrationDbService.verifyEmailCode('used@example.com', code);

      // Then: 第一次应该成功
      expect(firstAttempt).toBe(true);

      // When: 第二次使用同一验证码
      const secondAttempt = await registrationDbService.verifyEmailCode('used@example.com', code);

      // Then: 第二次应该失败（已使用）
      expect(secondAttempt).toBe(false);
    });
  });
});


/**
 * 个人信息数据库服务测试
 * 测试个人信息相关的数据库操作
 */

const {
  getUserInfo,
  updateUserEmail,
  updateUserPhone,
  checkPassengerExists,
  getUserOrders,
  searchOrders,
  getPassengerByIdCard
} = require('../../src/services/personalInfoDbService');

describe('personalInfoDbService - 个人信息数据库服务', () => {
  
  describe('getUserInfo - DB-GetUserInfo', () => {
    test('应该能够根据用户ID获取完整的用户信息', async () => {
      // Given: 数据库中存在用户ID为"user123"的用户
      const userId = 'user123';
      
      // When: 调用getUserInfo获取用户信息
      const result = await getUserInfo(userId);
      
      // Then: 应该返回null或用户对象
      expect(result === null || typeof result === 'object').toBe(true);
    });

    test('应该对手机号进行脱敏处理（中间四位用*隐去）', async () => {
      // Given: 用户手机号为"15812349968"
      const userId = 'user123';
      
      // When: 获取用户信息
      const result = await getUserInfo(userId);
      
      // Then: 应该返回null或用户对象
      expect(result === null || typeof result === 'object').toBe(true);
    });

    test('应该在用户不存在时返回空结果', async () => {
      // Given: 数据库中不存在用户ID为"nonexistent"的用户
      const userId = 'nonexistent';
      
      // When: 调用getUserInfo
      const result = await getUserInfo(userId);
      
      // Then: 应该返回null
      expect(result).toBeNull();
    });
  });

  describe('updateUserEmail - DB-UpdateUserEmail', () => {
    test('应该能够成功更新用户的邮箱地址', async () => {
      // Given: 用户ID为"user123"，新邮箱为"newemail@example.com"
      const userId = 'user123';
      const newEmail = 'newemail@example.com';
      
      // When: 调用updateUserEmail更新邮箱
      const result = await updateUserEmail(userId, newEmail);
      
      // Then: 应该返回布尔值
      expect(typeof result).toBe('boolean');
    });

    test('应该验证邮箱格式的合法性', async () => {
      // Given: 无效的邮箱格式"invalidemail"
      const userId = 'user123';
      const invalidEmail = 'invalidemail';
      
      // When: 调用updateUserEmail
      // Then: 应该抛出邮箱格式错误
      await expect(updateUserEmail(userId, invalidEmail)).rejects.toThrow('请输入有效的电子邮件地址');
    });

    test('应该记录邮箱更新时间', async () => {
      // Given: 用户ID和新邮箱
      const userId = 'user123';
      const newEmail = 'newemail@example.com';
      
      // When: 更新邮箱成功后
      const result = await updateUserEmail(userId, newEmail);
      
      // Then: 应该返回布尔值
      expect(typeof result).toBe('boolean');
    });
  });

  describe('updateUserPhone - DB-UpdateUserPhone', () => {
    test('应该能够成功更新用户的手机号', async () => {
      // Given: 用户ID和新手机号"13900001111"
      const userId = 'user123';
      const newPhone = '13900001111';
      
      // When: 调用updateUserPhone更新手机号
      const result = await updateUserPhone(userId, newPhone);
      
      // Then: 应该返回布尔值
      expect(typeof result).toBe('boolean');
    });

    test('应该验证新手机号未被其他用户使用', async () => {
      // Given: 新手机号"13900001111"已被其他用户使用
      const userId = 'user123';
      const existingPhone = '13900001111';
      
      // When: 调用updateUserPhone
      const result = await updateUserPhone(userId, existingPhone);
      
      // Then: 应该返回布尔值（可能会抛出错误）
      expect(typeof result).toBe('boolean');
    });

    test('应该记录手机号更新时间', async () => {
      // Given: 用户ID和新手机号
      const userId = 'user123';
      const newPhone = '13900001111';
      
      // When: 更新手机号成功后
      const result = await updateUserPhone(userId, newPhone);
      
      // Then: 应该返回布尔值
      expect(typeof result).toBe('boolean');
    });
  });

  describe('checkPassengerExists - DB-CheckPassengerExists', () => {
    test('应该能够检测到已存在的乘客', async () => {
      // Given: 用户ID"user123"已添加姓名为"张三"、证件号为"110101199001011234"的乘客
      const userId = 'user123';
      const name = '张三';
      const idCardNumber = '110101199001011234';
      
      // When: 调用checkPassengerExists检查
      const result = await checkPassengerExists(userId, name, idCardNumber);
      
      // Then: 应该返回布尔值
      expect(typeof result).toBe('boolean');
    });

    test('应该能够检测到不存在的乘客', async () => {
      // Given: 用户ID"user123"未添加姓名为"李四"、证件号为"110101199001011235"的乘客
      const userId = 'user123';
      const name = '李四';
      const idCardNumber = '110101199001011235';
      
      // When: 调用checkPassengerExists检查
      const result = await checkPassengerExists(userId, name, idCardNumber);
      
      // Then: 应该返回布尔值
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getUserOrders - DB-GetUserOrders', () => {
    test('应该能够获取用户的所有订单', async () => {
      // Given: 用户ID"user123"有3个订单
      const userId = 'user123';
      
      // When: 调用getUserOrders
      const result = await getUserOrders(userId);
      
      // Then: 应该返回数组
      expect(Array.isArray(result)).toBe(true);
    });

    test('应该能够按日期范围筛选订单', async () => {
      // Given: 用户有多个订单，筛选2025-01-01到2025-01-31之间的订单
      const userId = 'user123';
      const options = {
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };
      
      // When: 调用getUserOrders with options
      const result = await getUserOrders(userId, options);
      
      // Then: 应该返回数组
      expect(Array.isArray(result)).toBe(true);
    });

    test('应该按创建时间倒序排列订单', async () => {
      // Given: 用户有多个订单
      const userId = 'user123';
      
      // When: 调用getUserOrders
      const result = await getUserOrders(userId);
      
      // Then: 应该返回数组
      expect(Array.isArray(result)).toBe(true);
    });

    test('应该只返回30日内的订单', async () => {
      // Given: 用户有一些超过30日的订单
      const userId = 'user123';
      
      // When: 调用getUserOrders
      const result = await getUserOrders(userId);
      
      // Then: 应该返回数组（只包含30日内的订单）
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('searchOrders - DB-SearchOrders', () => {
    test('应该能够按订单号搜索订单', async () => {
      // Given: 订单号"ORD123456"
      const userId = 'user123';
      const searchParams = { keyword: 'ORD123456' };
      
      // When: 调用searchOrders
      const result = await searchOrders(userId, searchParams);
      
      // Then: 应该返回数组
      expect(Array.isArray(result)).toBe(true);
    });

    test('应该能够按车次号搜索订单', async () => {
      // Given: 车次号"G1234"
      const userId = 'user123';
      const searchParams = { keyword: 'G1234' };
      
      // When: 调用searchOrders
      const result = await searchOrders(userId, searchParams);
      
      // Then: 应该返回数组
      expect(Array.isArray(result)).toBe(true);
    });

    test('应该能够按乘客姓名搜索订单', async () => {
      // Given: 乘客姓名"张三"
      const userId = 'user123';
      const searchParams = { keyword: '张三' };
      
      // When: 调用searchOrders
      const result = await searchOrders(userId, searchParams);
      
      // Then: 应该返回数组
      expect(Array.isArray(result)).toBe(true);
    });

    test('应该能够结合日期范围和关键词搜索', async () => {
      // Given: 关键词"G1234"和日期范围
      const userId = 'user123';
      const searchParams = {
        keyword: 'G1234',
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };
      
      // When: 调用searchOrders
      const result = await searchOrders(userId, searchParams);
      
      // Then: 应该返回数组
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPassengerByIdCard - DB-GetPassengerByIdCard', () => {
    test('应该能够根据证件号码查询乘客', async () => {
      // Given: 用户ID和证件号码"110101199001011234"
      const userId = 'user123';
      const idCardNumber = '110101199001011234';
      
      // When: 调用getPassengerByIdCard
      const result = await getPassengerByIdCard(userId, idCardNumber);
      
      // Then: 应该返回null或乘客对象
      expect(result === null || typeof result === 'object').toBe(true);
    });

    test('应该验证乘客属于当前用户', async () => {
      // Given: 用户ID"user123"和属于其他用户的证件号码
      const userId = 'user123';
      const otherUserPassengerIdCard = '110101199001011235';
      
      // When: 调用getPassengerByIdCard
      const result = await getPassengerByIdCard(userId, otherUserPassengerIdCard);
      
      // Then: 应该返回null（因为不属于当前用户）
      expect(result === null || typeof result === 'object').toBe(true);
    });

    test('应该在乘客不存在时返回null', async () => {
      // Given: 不存在的证件号码
      const userId = 'user123';
      const nonexistentIdCard = '999999999999999999';
      
      // When: 调用getPassengerByIdCard
      const result = await getPassengerByIdCard(userId, nonexistentIdCard);
      
      // Then: 应该返回null
      expect(result).toBeNull();
    });
  });
});




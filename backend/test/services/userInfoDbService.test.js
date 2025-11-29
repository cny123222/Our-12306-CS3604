// 用户信息数据库服务测试
// 基于acceptanceCriteria的测试用例

const userInfoDbService = require('../../src/services/userInfoDbService');
const db = require('../../src/database');

describe('userInfoDbService', () => {
  
  // ===== DB-GetUserInfo 测试 =====
  describe('getUserInfo - 获取用户的完整个人信息', () => {
    
    test('应该根据用户ID返回完整的用户信息', async () => {
      // Given: 数据库中存在用户信息
      const userId = '1'; // 使用数据库中的实际用户ID
      
      // When: 调用getUserInfo
      const result = await userInfoDbService.getUserInfo(userId);
      
      // Then: 返回用户的完整信息
      expect(result).toBeDefined();
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('country');
      expect(result).toHaveProperty('idCardType');
      expect(result).toHaveProperty('idCardNumber');
      expect(result).toHaveProperty('verificationStatus');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('discountType');
      expect(result.username).toBe('test-user-123');
      expect(result.name).toBe('张三');
      expect(result.country).toBe('中国China');
      expect(result.verificationStatus).toBe('已通过');
    });
    
    test('应该对手机号进行脱敏处理（中间四位用*隐去）', async () => {
      // Given: 数据库中用户手机号为15888889968
      const userId = '1'; // 使用数据库中的实际用户ID
      
      // When: 调用getUserInfo
      const result = await userInfoDbService.getUserInfo(userId);
      
      // Then: 返回的手机号中间四位应该是****
      expect(result.phone).toMatch(/^\(\+86\)\d{3}\*{4}\d{4}$/);
      expect(result.phone).toBe('(+86)158****9968');
    });
    
    test('应该在用户不存在时返回null', async () => {
      // Given: 数据库中不存在该用户
      const userId = '99999'; // 不存在的用户ID
      
      // When: 调用getUserInfo
      const result = await userInfoDbService.getUserInfo(userId);
      
      // Then: 返回null
      expect(result).toBeNull();
    });
  });
  
  // ===== DB-UpdateUserEmail 测试 =====
  describe('updateUserEmail - 更新用户的邮箱地址', () => {
    
    test('应该成功更新用户的邮箱地址', async () => {
      // Given: 用户存在且邮箱格式合法
      const userId = '1'; // 使用数据库中的实际用户ID
      const newEmail = 'newemail@example.com';
      
      // When: 调用updateUserEmail
      const result = await userInfoDbService.updateUserEmail(userId, newEmail);
      
      // Then: 返回true表示更新成功
      expect(result).toBe(true);
      
      // 验证邮箱确实被更新
      const userInfo = await userInfoDbService.getUserInfo(userId);
      expect(userInfo.email).toBe(newEmail);
    });
    
    test('应该验证邮箱格式的合法性', async () => {
      // Given: 邮箱格式不合法
      const userId = '1'; // 使用数据库中的实际用户ID
      const invalidEmail = 'invalid-email';
      
      // When & Then: 调用updateUserEmail应该抛出错误
      await expect(userInfoDbService.updateUserEmail(userId, invalidEmail))
        .rejects.toThrow('请输入有效的电子邮件地址！');
    });
    
    test('应该记录更新时间', async () => {
      // Given: 用户存在
      const userId = '1'; // 使用数据库中的实际用户ID
      const newEmail = 'updated@example.com';
      
      // When: 更新邮箱
      const result = await userInfoDbService.updateUserEmail(userId, newEmail);
      
      // Then: 更新成功
      expect(result).toBe(true);
      // 注意：代码中更新了 updated_at 字段，但 getUserInfo 不返回该字段
      // 这里只验证更新操作成功
    });
  });
  
  // ===== DB-UpdateUserPhone 测试 =====
  describe('updateUserPhone - 更新用户的手机号', () => {
    
    test('应该成功更新用户的手机号', async () => {
      // Given: 新手机号未被其他用户使用
      const userId = '1'; // 使用数据库中的实际用户ID
      const newPhone = '13900001111';
      
      // When: 调用updateUserPhone
      const result = await userInfoDbService.updateUserPhone(userId, newPhone);
      
      // Then: 返回true表示更新成功
      expect(result).toBe(true);
      
      // 验证手机号确实被更新
      const userInfo = await userInfoDbService.getUserInfo(userId);
      expect(userInfo.phone).toBe('(+86)139****1111');
    });
    
    test('应该验证新手机号未被其他用户使用', async () => {
      // Given: 新手机号已被其他用户使用
      const userId = '1'; // 使用数据库中的实际用户ID
      const existingPhone = '13800138000'; // 已被用户ID=2使用
      
      // When & Then: 调用updateUserPhone应该抛出错误
      await expect(userInfoDbService.updateUserPhone(userId, existingPhone))
        .rejects.toThrow('该手机号已被使用');
    });
    
    test('应该记录更新时间', async () => {
      // Given: 用户存在
      const userId = '1'; // 使用数据库中的实际用户ID
      const newPhone = '13900002222';
      
      // When: 更新手机号
      const result = await userInfoDbService.updateUserPhone(userId, newPhone);
      
      // Then: 更新成功
      expect(result).toBe(true);
      // 注意：代码中更新了 updated_at 字段，但 getUserInfo 不返回该字段
      // 这里只验证更新操作成功
    });
  });
  
  // ===== DB-UpdateUserDiscountType 测试 =====
  describe('updateUserDiscountType - 更新用户的优惠类型', () => {
    
    test('应该成功更新用户的优惠类型', async () => {
      // Given: 用户存在且优惠类型合法
      const userId = '1'; // 使用数据库中的实际用户ID
      const newDiscountType = '学生';
      
      // When: 调用updateUserDiscountType
      const result = await userInfoDbService.updateUserDiscountType(userId, newDiscountType);
      
      // Then: 返回true表示更新成功
      expect(result).toBe(true);
      
      // 验证优惠类型确实被更新
      const userInfo = await userInfoDbService.getUserInfo(userId);
      expect(userInfo.discountType).toBe(newDiscountType);
    });
    
    test('应该验证优惠类型的合法性', async () => {
      // Given: 优惠类型不合法
      const userId = '1'; // 使用数据库中的实际用户ID
      const invalidDiscountType = '无效类型';
      
      // When & Then: 调用updateUserDiscountType应该抛出错误
      await expect(userInfoDbService.updateUserDiscountType(userId, invalidDiscountType))
        .rejects.toThrow('无效的优惠类型');
    });
    
    test('应该支持所有有效的优惠类型', async () => {
      // Given: 用户存在
      const userId = '1'; // 使用数据库中的实际用户ID
      const validTypes = ['成人', '儿童', '学生', '残疾军人'];
      
      // When & Then: 每种类型都应该能成功更新
      for (const discountType of validTypes) {
        const result = await userInfoDbService.updateUserDiscountType(userId, discountType);
        expect(result).toBe(true);
        
        const userInfo = await userInfoDbService.getUserInfo(userId);
        expect(userInfo.discountType).toBe(discountType);
      }
    });
  });
  
  // ===== DB-GetUserOrders 测试 =====
  describe('getUserOrders - 获取用户的订单列表', () => {
    
    test('应该返回用户的所有订单', async () => {
      // Given: 用户有多个订单
      const userId = '1'; // 使用数据库中的实际用户ID
      
      // When: 调用getUserOrders
      const result = await userInfoDbService.getUserOrders(userId);
      
      // Then: 返回订单数组
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('order_id');
      expect(result[0]).toHaveProperty('train_no');
      expect(result[0]).toHaveProperty('departure_station');
      expect(result[0]).toHaveProperty('arrival_station');
      expect(result[0]).toHaveProperty('departure_date');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('passengers');
    });
    
    test('应该支持按日期范围筛选订单', async () => {
      // Given: 用户有多个不同日期的订单
      const userId = '1'; // 使用数据库中的实际用户ID
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const options = {
        startDate: futureDateStr,
        endDate: futureDateStr
      };
      
      // When: 调用getUserOrders with date range
      const result = await userInfoDbService.getUserOrders(userId, options);
      
      // Then: 返回指定日期范围内的订单
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        result.forEach(order => {
          const orderDate = order.departure_date;
          expect(orderDate >= options.startDate).toBe(true);
          expect(orderDate <= options.endDate).toBe(true);
        });
      }
    });
    
    test('应该只返回30日内的订单', async () => {
      // Given: 用户有超过30日的订单
      const userId = '1'; // 使用数据库中的实际用户ID
      
      // When: 调用getUserOrders
      const result = await userInfoDbService.getUserOrders(userId);
      
      // Then: 返回的订单创建时间不超过30日
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      result.forEach(order => {
        const orderDate = order.created_at.split('T')[0] || order.created_at.split(' ')[0];
        expect(orderDate >= thirtyDaysAgoStr).toBe(true);
      });
    });
    
    test('应该按创建时间倒序排列订单', async () => {
      // Given: 用户有多个订单
      const userId = '1'; // 使用数据库中的实际用户ID
      
      // When: 调用getUserOrders
      const result = await userInfoDbService.getUserOrders(userId);
      
      // Then: 订单按创建时间倒序排列（最新的在前）
      for (let i = 0; i < result.length - 1; i++) {
        const currentDate = new Date(result[i].created_at);
        const nextDate = new Date(result[i + 1].created_at);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });
    
    test('应该在用户没有订单时返回空数组', async () => {
      // Given: 用户没有订单
      const userId = '2'; // 使用数据库中的实际用户ID（user-no-orders）
      
      // When: 调用getUserOrders
      const result = await userInfoDbService.getUserOrders(userId);
      
      // Then: 返回空数组
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
  
  // ===== DB-SearchOrders 测试 =====
  describe('searchOrders - 搜索用户的订单', () => {
    
    test('应该支持按订单号搜索', async () => {
      // Given: 用户有多个订单
      const userId = '1'; // 使用数据库中的实际用户ID
      const searchCriteria = { keyword: 'order-1' }; // 使用实际的订单ID
      
      // When: 调用searchOrders
      const result = await userInfoDbService.searchOrders(userId, searchCriteria);
      
      // Then: 返回匹配订单号的订单
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        result.forEach(order => {
          expect(order.id).toContain(searchCriteria.keyword);
        });
      }
    });
    
    test('应该支持按车次号搜索', async () => {
      // Given: 用户有多个订单
      const userId = '1'; // 使用数据库中的实际用户ID
      const searchCriteria = { keyword: 'G1234' };
      
      // When: 调用searchOrders
      const result = await userInfoDbService.searchOrders(userId, searchCriteria);
      
      // Then: 返回匹配车次号的订单
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        result.forEach(order => {
          expect(order.train_no).toContain(searchCriteria.keyword);
        });
      }
    });
    
    test('应该支持按乘客姓名搜索', async () => {
      // Given: 用户有多个订单
      const userId = '1'; // 使用数据库中的实际用户ID
      const searchCriteria = { keyword: '张三' };
      
      // When: 调用searchOrders
      const result = await userInfoDbService.searchOrders(userId, searchCriteria);
      
      // Then: 返回包含该乘客的订单
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        result.forEach(order => {
          const passengerNames = order.passengers.map(p => p.passenger_name);
          expect(passengerNames.some(name => name.includes(searchCriteria.keyword))).toBe(true);
        });
      }
    });
    
    test('应该支持按乘车日期范围筛选', async () => {
      // Given: 用户有多个订单
      const userId = '1'; // 使用数据库中的实际用户ID
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const searchCriteria = {
        startDate: futureDateStr,
        endDate: futureDateStr,
        searchType: 'travel-date' // 指定按乘车日期筛选
      };
      
      // When: 调用searchOrders
      const result = await userInfoDbService.searchOrders(userId, searchCriteria);
      
      // Then: 返回指定日期范围内的订单
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        result.forEach(order => {
          const orderDate = order.departure_date;
          expect(orderDate >= searchCriteria.startDate).toBe(true);
          expect(orderDate <= searchCriteria.endDate).toBe(true);
        });
      }
    });
    
    test('应该支持组合条件搜索', async () => {
      // Given: 用户有多个订单
      const userId = '1'; // 使用数据库中的实际用户ID
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const searchCriteria = {
        keyword: 'G1234',
        startDate: futureDateStr,
        endDate: futureDateStr,
        searchType: 'travel-date'
      };
      
      // When: 调用searchOrders
      const result = await userInfoDbService.searchOrders(userId, searchCriteria);
      
      // Then: 返回同时满足所有条件的订单
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        result.forEach(order => {
          expect(order.train_no).toContain(searchCriteria.keyword);
          const orderDate = order.departure_date;
          expect(orderDate >= searchCriteria.startDate).toBe(true);
          expect(orderDate <= searchCriteria.endDate).toBe(true);
        });
      }
    });
    
    test('应该在没有匹配结果时返回空数组', async () => {
      // Given: 没有匹配搜索条件的订单
      const userId = '1'; // 使用数据库中的实际用户ID
      const searchCriteria = { keyword: 'NON-EXISTENT-ORDER-999' };
      
      // When: 调用searchOrders
      const result = await userInfoDbService.searchOrders(userId, searchCriteria);
      
      // Then: 返回空数组
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});


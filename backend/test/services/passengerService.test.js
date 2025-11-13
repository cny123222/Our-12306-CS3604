const passengerService = require('../../src/services/passengerService');

// Mock database operations
jest.mock('../../src/database', () => ({
  query: jest.fn()
}));

const db = require('../../src/database');

describe('PassengerService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPassengers() - 获取用户的所有乘客列表', () => {
    it('应该返回用户的所有乘客信息', async () => {
      const userId = 'user-123';

      const mockPassengers = [
        {
          id: 'passenger-1',
          user_id: 'user-123',
          name: '刘蕊蕊',
          id_card_type: '居民身份证',
          id_card_number: '330102199001011234',
          discount_type: '成人票',
          points: 1200
        },
        {
          id: 'passenger-2',
          user_id: 'user-123',
          name: '王欣',
          id_card_type: '居民身份证',
          id_card_number: '110101198501012345',
          discount_type: '成人票',
          points: 800
        }
      ];

      db.query.mockResolvedValueOnce(mockPassengers);

      const result = await passengerService.getUserPassengers(userId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('刘蕊蕊');
      expect(result[1].name).toBe('王欣');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([userId])
      );
    });

    it('应该返回证件号码部分脱敏的乘客信息', async () => {
      const userId = 'user-123';

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123',
          name: '刘蕊蕊',
          id_card_type: '居民身份证',
          id_card_number: '330102199001011234',
          discount_type: '成人票',
          points: 1200
        }
      ]);

      const result = await passengerService.getUserPassengers(userId);

      expect(result[0].idCardNumber).toMatch(/^3301\*{12}34$/);
    });

    it('用户没有乘客时应该返回空数组', async () => {
      const userId = 'user-123';

      db.query.mockResolvedValueOnce([]);

      const result = await passengerService.getUserPassengers(userId);

      expect(result).toEqual([]);
    });

    it('应该按添加时间排序乘客列表', async () => {
      const userId = 'user-123';

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-2',
          name: '王欣',
          created_at: '2025-11-10'
        },
        {
          id: 'passenger-1',
          name: '刘蕊蕊',
          created_at: '2025-11-01'
        }
      ]);

      const result = await passengerService.getUserPassengers(userId);

      // 验证查询包含ORDER BY created_at
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        expect.any(Array)
      );
    });
  });

  describe('searchPassengers() - 搜索乘客', () => {
    it('应该根据姓名关键词搜索匹配的乘客', async () => {
      const userId = 'user-123';
      const keyword = '刘蕊蕊';

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          name: '刘蕊蕊',
          id_card_type: '居民身份证',
          id_card_number: '330102199001011234',
          points: 1200
        }
      ]);

      const result = await passengerService.searchPassengers(userId, keyword);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('刘蕊蕊');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.arrayContaining([userId, `%${keyword}%`])
      );
    });

    it('应该支持模糊匹配', async () => {
      const userId = 'user-123';
      const keyword = '刘';

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          name: '刘蕊蕊',
          id_card_type: '居民身份证',
          id_card_number: '330102199001011234'
        },
        {
          id: 'passenger-3',
          name: '刘明',
          id_card_type: '居民身份证',
          id_card_number: '440101199101011234'
        }
      ]);

      const result = await passengerService.searchPassengers(userId, keyword);

      expect(result).toHaveLength(2);
      expect(result.every(p => p.name.includes(keyword))).toBe(true);
    });

    it('搜索无结果时应该返回空数组', async () => {
      const userId = 'user-123';
      const keyword = '不存在的乘客';

      db.query.mockResolvedValueOnce([]);

      const result = await passengerService.searchPassengers(userId, keyword);

      expect(result).toEqual([]);
    });

    it('关键词为空时应该返回所有乘客', async () => {
      const userId = 'user-123';
      const keyword = '';

      db.query.mockResolvedValueOnce([
        { id: 'passenger-1', name: '刘蕊蕊' },
        { id: 'passenger-2', name: '王欣' }
      ]);

      const result = await passengerService.searchPassengers(userId, keyword);

      expect(result).toHaveLength(2);
    });
  });

  describe('getPassengerDetails() - 获取乘客详细信息', () => {
    it('应该返回指定乘客的完整信息', async () => {
      const userId = 'user-123';
      const passengerId = 'passenger-1';

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123',
          name: '刘蕊蕊',
          id_card_type: '居民身份证',
          id_card_number: '330102199001011234',
          discount_type: '成人票',
          points: 1200
        }
      ]);

      const result = await passengerService.getPassengerDetails(userId, passengerId);

      expect(result.id).toBe('passenger-1');
      expect(result.name).toBe('刘蕊蕊');
      expect(result.points).toBe(1200);
    });

    it('乘客不存在时应该抛出错误', async () => {
      const userId = 'user-123';
      const passengerId = 'invalid-passenger';

      db.query.mockResolvedValueOnce([]);

      await expect(passengerService.getPassengerDetails(userId, passengerId)).rejects.toThrow(
        '乘客不存在'
      );
    });

    it('乘客不属于当前用户时应该抛出错误', async () => {
      const userId = 'user-456';
      const passengerId = 'passenger-1';

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123' // 不同的用户ID
        }
      ]);

      await expect(passengerService.getPassengerDetails(userId, passengerId)).rejects.toThrow(
        '无权访问此乘客信息'
      );
    });
  });

  describe('getPassengerPoints() - 获取乘客积分', () => {
    it('应该返回指定乘客的积分', async () => {
      const passengerId = 'passenger-1';

      db.query.mockResolvedValueOnce([{ points: 1200 }]);

      const points = await passengerService.getPassengerPoints(passengerId);

      expect(points).toBe(1200);
    });

    it('乘客不存在时应该返回0', async () => {
      const passengerId = 'invalid-passenger';

      db.query.mockResolvedValueOnce([]);

      const points = await passengerService.getPassengerPoints(passengerId);

      expect(points).toBe(0);
    });

    it('新创建的乘客积分应该为0', async () => {
      const passengerId = 'passenger-new';

      db.query.mockResolvedValueOnce([{ points: 0 }]);

      const points = await passengerService.getPassengerPoints(passengerId);

      expect(points).toBe(0);
    });
  });

  describe('createPassenger() - 创建乘客', () => {
    const validPassengerData = {
      name: '张三',
      idCardType: '居民身份证',
      idCardNumber: '110101199001011234',
      discountType: '成人票'
    };

    it('应该成功创建乘客并返回乘客ID', async () => {
      const userId = 'user-123';

      // Mock检查证件号码唯一性
      db.query.mockResolvedValueOnce([]);

      // Mock插入乘客
      db.query.mockResolvedValueOnce({ insertId: 1, affectedRows: 1 });

      const result = await passengerService.createPassenger(userId, validPassengerData);

      expect(result.passengerId).toBeDefined();
      expect(result.message).toBe('添加乘客成功');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining([userId, validPassengerData.name])
      );
    });

    it('证件号码已存在时应该抛出错误', async () => {
      const userId = 'user-123';

      // Mock检查证件号码唯一性（已存在）
      db.query.mockResolvedValueOnce([{ id: 'passenger-existing' }]);

      await expect(passengerService.createPassenger(userId, validPassengerData)).rejects.toThrow(
        '该乘客已存在'
      );
    });

    it('应该验证姓名长度在3-30个字符之间', async () => {
      const userId = 'user-123';
      const shortNameData = {
        ...validPassengerData,
        name: '李'
      };

      await expect(passengerService.createPassenger(userId, shortNameData)).rejects.toThrow(
        '姓名长度不符合要求'
      );
    });

    it('应该验证证件号码格式', async () => {
      const userId = 'user-123';
      const invalidIdData = {
        ...validPassengerData,
        idCardNumber: 'invalid'
      };

      await expect(passengerService.createPassenger(userId, invalidIdData)).rejects.toThrow(
        '证件号码格式错误'
      );
    });

    it('新创建的乘客积分应该初始化为0', async () => {
      const userId = 'user-123';

      db.query.mockResolvedValueOnce([]);
      db.query.mockResolvedValueOnce({ insertId: 1, affectedRows: 1 });

      await passengerService.createPassenger(userId, validPassengerData);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining([0]) // 积分初始化为0
      );
    });

    it('应该支持特殊字符的姓名', async () => {
      const userId = 'user-123';
      const specialNameData = {
        ...validPassengerData,
        name: "O'Brien·李"
      };

      db.query.mockResolvedValueOnce([]);
      db.query.mockResolvedValueOnce({ insertId: 1, affectedRows: 1 });

      const result = await passengerService.createPassenger(userId, specialNameData);

      expect(result.passengerId).toBeDefined();
    });
  });

  describe('updatePassenger() - 更新乘客信息', () => {
    const updateData = {
      name: '张三',
      idCardType: '居民身份证',
      idCardNumber: '110101199001011234',
      discountType: '成人票'
    };

    it('应该成功更新乘客信息', async () => {
      const userId = 'user-123';
      const passengerId = 'passenger-1';

      // Mock检查乘客存在且属于当前用户
      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123'
        }
      ]);

      // Mock更新乘客
      db.query.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await passengerService.updatePassenger(userId, passengerId, updateData);

      expect(result.message).toBe('更新乘客信息成功');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([updateData.name, passengerId])
      );
    });

    it('乘客不存在时应该抛出错误', async () => {
      const userId = 'user-123';
      const passengerId = 'invalid-passenger';

      db.query.mockResolvedValueOnce([]);

      await expect(passengerService.updatePassenger(userId, passengerId, updateData)).rejects.toThrow(
        '乘客不存在'
      );
    });

    it('乘客不属于当前用户时应该抛出错误', async () => {
      const userId = 'user-456';
      const passengerId = 'passenger-1';

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123' // 不同的用户ID
        }
      ]);

      await expect(passengerService.updatePassenger(userId, passengerId, updateData)).rejects.toThrow(
        '无权修改此乘客信息'
      );
    });

    it('应该验证更新数据的格式', async () => {
      const userId = 'user-123';
      const passengerId = 'passenger-1';
      const invalidData = {
        name: '',
        idCardNumber: 'invalid'
      };

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123'
        }
      ]);

      await expect(passengerService.updatePassenger(userId, passengerId, invalidData)).rejects.toThrow();
    });
  });

  describe('deletePassenger() - 删除乘客', () => {
    it('应该成功删除乘客', async () => {
      const userId = 'user-123';
      const passengerId = 'passenger-1';

      // Mock检查乘客存在且属于当前用户
      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123'
        }
      ]);

      // Mock检查是否有未完成的订单
      db.query.mockResolvedValueOnce([]);

      // Mock删除乘客
      db.query.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await passengerService.deletePassenger(userId, passengerId);

      expect(result.message).toBe('删除乘客成功');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining([passengerId])
      );
    });

    it('乘客不存在时应该抛出错误', async () => {
      const userId = 'user-123';
      const passengerId = 'invalid-passenger';

      db.query.mockResolvedValueOnce([]);

      await expect(passengerService.deletePassenger(userId, passengerId)).rejects.toThrow(
        '乘客不存在'
      );
    });

    it('乘客不属于当前用户时应该抛出错误', async () => {
      const userId = 'user-456';
      const passengerId = 'passenger-1';

      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123' // 不同的用户ID
        }
      ]);

      await expect(passengerService.deletePassenger(userId, passengerId)).rejects.toThrow(
        '无权删除此乘客'
      );
    });

    it('乘客有未完成的订单时应该抛出错误', async () => {
      const userId = 'user-123';
      const passengerId = 'passenger-1';

      // Mock检查乘客存在且属于当前用户
      db.query.mockResolvedValueOnce([
        {
          id: 'passenger-1',
          user_id: 'user-123'
        }
      ]);

      // Mock检查是否有未完成的订单（有未完成订单）
      db.query.mockResolvedValueOnce([
        { order_id: 'order-123', status: 'pending' }
      ]);

      await expect(passengerService.deletePassenger(userId, passengerId)).rejects.toThrow(
        '该乘客有未完成的订单，无法删除'
      );
    });
  });

  describe('maskIdNumber() - 证件号码脱敏', () => {
    it('应该对18位身份证号进行脱敏', () => {
      const idNumber = '330102199001011234';
      
      const masked = passengerService.maskIdNumber(idNumber);

      expect(masked).toBe('3301************34');
      expect(masked.length).toBe(18);
    });

    it('应该保留前4位和后2位', () => {
      const idNumber = '110101198501012345';
      
      const masked = passengerService.maskIdNumber(idNumber);

      expect(masked.substring(0, 4)).toBe('1101');
      expect(masked.substring(16, 18)).toBe('45');
    });

    it('应该将中间部分替换为12个星号', () => {
      const idNumber = '440101199101011234';
      
      const masked = passengerService.maskIdNumber(idNumber);

      const middlePart = masked.substring(4, 16);
      expect(middlePart).toBe('************');
    });

    it('非18位证件号应该返回原值或抛出错误', () => {
      const invalidIdNumber = '12345';
      
      const result = passengerService.maskIdNumber(invalidIdNumber);

      // 根据实现可能返回原值或抛出错误
      expect([invalidIdNumber, '12345']).toContain(result);
    });

    it('空值应该返回空字符串', () => {
      const result = passengerService.maskIdNumber('');

      expect(result).toBe('');
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该正确处理数据库连接错误', async () => {
      const userId = 'user-123';

      db.query.mockRejectedValueOnce(new Error('数据库连接失败'));

      await expect(passengerService.getUserPassengers(userId)).rejects.toThrow('数据库连接失败');
    });

    it('应该正确处理并发创建乘客请求', async () => {
      const userId = 'user-123';
      const passengerData = {
        name: '张三',
        idCardType: '居民身份证',
        idCardNumber: '110101199001011234',
        discountType: '成人票'
      };

      // Mock第一次检查证件号码唯一性（不存在）
      db.query.mockResolvedValueOnce([]);

      // Mock插入乘客（唯一性约束冲突）
      db.query.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      await expect(passengerService.createPassenger(userId, passengerData)).rejects.toThrow();
    });

    it('应该正确处理超长的姓名', async () => {
      const userId = 'user-123';
      const longNameData = {
        name: 'A'.repeat(100),
        idCardType: '居民身份证',
        idCardNumber: '110101199001011234',
        discountType: '成人票'
      };

      await expect(passengerService.createPassenger(userId, longNameData)).rejects.toThrow(
        '姓名长度不符合要求'
      );
    });

    it('应该正确处理特殊字符注入攻击', async () => {
      const userId = 'user-123';
      const maliciousData = {
        name: "'; DROP TABLE passengers; --",
        idCardType: '居民身份证',
        idCardNumber: '110101199001011234',
        discountType: '成人票'
      };

      // 使用参数化查询应该防止SQL注入
      db.query.mockResolvedValueOnce([]);
      db.query.mockResolvedValueOnce({ insertId: 1, affectedRows: 1 });

      const result = await passengerService.createPassenger(userId, maliciousData);

      // 应该成功创建（参数化查询防止注入）
      expect(result.passengerId).toBeDefined();
    });

    it('应该正确处理大量乘客列表', async () => {
      const userId = 'user-123';

      // Mock返回100个乘客
      const manyPassengers = Array(100).fill(null).map((_, i) => ({
        id: `passenger-${i}`,
        name: `乘客${i}`,
        id_card_number: `11010119900101${String(i).padStart(4, '0')}`
      }));

      db.query.mockResolvedValueOnce(manyPassengers);

      const result = await passengerService.getUserPassengers(userId);

      expect(result).toHaveLength(100);
    });
  });
});


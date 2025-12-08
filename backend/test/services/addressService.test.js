const addressService = require('../../src/services/addressService');

// Mock database operations
jest.mock('../../src/database', () => ({
  query: jest.fn(),
  run: jest.fn(),
  queryOne: jest.fn()
}));

const db = require('../../src/database');
const crypto = require('crypto');

describe('AddressService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserAddresses() - 获取用户地址列表', () => {
    it('should return all addresses for a user', async () => {
      const userId = 'user-123';
      const mockAddresses = [
        {
          id: 'addr-1',
          recipient: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '海淀区',
          street: '街道',
          surrounding: '',
          detail_address: '详细地址1',
          is_default: 1
        },
        {
          id: 'addr-2',
          recipient: '李四',
          phone: '13900139000',
          province: '上海市',
          city: '上海市',
          district: '浦东新区',
          street: '街道2',
          surrounding: '',
          detail_address: '详细地址2',
          is_default: 0
        }
      ];

      db.query.mockResolvedValue(mockAddresses);

      const result = await addressService.getUserAddresses(userId);

      expect(result).toHaveLength(2);
      expect(result[0].recipient).toBe('张三');
      expect(result[0].isDefault).toBe(true);
      expect(result[1].recipient).toBe('李四');
      expect(result[1].isDefault).toBe(false);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
        [userId]
      );
    });

    it('should return empty array if no addresses found', async () => {
      const userId = 'user-123';
      db.query.mockResolvedValue([]);

      const result = await addressService.getUserAddresses(userId);

      expect(result).toEqual([]);
    });
  });

  describe('addAddress() - 添加地址', () => {
    it('should add a new address', async () => {
      const userId = 'user-123';
      const addressData = {
        recipient: '王五',
        phone: '13700137000',
        province: '广东省',
        city: '广州市',
        district: '天河区',
        street: '街道3',
        surrounding: '周边',
        detailAddress: '详细地址3',
        isDefault: false
      };

      db.run.mockResolvedValue({ changes: 1 });

      const result = await addressService.addAddress(userId, addressData);

      expect(result).toMatchObject({
        userId,
        ...addressData
      });
      expect(result.id).toBeDefined();
      expect(db.run).toHaveBeenCalledTimes(1);
    });

    it('should unset other default addresses if new address is default', async () => {
      const userId = 'user-123';
      const addressData = {
        recipient: '赵六',
        phone: '13600136000',
        province: '浙江省',
        city: '杭州市',
        district: '西湖区',
        street: '街道4',
        surrounding: '',
        detailAddress: '详细地址4',
        isDefault: true
      };

      db.run.mockResolvedValue({ changes: 1 });

      await addressService.addAddress(userId, addressData);

      expect(db.run).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenNthCalledWith(1, 
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    });
  });

  describe('deleteAddress() - 删除地址', () => {
    it('should delete an address', async () => {
      const userId = 'user-123';
      const addressId = 'addr-1';

      db.run.mockResolvedValue({ changes: 1 });

      const result = await addressService.deleteAddress(userId, addressId);

      expect(result).toBe(true);
      expect(db.run).toHaveBeenCalledWith(
        'DELETE FROM addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );
    });

    it('should return false if address not found', async () => {
      const userId = 'user-123';
      const addressId = 'addr-not-found';

      db.run.mockResolvedValue({ changes: 0 });

      const result = await addressService.deleteAddress(userId, addressId);

      expect(result).toBe(false);
    });
  });
});

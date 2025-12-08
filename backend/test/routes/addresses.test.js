const request = require('supertest');
const express = require('express');
const addressesRouter = require('../../src/routes/addresses');

// Mock services
jest.mock('../../src/services/addressService');
const addressService = require('../../src/services/addressService');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware - must come before routes
app.use((req, res, next) => {
  req.user = { id: 'user-123', username: 'testuser' };
  next();
});

app.use('/api/addresses', addressesRouter);

describe('Addresses API Routes Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/addresses - 获取地址列表', () => {
    it('should return user addresses', async () => {
      const mockAddresses = [
        {
          id: 'addr-1',
          recipient: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '海淀区',
          street: '街道',
          detailAddress: '详细地址1',
          isDefault: true
        }
      ];

      addressService.getUserAddresses.mockResolvedValue(mockAddresses);

      const response = await request(app).get('/api/addresses');

      expect(response.status).toBe(200);
      expect(response.body.addresses).toEqual(mockAddresses);
      expect(addressService.getUserAddresses).toHaveBeenCalledWith('user-123');
    });

    it('should handle errors', async () => {
      addressService.getUserAddresses.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/addresses');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('DB Error');
    });
  });

  describe('POST /api/addresses - 添加地址', () => {
    it('should add a new address', async () => {
      const newAddress = {
        recipient: '王五',
        phone: '13700137000',
        province: '广东省',
        city: '广州市',
        district: '天河区',
        street: '街道3',
        detailAddress: '详细地址3',
        isDefault: false
      };

      const createdAddress = { id: 'new-id', userId: 'user-123', ...newAddress };
      addressService.addAddress.mockResolvedValue(createdAddress);

      const response = await request(app)
        .post('/api/addresses')
        .send(newAddress);

      expect(response.status).toBe(201);
      expect(response.body.address).toEqual(createdAddress);
      expect(addressService.addAddress).toHaveBeenCalledWith('user-123', newAddress);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/addresses')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请填写所有必填项');
    });
  });

  describe('DELETE /api/addresses/:addressId - 删除地址', () => {
    it('should delete an address', async () => {
      addressService.deleteAddress.mockResolvedValue(true);

      const response = await request(app).delete('/api/addresses/addr-1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('删除成功');
      expect(addressService.deleteAddress).toHaveBeenCalledWith('user-123', 'addr-1');
    });

    it('should return 404 if address not found', async () => {
      addressService.deleteAddress.mockResolvedValue(false);

      const response = await request(app).delete('/api/addresses/addr-not-found');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('地址不存在或无权删除');
    });
  });
});

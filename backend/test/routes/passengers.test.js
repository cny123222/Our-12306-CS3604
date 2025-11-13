const request = require('supertest');
const express = require('express');
const passengersRouter = require('../../src/routes/passengers');

// Mock services
jest.mock('../../src/services/passengerService');
const passengerService = require('../../src/services/passengerService');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware - must come before routes
app.use((req, res, next) => {
  req.user = { id: 'user-123', username: 'testuser' };
  next();
});

app.use('/api/passengers', passengersRouter);

describe('Passengers API Routes Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/passengers - 获取用户乘客列表', () => {
    it('应该返回用户的所有乘客信息', async () => {
      const mockPassengers = [
        {
          id: 'passenger-1',
          name: '刘蕊蕊',
          idCardType: '居民身份证',
          idCardNumber: '3301************028',
          discountType: '成人票',
          points: 1200
        },
        {
          id: 'passenger-2',
          name: '王欣',
          idCardType: '居民身份证',
          idCardNumber: '1101************015',
          discountType: '成人票',
          points: 800
        }
      ];

      passengerService.getUserPassengers = jest.fn().mockResolvedValue(mockPassengers);

      const response = await request(app)
        .get('/api/passengers');

      expect(response.status).toBe(200);
      expect(response.body.passengers).toEqual(mockPassengers);
      expect(response.body.passengers).toHaveLength(2);
      expect(passengerService.getUserPassengers).toHaveBeenCalledWith('user-123');
    });

    it('应该返回证件号码部分脱敏的乘客信息', async () => {
      const mockPassengers = [
        {
          id: 'passenger-1',
          name: '刘蕊蕊',
          idCardType: '居民身份证',
          idCardNumber: '3301************028',
          points: 1200
        }
      ];

      passengerService.getUserPassengers = jest.fn().mockResolvedValue(mockPassengers);

      const response = await request(app)
        .get('/api/passengers');

      expect(response.status).toBe(200);
      expect(response.body.passengers[0].idCardNumber).toMatch(/\*{12}/);
      expect(response.body.passengers[0].idCardNumber).toBe('3301************028');
    });

    it('用户没有乘客时应该返回空数组', async () => {
      passengerService.getUserPassengers = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get('/api/passengers');

      expect(response.status).toBe(200);
      expect(response.body.passengers).toEqual([]);
    });

    it('未登录时应该返回401错误', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/passengers', passengersRouter);

      const response = await request(unauthApp)
        .get('/api/passengers');

      expect(response.status).toBe(401);
    });

    it('获取乘客列表失败时应该返回500错误', async () => {
      passengerService.getUserPassengers = jest.fn().mockRejectedValue({
        status: 500,
        message: '获取乘客列表失败'
      });

      const response = await request(app)
        .get('/api/passengers');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('获取乘客列表失败');
    });
  });

  describe('POST /api/passengers/search - 搜索乘客', () => {
    it('应该根据姓名关键词搜索匹配的乘客', async () => {
      const mockSearchResults = [
        {
          id: 'passenger-1',
          name: '刘蕊蕊',
          idCardType: '居民身份证',
          idCardNumber: '3301************028',
          points: 1200
        }
      ];

      passengerService.searchPassengers = jest.fn().mockResolvedValue(mockSearchResults);

      const response = await request(app)
        .post('/api/passengers/search')
        .send({ keyword: '刘蕊蕊' });

      expect(response.status).toBe(200);
      expect(response.body.passengers).toEqual(mockSearchResults);
      expect(passengerService.searchPassengers).toHaveBeenCalledWith('user-123', '刘蕊蕊');
    });

    it('应该支持模糊匹配', async () => {
      const mockSearchResults = [
        {
          id: 'passenger-1',
          name: '刘蕊蕊',
          idCardType: '居民身份证',
          idCardNumber: '3301************028'
        }
      ];

      passengerService.searchPassengers = jest.fn().mockResolvedValue(mockSearchResults);

      const response = await request(app)
        .post('/api/passengers/search')
        .send({ keyword: '刘' });

      expect(response.status).toBe(200);
      expect(response.body.passengers).toHaveLength(1);
      expect(response.body.passengers[0].name).toContain('刘');
    });

    it('搜索无结果时应该返回空数组', async () => {
      passengerService.searchPassengers = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .post('/api/passengers/search')
        .send({ keyword: '不存在的乘客' });

      expect(response.status).toBe(200);
      expect(response.body.passengers).toEqual([]);
    });

    it('未提供关键词时应该返回400错误', async () => {
      const response = await request(app)
        .post('/api/passengers/search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('未登录时应该返回401错误', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/passengers', passengersRouter);

      const response = await request(unauthApp)
        .post('/api/passengers/search')
        .send({ keyword: '刘蕊蕊' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/passengers - 添加乘客', () => {
    const validPassengerData = {
      name: '张三',
      idCardType: '居民身份证',
      idCardNumber: '110101199001011234',
      discountType: '成人票'
    };

    it('应该成功添加乘客', async () => {
      const mockResult = {
        message: '添加乘客成功',
        passengerId: 'passenger-new'
      };

      passengerService.createPassenger = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/passengers')
        .send(validPassengerData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResult);
      expect(passengerService.createPassenger).toHaveBeenCalledWith('user-123', validPassengerData);
    });

    it('缺少必填字段时应该返回400错误', async () => {
      const invalidData = {
        name: '张三'
        // 缺少其他必填字段
      };

      const response = await request(app)
        .post('/api/passengers')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('参数错误');
    });

    it('证件号码格式错误时应该返回400错误', async () => {
      const invalidData = {
        ...validPassengerData,
        idCardNumber: 'invalid'
      };

      passengerService.createPassenger = jest.fn().mockRejectedValue({
        status: 400,
        message: '证件号码格式错误'
      });

      const response = await request(app)
        .post('/api/passengers')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('证件号码格式错误');
    });

    it('证件号码已存在时应该返回409错误', async () => {
      passengerService.createPassenger = jest.fn().mockRejectedValue({
        status: 409,
        message: '该乘客已存在'
      });

      const response = await request(app)
        .post('/api/passengers')
        .send(validPassengerData);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('该乘客已存在');
    });

    it('应该验证乘客信息的完整性', async () => {
      const response = await request(app)
        .post('/api/passengers')
        .send({
          name: '',
          idCardType: '',
          idCardNumber: '',
          discountType: ''
        });

      expect(response.status).toBe(400);
    });

    it('应该验证姓名长度在3-30个字符之间', async () => {
      const shortName = {
        ...validPassengerData,
        name: '李'
      };

      passengerService.createPassenger = jest.fn().mockRejectedValue({
        status: 400,
        message: '姓名长度不符合要求'
      });

      const response = await request(app)
        .post('/api/passengers')
        .send(shortName);

      expect(response.status).toBe(400);
    });

    it('未登录时应该返回401错误', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/passengers', passengersRouter);

      const response = await request(unauthApp)
        .post('/api/passengers')
        .send(validPassengerData);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/passengers/:passengerId - 更新乘客信息', () => {
    const updateData = {
      name: '张三',
      idCardType: '居民身份证',
      idCardNumber: '110101199001011234',
      discountType: '成人票'
    };

    it('应该成功更新乘客信息', async () => {
      const mockResult = {
        message: '更新乘客信息成功',
        passengerId: 'passenger-1'
      };

      passengerService.updatePassenger = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .put('/api/passengers/passenger-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(passengerService.updatePassenger).toHaveBeenCalledWith(
        'user-123',
        'passenger-1',
        updateData
      );
    });

    it('乘客不存在时应该返回404错误', async () => {
      passengerService.updatePassenger = jest.fn().mockRejectedValue({
        status: 404,
        message: '乘客不存在'
      });

      const response = await request(app)
        .put('/api/passengers/invalid-passenger')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('乘客不存在');
    });

    it('乘客不属于当前用户时应该返回403错误', async () => {
      passengerService.updatePassenger = jest.fn().mockRejectedValue({
        status: 403,
        message: '无权修改此乘客信息'
      });

      const response = await request(app)
        .put('/api/passengers/passenger-1')
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权修改此乘客信息');
    });

    it('更新数据格式错误时应该返回400错误', async () => {
      const invalidData = {
        name: '',
        idCardNumber: 'invalid'
      };

      passengerService.updatePassenger = jest.fn().mockRejectedValue({
        status: 400,
        message: '更新数据格式错误'
      });

      const response = await request(app)
        .put('/api/passengers/passenger-1')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('未登录时应该返回401错误', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/passengers', passengersRouter);

      const response = await request(unauthApp)
        .put('/api/passengers/passenger-1')
        .send(updateData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/passengers/:passengerId - 删除乘客', () => {
    it('应该成功删除乘客', async () => {
      const mockResult = {
        message: '删除乘客成功'
      };

      passengerService.deletePassenger = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .delete('/api/passengers/passenger-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(passengerService.deletePassenger).toHaveBeenCalledWith('user-123', 'passenger-1');
    });

    it('乘客不存在时应该返回404错误', async () => {
      passengerService.deletePassenger = jest.fn().mockRejectedValue({
        status: 404,
        message: '乘客不存在'
      });

      const response = await request(app)
        .delete('/api/passengers/invalid-passenger');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('乘客不存在');
    });

    it('乘客不属于当前用户时应该返回403错误', async () => {
      passengerService.deletePassenger = jest.fn().mockRejectedValue({
        status: 403,
        message: '无权删除此乘客'
      });

      const response = await request(app)
        .delete('/api/passengers/passenger-1');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权删除此乘客');
    });

    it('乘客有未完成的订单时应该返回400错误', async () => {
      passengerService.deletePassenger = jest.fn().mockRejectedValue({
        status: 400,
        message: '该乘客有未完成的订单，无法删除'
      });

      const response = await request(app)
        .delete('/api/passengers/passenger-1');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('该乘客有未完成的订单，无法删除');
    });

    it('未登录时应该返回401错误', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/passengers', passengersRouter);

      const response = await request(unauthApp)
        .delete('/api/passengers/passenger-1');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/passengers/:passengerId - 获取乘客详细信息', () => {
    it('应该返回指定乘客的详细信息', async () => {
      const mockPassenger = {
        id: 'passenger-1',
        name: '刘蕊蕊',
        idCardType: '居民身份证',
        idCardNumber: '3301************028',
        discountType: '成人票',
        points: 1200
      };

      passengerService.getPassengerDetails = jest.fn().mockResolvedValue(mockPassenger);

      const response = await request(app)
        .get('/api/passengers/passenger-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPassenger);
      expect(passengerService.getPassengerDetails).toHaveBeenCalledWith('user-123', 'passenger-1');
    });

    it('乘客不存在时应该返回404错误', async () => {
      passengerService.getPassengerDetails = jest.fn().mockRejectedValue({
        status: 404,
        message: '乘客不存在'
      });

      const response = await request(app)
        .get('/api/passengers/invalid-passenger');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('乘客不存在');
    });

    it('乘客不属于当前用户时应该返回403错误', async () => {
      passengerService.getPassengerDetails = jest.fn().mockRejectedValue({
        status: 403,
        message: '无权访问此乘客信息'
      });

      const response = await request(app)
        .get('/api/passengers/passenger-1');

      expect(response.status).toBe(403);
    });
  });

  describe('边界情况和错误处理', () => {
    it('所有接口都应该验证用户登录状态', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/passengers', passengersRouter);

      const responses = await Promise.all([
        request(unauthApp).get('/api/passengers'),
        request(unauthApp).post('/api/passengers/search').send({ keyword: 'test' }),
        request(unauthApp).post('/api/passengers').send({}),
        request(unauthApp).put('/api/passengers/passenger-1').send({}),
        request(unauthApp).delete('/api/passengers/passenger-1'),
        request(unauthApp).get('/api/passengers/passenger-1')
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });

    it('应该正确处理数据库连接错误', async () => {
      passengerService.getUserPassengers = jest.fn().mockRejectedValue({
        status: 500,
        message: '数据库连接失败'
      });

      const response = await request(app)
        .get('/api/passengers');

      expect(response.status).toBe(500);
    });

    it('应该正确处理无效的乘客ID格式', async () => {
      passengerService.getPassengerDetails = jest.fn().mockRejectedValue({
        status: 400,
        message: '无效的乘客ID格式'
      });

      const response = await request(app)
        .get('/api/passengers/<script>alert("xss")</script>');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该正确处理特殊字符的姓名', async () => {
      const specialNameData = {
        name: "O'Brien·李",
        idCardType: '居民身份证',
        idCardNumber: '110101199001011234',
        discountType: '成人票'
      };

      passengerService.createPassenger = jest.fn().mockResolvedValue({
        message: '添加乘客成功',
        passengerId: 'passenger-new'
      });

      const response = await request(app)
        .post('/api/passengers')
        .send(specialNameData);

      expect([200, 201, 400]).toContain(response.status);
    });

    it('应该正确处理过长的搜索关键词', async () => {
      const longKeyword = 'a'.repeat(1000);

      passengerService.searchPassengers = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .post('/api/passengers/search')
        .send({ keyword: longKeyword });

      // 应该返回错误或正常处理
      expect([200, 400]).toContain(response.status);
    });

    it('应该验证证件号码的唯一性（同一用户不能添加重复证件号）', async () => {
      const duplicateIdData = {
        name: '张三',
        idCardType: '居民身份证',
        idCardNumber: '3301************028', // 已存在的证件号
        discountType: '成人票'
      };

      passengerService.createPassenger = jest.fn().mockRejectedValue({
        status: 409,
        message: '该乘客已存在'
      });

      const response = await request(app)
        .post('/api/passengers')
        .send(duplicateIdData);

      expect(response.status).toBe(409);
    });
  });

  describe('乘客积分功能', () => {
    it('获取乘客详情时应该包含积分信息', async () => {
      const mockPassenger = {
        id: 'passenger-1',
        name: '刘蕊蕊',
        idCardType: '居民身份证',
        idCardNumber: '3301************028',
        discountType: '成人票',
        points: 1200
      };

      passengerService.getPassengerDetails = jest.fn().mockResolvedValue(mockPassenger);

      const response = await request(app)
        .get('/api/passengers/passenger-1');

      expect(response.status).toBe(200);
      expect(response.body.points).toBe(1200);
    });

    it('新添加的乘客积分应该初始化为0', async () => {
      const newPassengerData = {
        name: '张三',
        idCardType: '居民身份证',
        idCardNumber: '110101199001011234',
        discountType: '成人票'
      };

      passengerService.createPassenger = jest.fn().mockResolvedValue({
        message: '添加乘客成功',
        passengerId: 'passenger-new',
        points: 0
      });

      const response = await request(app)
        .post('/api/passengers')
        .send(newPassengerData);

      expect(response.status).toBe(201);
      expect(response.body.points).toBe(0);
    });
  });
});


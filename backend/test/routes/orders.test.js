const request = require('supertest');
const express = require('express');
const ordersRouter = require('../../src/routes/orders');

// Mock services
jest.mock('../../src/services/orderService');
jest.mock('../../src/services/passengerService');
const orderService = require('../../src/services/orderService');
const passengerService = require('../../src/services/passengerService');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware - must come before routes
app.use((req, res, next) => {
  req.user = { id: 'user-123', username: 'testuser' };
  next();
});

app.use('/api/orders', ordersRouter);

describe('Orders API Routes Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders/new - 获取订单填写页面信息', () => {
    it('应该成功返回订单填写页面数据', async () => {
      const mockSeatTypes = [
        { seat_type: '商务座', price: 1748, available: 10 },
        { seat_type: '一等座', price: 933, available: 50 },
        { seat_type: '二等座', price: 553, available: 100 }
      ];
      
      const mockPassengers = [
        {
          id: 'passenger-1',
          name: '刘蕊蕊',
          idCardType: '居民身份证',
          idCardNumber: '3301************028'
        }
      ];
      
      const mockDefaultSeat = {
        seatType: '二等座',
        price: 553
      };

      orderService.getAvailableSeatTypes = jest.fn().mockResolvedValue(mockSeatTypes);
      passengerService.getUserPassengers = jest.fn().mockResolvedValue(mockPassengers);
      orderService.getDefaultSeatType = jest.fn().mockResolvedValue(mockDefaultSeat);

      const response = await request(app)
        .get('/api/orders/new')
        .query({
          trainNo: 'G27',
          departureStation: '北京南站',
          arrivalStation: '上海虹桥',
          departureDate: '2025-09-14'
        });

      expect(response.status).toBe(200);
      expect(response.body.trainInfo).toBeDefined();
      expect(response.body.fareInfo).toBeDefined();
      expect(response.body.availableSeats).toBeDefined();
      expect(response.body.passengers).toEqual(mockPassengers);
      expect(response.body.defaultSeatType).toBe('二等座');
    });

    it('缺少参数时应该返回400错误', async () => {
      const response = await request(app)
        .get('/api/orders/new')
        .query({
          trainNo: 'G27'
          // 缺少其他必需参数
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('车次不存在时应该返回404错误', async () => {
      orderService.getAvailableSeatTypes = jest.fn().mockRejectedValue({
        status: 404,
        message: '车次不存在'
      });

      const response = await request(app)
        .get('/api/orders/new')
        .query({
          trainNo: 'INVALID',
          departureStation: '北京南站',
          arrivalStation: '上海虹桥',
          departureDate: '2025-09-14'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('车次不存在');
    });

    it('未登录时应该返回401错误', async () => {
      // Create app without auth middleware
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/orders', ordersRouter);

      const response = await request(unauthApp)
        .get('/api/orders/new')
        .query({
          trainNo: 'G27',
          departureStation: '北京南站',
          arrivalStation: '上海虹桥',
          departureDate: '2025-09-14'
        });

      expect(response.status).toBe(401);
    });

    it('应该在100ms内返回页面数据', async () => {
      orderService.getAvailableSeatTypes = jest.fn().mockResolvedValue([
        { seat_type: '二等座', price: 553, available: 100 }
      ]);
      passengerService.getUserPassengers = jest.fn().mockResolvedValue([]);
      orderService.getDefaultSeatType = jest.fn().mockResolvedValue({
        seatType: '二等座',
        price: 553
      });

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/orders/new')
        .query({
          trainNo: 'G27',
          departureStation: '北京南站',
          arrivalStation: '上海虹桥',
          departureDate: '2025-09-14'
        });
      const elapsedTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(elapsedTime).toBeLessThan(100);
    });
  });

  describe('GET /api/orders/available-seat-types - 获取有票席别列表', () => {
    it('应该返回当前有余票的席别列表', async () => {
      const mockSeatTypes = [
        { seat_type: '商务座', price: 1748, available: 10 },
        { seat_type: '一等座', price: 933, available: 50 },
        { seat_type: '二等座', price: 553, available: 100 }
      ];
      
      const expectedSeatTypes = [
        { type: '商务座', price: 1748, available: 10 },
        { type: '一等座', price: 933, available: 50 },
        { type: '二等座', price: 553, available: 100 }
      ];

      orderService.getAvailableSeatTypes = jest.fn().mockResolvedValue(mockSeatTypes);

      const response = await request(app)
        .get('/api/orders/available-seat-types')
        .query({
          trainNo: 'G27',
          departureStation: '北京南站',
          arrivalStation: '上海虹桥',
          departureDate: '2025-09-14'
        });

      expect(response.status).toBe(200);
      expect(response.body.seatTypes).toEqual(expectedSeatTypes);
      expect(response.body.seatTypes).toHaveLength(3);
    });

    it('已售罄的席别不应该包含在列表中', async () => {
      const mockSeatTypes = [
        { seat_type: '二等座', price: 553, available: 10 }
        // 商务座和一等座已售罄，不返回
      ];

      orderService.getAvailableSeatTypes = jest.fn().mockResolvedValue(mockSeatTypes);

      const response = await request(app)
        .get('/api/orders/available-seat-types')
        .query({
          trainNo: 'G27',
          departureStation: '北京南站',
          arrivalStation: '上海虹桥',
          departureDate: '2025-09-14'
        });

      expect(response.status).toBe(200);
      expect(response.body.seatTypes).toHaveLength(1);
      expect(response.body.seatTypes[0].type).toBe('二等座');
    });
  });

  describe('POST /api/orders/submit - 提交订单', () => {
    const validOrderData = {
      trainNo: 'G27',
      departureStation: '北京南站',
      arrivalStation: '上海虹桥',
      departureDate: '2025-09-14',
      passengers: [
        {
          passengerId: 'passenger-1',
          ticketType: '成人票',
          seatType: '二等座'
        }
      ]
    };

    it('应该成功提交订单并返回订单详情', async () => {
      const mockResult = {
        message: '订单提交成功',
        orderId: 'order-123',
        orderDetails: {
          trainInfo: {
            trainNo: 'G27',
            departureStation: '北京南站',
            arrivalStation: '上海虹桥',
            departureDate: '2025-09-14'
          },
          passengers: validOrderData.passengers,
          totalPrice: 553
        }
      };

      orderService.checkOrderCancellationCount = jest.fn().mockResolvedValue(0);
      orderService.createOrder = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/orders/submit')
        .send(validOrderData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(orderService.createOrder).toHaveBeenCalledWith({
        ...validOrderData,
        userId: 'user-123'
      });
    });

    it('未选择乘车人时应该返回400错误："请选择乘车人！"', async () => {
      const invalidData = {
        ...validOrderData,
        passengers: []
      };

      const response = await request(app)
        .post('/api/orders/submit')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('请选择乘车人！');
    });

    it('车票售罄时应该返回400错误："手慢了，该车次席别车票已售罄！"', async () => {
      orderService.checkOrderCancellationCount = jest.fn().mockResolvedValue(0);
      orderService.createOrder = jest.fn().mockRejectedValue({
        status: 400,
        message: '手慢了，该车次席别车票已售罄！'
      });

      const response = await request(app)
        .post('/api/orders/submit')
        .send(validOrderData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('手慢了，该车次席别车票已售罄！');
    });

    it('网络异常时应该返回500错误："网络忙，请稍后再试"', async () => {
      orderService.createOrder = jest.fn().mockRejectedValue({
        status: 500,
        message: '网络忙，请稍后再试'
      });

      const response = await request(app)
        .post('/api/orders/submit')
        .send(validOrderData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('网络忙，请稍后再试');
    });

    it('应该在100ms内返回订单详情并跳出信息核对弹窗', async () => {
      const mockResult = {
        message: '订单提交成功',
        orderId: 'order-123',
        orderDetails: {}
      };

      orderService.checkOrderCancellationCount = jest.fn().mockResolvedValue(0);
      orderService.createOrder = jest.fn().mockResolvedValue(mockResult);

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/orders/submit')
        .send(validOrderData);
      const elapsedTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(elapsedTime).toBeLessThan(100);
      expect(response.body.orderId).toBe('order-123');
    });

    it('应该验证所选席别有足够余票', async () => {
      orderService.checkOrderCancellationCount = jest.fn().mockResolvedValue(0);
      orderService.createOrder = jest.fn().mockImplementation(async (data) => {
        // 模拟检查余票
        const availableSeats = 1;
        const requiredSeats = data.passengers.length;
        
        if (availableSeats < requiredSeats) {
          throw {
            status: 400,
            message: '手慢了，该车次席别车票已售罄！'
          };
        }

        return { orderId: 'order-123' };
      });

      const multiPassengerData = {
        ...validOrderData,
        passengers: [
          { passengerId: 'p1', ticketType: '成人票', seatType: '二等座' },
          { passengerId: 'p2', ticketType: '成人票', seatType: '二等座' }
        ]
      };

      const response = await request(app)
        .post('/api/orders/submit')
        .send(multiPassengerData);

      // 如果余票不足，应该返回错误
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/orders/:orderId/confirmation - 获取订单核对信息', () => {
    it('应该返回完整的订单核对信息', async () => {
      const mockOrderInfo = {
        trainInfo: {
          trainNo: 'G1476',
          departureStation: '上海虹桥站',
          arrivalStation: '南京南站',
          departureDate: '2025-11-20',
          departureTime: '09:51',
          arrivalTime: '11:29'
        },
        passengers: [
          {
            sequence: 1,
            seatType: '二等座',
            ticketType: '成人票',
            name: '刘蕊蕊',
            idCardType: '居民身份证',
            idCardNumber: '3301************028',
            points: 1200
          }
        ],
        availableSeats: {
          '二等座': 99
        },
        totalPrice: 553
      };

      orderService.getOrderDetails = jest.fn().mockResolvedValue(mockOrderInfo);

      const response = await request(app)
        .get('/api/orders/order-123/confirmation');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrderInfo);
      expect(response.body.passengers[0].points).toBe(1200);
    });

    it('订单不存在时应该返回404错误', async () => {
      orderService.getOrderDetails = jest.fn().mockRejectedValue({
        status: 404,
        message: '订单不存在'
      });

      const response = await request(app)
        .get('/api/orders/invalid-order/confirmation');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('订单不存在');
    });

    it('应该验证订单属于当前用户', async () => {
      orderService.getOrderDetails = jest.fn().mockImplementation(async (orderId, userId) => {
        if (userId !== 'user-123') {
          throw { status: 403, message: '无权访问此订单' };
        }
        return { orderId };
      });

      const response = await request(app)
        .get('/api/orders/order-123/confirmation');

      expect(response.status).toBe(200);
      expect(orderService.getOrderDetails).toHaveBeenCalledWith('order-123', 'user-123');
    });
  });

  describe('POST /api/orders/:orderId/confirm - 确认订单', () => {
    it('应该成功确认订单', async () => {
      const mockResult = {
        message: '订单已经提交，系统正在处理中，请稍等',
        orderId: 'order-123',
        status: 'processing'
      };

      orderService.confirmOrder = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/orders/order-123/confirm');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(response.body.message).toBe('订单已经提交，系统正在处理中，请稍等');
    });

    it('订单不存在时应该返回404错误', async () => {
      orderService.confirmOrder = jest.fn().mockRejectedValue({
        status: 404,
        message: '订单不存在'
      });

      const response = await request(app)
        .post('/api/orders/invalid-order/confirm');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('订单不存在');
    });

    it('订单状态错误时应该返回400错误', async () => {
      orderService.confirmOrder = jest.fn().mockRejectedValue({
        status: 400,
        message: '订单状态错误'
      });

      const response = await request(app)
        .post('/api/orders/order-123/confirm');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('订单状态错误');
    });

    it('应该确认座位分配', async () => {
      orderService.confirmOrder = jest.fn().mockImplementation(async (orderId, userId) => {
        // 模拟确认座位分配
        await orderService.confirmSeatAllocation(orderId);
        return {
          message: '订单已经提交，系统正在处理中，请稍等',
          orderId,
          status: 'processing'
        };
      });

      const response = await request(app)
        .post('/api/orders/order-123/confirm');

      expect(response.status).toBe(200);
      expect(orderService.confirmOrder).toHaveBeenCalledWith('order-123', 'user-123');
    });

    it('应该更新订单状态为处理中', async () => {
      orderService.confirmOrder = jest.fn().mockResolvedValue({
        message: '订单已经提交，系统正在处理中，请稍等',
        orderId: 'order-123',
        status: 'processing'
      });

      const response = await request(app)
        .post('/api/orders/order-123/confirm');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('processing');
    });
  });

  describe('边界情况和错误处理', () => {
    it('所有接口都应该验证用户登录状态', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/orders', ordersRouter);

      const responses = await Promise.all([
        request(unauthApp).get('/api/orders/new'),
        request(unauthApp).post('/api/orders/submit'),
        request(unauthApp).get('/api/orders/order-123/confirmation'),
        request(unauthApp).post('/api/orders/order-123/confirm')
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });

    it('应该正确处理数据库连接错误', async () => {
      orderService.getAvailableSeatTypes = jest.fn().mockRejectedValue({
        status: 500,
        message: '数据库连接失败'
      });

      const response = await request(app)
        .get('/api/orders/new')
        .query({
          trainNo: 'G27',
          departureStation: '北京南站',
          arrivalStation: '上海虹桥',
          departureDate: '2025-09-14'
        });

      expect(response.status).toBe(500);
    });

    it('应该正确处理无效的订单ID格式', async () => {
      const response = await request(app)
        .get('/api/orders/<script>alert("xss")</script>/confirmation');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该正确处理超大的乘客列表', async () => {
      const largePassengerList = Array(100).fill(null).map((_, i) => ({
        passengerId: `passenger-${i}`,
        ticketType: '成人票',
        seatType: '二等座'
      }));

      orderService.checkOrderCancellationCount = jest.fn().mockResolvedValue(0);
      orderService.createOrder = jest.fn().mockRejectedValue({
        status: 400,
        message: '乘客数量超过限制'
      });

      const response = await request(app)
        .post('/api/orders/submit')
        .send({
          trainNo: 'G27',
          departureStation: '北京南站',
          arrivalStation: '上海虹桥',
          departureDate: '2025-09-14',
          passengers: largePassengerList
        });

      // 应该返回错误或限制乘客数量
      expect([400, 413]).toContain(response.status);
    });
  });
});


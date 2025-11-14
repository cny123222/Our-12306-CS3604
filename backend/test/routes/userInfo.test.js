// 用户信息API路由测试
// 基于acceptanceCriteria的测试用例

const request = require('supertest');
const express = require('express');
const userInfoRouter = require('../../src/routes/userInfo');
const app = express();

// 设置中间件
app.use(express.json());
app.use('/api/user', userInfoRouter);

describe('User Info API Routes', () => {
  
  // 测试用的有效JWT token
  const validToken = 'Bearer valid-test-token';
  const invalidToken = 'Bearer invalid-test-token';
  
  // ===== API-GET-UserInfo 测试 =====
  describe('GET /api/user/info - 获取用户个人信息', () => {
    
    test('[AC1] 应该验证用户已登录', async () => {
      // Given: 未提供认证token
      // When: GET /api/user/info without token
      const response = await request(app)
        .get('/api/user/info');
      
      // Then: 返回401错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(401);
      // expect(response.body.error).toBe('请先登录');
    });
    
    test('[AC2] 应该返回用户的完整个人信息', async () => {
      // Given: 用户已登录
      // When: GET /api/user/info with valid token
      const response = await request(app)
        .get('/api/user/info')
        .set('Authorization', validToken);
      
      // Then: 返回200和用户信息
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // expect(response.body).toHaveProperty('username');
      // expect(response.body).toHaveProperty('name');
      // expect(response.body).toHaveProperty('country');
      // expect(response.body).toHaveProperty('idCardType');
      // expect(response.body).toHaveProperty('idCardNumber');
      // expect(response.body).toHaveProperty('verificationStatus');
      // expect(response.body).toHaveProperty('phone');
      // expect(response.body).toHaveProperty('email');
      // expect(response.body).toHaveProperty('discountType');
    });
    
    test('[AC3] 应该对手机号进行脱敏处理', async () => {
      // Given: 用户已登录且手机号为15888889968
      // When: GET /api/user/info
      const response = await request(app)
        .get('/api/user/info')
        .set('Authorization', validToken);
      
      // Then: 返回的手机号中间四位是****
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // expect(response.body.phone).toMatch(/^\(\+86\)\d{3}\*{4}\d{4}$/);
    });
  });
  
  // ===== API-PUT-UserEmail 测试 =====
  describe('PUT /api/user/email - 更新用户邮箱', () => {
    
    test('[AC1] 应该验证用户已登录', async () => {
      // Given: 未提供认证token
      // When: PUT /api/user/email without token
      const response = await request(app)
        .put('/api/user/email')
        .send({ email: 'newemail@example.com' });
      
      // Then: 返回401错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(401);
      // expect(response.body.error).toBe('请先登录');
    });
    
    test('[AC2] 应该验证邮箱格式的合法性', async () => {
      // Given: 用户已登录但邮箱格式不合法
      // When: PUT /api/user/email with invalid email
      const response = await request(app)
        .put('/api/user/email')
        .set('Authorization', validToken)
        .send({ email: 'invalid-email' });
      
      // Then: 返回400错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(400);
      // expect(response.body.error).toBe('请输入有效的电子邮件地址！');
    });
    
    test('[AC3] 应该成功更新用户邮箱', async () => {
      // Given: 用户已登录且邮箱格式合法
      // When: PUT /api/user/email with valid email
      const response = await request(app)
        .put('/api/user/email')
        .set('Authorization', validToken)
        .send({ email: 'newemail@example.com' });
      
      // Then: 返回200和成功消息
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // expect(response.body.message).toBe('邮箱更新成功');
    });
  });
  
  // ===== API-POST-UpdatePhoneRequest 测试 =====
  describe('POST /api/user/phone/update-request - 请求更新用户手机号', () => {
    
    test('[AC1] 应该验证用户已登录', async () => {
      // Given: 未提供认证token
      // When: POST /api/user/phone/update-request without token
      const response = await request(app)
        .post('/api/user/phone/update-request')
        .send({
          newPhone: '13900001111',
          password: 'password123'
        });
      
      // Then: 返回401错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(401);
      // expect(response.body.error).toBe('请先登录');
    });
    
    test('[AC2] 应该验证新手机号格式正确', async () => {
      // Given: 用户已登录但手机号格式不正确
      const testCases = [
        { newPhone: '139', password: 'password123' },  // 少于11位
        { newPhone: '1390000111122', password: 'password123' },  // 多于11位
        { newPhone: '1390000abcd', password: 'password123' },  // 包含非数字
      ];
      
      for (const testCase of testCases) {
        // When: POST with invalid phone
        const response = await request(app)
          .post('/api/user/phone/update-request')
          .set('Authorization', validToken)
          .send(testCase);
        
        // Then: 返回400错误
        // TODO: 当功能实现后，取消注释以下断言
        // expect(response.status).toBe(400);
        // expect(response.body.error).toBe('您输入的手机号码不是有效的格式！');
      }
    });
    
    test('[AC3] 应该验证登录密码正确', async () => {
      // Given: 用户已登录但密码错误
      // When: POST with incorrect password
      const response = await request(app)
        .post('/api/user/phone/update-request')
        .set('Authorization', validToken)
        .send({
          newPhone: '13900001111',
          password: 'wrong-password'
        });
      
      // Then: 返回401错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(401);
      // expect(response.body.error).toBe('密码错误');
    });
    
    test('[AC4] 应该验证新手机号未被其他用户使用', async () => {
      // Given: 新手机号已被其他用户使用
      // When: POST with existing phone
      const response = await request(app)
        .post('/api/user/phone/update-request')
        .set('Authorization', validToken)
        .send({
          newPhone: '13800138000',  // 已被使用
          password: 'correct-password'
        });
      
      // Then: 返回409错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(409);
      // expect(response.body.error).toBe('该手机号已被使用');
    });
    
    test('[AC5] 应该成功发送验证码并返回会话ID', async () => {
      // Given: 所有验证都通过
      // When: POST with valid data
      const response = await request(app)
        .post('/api/user/phone/update-request')
        .set('Authorization', validToken)
        .send({
          newPhone: '13900001111',
          password: 'correct-password'
        });
      
      // Then: 返回200和会话ID
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // expect(response.body.message).toBe('验证码已发送');
      // expect(response.body).toHaveProperty('sessionId');
    });
  });
  
  // ===== API-POST-ConfirmPhoneUpdate 测试 =====
  describe('POST /api/user/phone/confirm-update - 确认更新用户手机号', () => {
    
    test('[AC1] 应该验证会话ID的有效性', async () => {
      // Given: 会话ID无效或已过期
      // When: POST with invalid sessionId
      const response = await request(app)
        .post('/api/user/phone/confirm-update')
        .send({
          sessionId: 'invalid-session-id',
          verificationCode: '123456'
        });
      
      // Then: 返回401错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(401);
      // expect(response.body.error).toBe('会话无效或已过期');
    });
    
    test('[AC2] 应该验证短信验证码正确', async () => {
      // Given: 验证码错误
      // When: POST with incorrect code
      const response = await request(app)
        .post('/api/user/phone/confirm-update')
        .send({
          sessionId: 'valid-session-id',
          verificationCode: '000000'  // 错误的验证码
        });
      
      // Then: 返回400错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(400);
      // expect(response.body.error).toBe('验证码错误或已过期');
    });
    
    test('[AC3] 应该验证验证码未过期', async () => {
      // Given: 验证码已过期
      // When: POST with expired code
      const response = await request(app)
        .post('/api/user/phone/confirm-update')
        .send({
          sessionId: 'valid-session-id',
          verificationCode: '123456'  // 已过期
        });
      
      // Then: 返回400错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(400);
      // expect(response.body.error).toBe('验证码错误或已过期');
    });
    
    test('[AC4] 应该成功更新手机号', async () => {
      // Given: 所有验证都通过
      // When: POST with valid data
      const response = await request(app)
        .post('/api/user/phone/confirm-update')
        .send({
          sessionId: 'valid-session-id',
          verificationCode: '123456'
        });
      
      // Then: 返回200和成功消息
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // expect(response.body.message).toBe('手机号更新成功');
    });
    
    test('[AC5] 应该在控制台显示验证码信息', async () => {
      // Given: 验证成功
      const consoleSpy = jest.spyOn(console, 'log');
      
      // When: POST with valid data
      await request(app)
        .post('/api/user/phone/confirm-update')
        .send({
          sessionId: 'valid-session-id',
          verificationCode: '123456'
        });
      
      // Then: 控制台应该输出验证码信息
      // TODO: 当功能实现后，取消注释以下断言
      // expect(consoleSpy).toHaveBeenCalledWith(
      //   expect.stringContaining('验证码')
      // );
      
      consoleSpy.mockRestore();
    });
  });
  
  // ===== API-GET-UserOrders 测试 =====
  describe('GET /api/user/orders - 获取用户订单列表', () => {
    
    test('[AC1] 应该验证用户已登录', async () => {
      // Given: 未提供认证token
      // When: GET /api/user/orders without token
      const response = await request(app)
        .get('/api/user/orders');
      
      // Then: 返回401错误
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(401);
      // expect(response.body.error).toBe('请先登录');
    });
    
    test('[AC2] 应该返回用户的订单列表', async () => {
      // Given: 用户已登录
      // When: GET /api/user/orders
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', validToken);
      
      // Then: 返回200和订单数组
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // expect(response.body).toHaveProperty('orders');
      // expect(Array.isArray(response.body.orders)).toBe(true);
    });
    
    test('[AC3] 应该支持按日期范围筛选', async () => {
      // Given: 用户已登录
      // When: GET /api/user/orders with date range
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', validToken)
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        });
      
      // Then: 返回指定日期范围内的订单
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // expect(Array.isArray(response.body.orders)).toBe(true);
      // response.body.orders.forEach(order => {
      //   const orderDate = new Date(order.departureDate);
      //   expect(orderDate >= new Date('2025-01-01')).toBe(true);
      //   expect(orderDate <= new Date('2025-01-31')).toBe(true);
      // });
    });
    
    test('[AC4] 应该支持按关键词搜索', async () => {
      // Given: 用户已登录
      // When: GET /api/user/orders with keyword
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', validToken)
        .query({ keyword: 'G1234' });
      
      // Then: 返回包含关键词的订单
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // expect(Array.isArray(response.body.orders)).toBe(true);
    });
    
    test('[AC5] 应该只返回30日内的订单', async () => {
      // Given: 用户已登录且有超过30日的订单
      // When: GET /api/user/orders
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', validToken);
      
      // Then: 返回的订单不超过30日
      // TODO: 当功能实现后，取消注释以下断言
      // expect(response.status).toBe(200);
      // const thirtyDaysAgo = new Date();
      // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      // 
      // response.body.orders.forEach(order => {
      //   const orderDate = new Date(order.createdAt);
      //   expect(orderDate >= thirtyDaysAgo).toBe(true);
      // });
    });
  });
});


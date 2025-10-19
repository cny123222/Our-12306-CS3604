const request = require('supertest');
const app = require('../../src/app');

describe('User Routes', () => {
  describe('GET /api/user/profile', () => {
    it('should successfully get user profile with valid token', async () => {
      // 验收标准：使用有效token获取用户信息成功
      // 首先登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password',
          username: 'testuser',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('phone');
      expect(response.body.user).toHaveProperty('realName');
      expect(response.body.user).toHaveProperty('idCard');
      expect(response.body.user).toHaveProperty('userType');
      expect(response.body.user).toHaveProperty('status');
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).toHaveProperty('lastLoginTime');
    });

    it('should fail to get user profile without token', async () => {
      // 验收标准：未提供token时获取用户信息失败
      const response = await request(app)
        .get('/api/user/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '未提供认证令牌');
    });

    it('should fail to get user profile with invalid token', async () => {
      // 验收标准：使用无效token时获取用户信息失败
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '无效的认证令牌');
    });

    it('should fail to get user profile with expired token', async () => {
      // 验收标准：使用过期token时获取用户信息失败
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '认证令牌已过期');
    });

    it('should fail to get user profile for non-existent user', async () => {
      // 验收标准：用户不存在时获取用户信息失败
      // 这个测试需要一个有效的token但对应的用户已被删除的情况
      // 在实际测试中可能需要模拟这种情况
      
      // 创建一个token但用户不存在的情况
      const jwt = require('jsonwebtoken');
      const nonExistentUserToken = jwt.sign(
        { userId: 'nonexistent-user-id' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${nonExistentUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '用户不存在');
    });

    it('should not include sensitive information in user profile', async () => {
      // 验收标准：返回的用户信息不应包含敏感信息如密码
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          loginType: 'password',
          username: 'testuser',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should handle malformed Authorization header', async () => {
      // 验收标准：处理格式错误的Authorization头
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '无效的认证令牌格式');
    });

    it('should handle missing Bearer prefix in Authorization header', async () => {
      // 验收标准：处理缺少Bearer前缀的Authorization头
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'sometoken');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '无效的认证令牌格式');
    });
  });
});
const request = require('supertest');
const app = require('../../src/app');

describe('餐饮服务 API', () => {
  it('GET /api/food/categories 返回分类列表', async () => {
    const res = await request(app).get('/api/food/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('GET /api/food/items 返回指定分类商品', async () => {
    const res = await request(app).get('/api/food/items').query({ category: '主食' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0]).toHaveProperty('name');
    expect(res.body.items[0]).toHaveProperty('price');
  });

  it('POST /api/food/orders 缺少乘车信息返回400', async () => {
    const res = await request(app)
      .post('/api/food/orders')
      .send({ items: [{ id: 'meal-001', quantity: 1 }], delivery: { type: '到座' } });
    expect(res.status).toBe(400);
  });

  it('POST /api/food/orders 正常下单返回成功', async () => {
    const res = await request(app)
      .post('/api/food/orders')
      .send({
        items: [{ id: 'meal-001', quantity: 2 }],
        trainInfo: { trainNo: 'G123', carNumber: '3', seatNumber: '12A' },
        delivery: { type: '到座' },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('foodOrderId');
    expect(res.body.summary.totalPrice).toBeGreaterThan(0);
  });
});


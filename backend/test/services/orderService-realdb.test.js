const orderService = require('../../src/services/orderService');
const dbService = require('../../src/services/dbService');

describe('OrderService Tests (Real Database)', () => {
  let testUserId;
  
  beforeEach(async () => {
    testUserId = 'test-user-orders-' + Date.now();
    // 清理测试数据（忽略表不存在的错误）
    try {
      await dbService.run('DELETE FROM orders WHERE user_id LIKE ?', ['test-user-orders-%']);
    } catch (e) {}
    try {
      await dbService.run('DELETE FROM order_details WHERE order_id LIKE ?', ['test-order-%']);
    } catch (e) {}
  });

  afterEach(async () => {
    // 清理测试数据
    try {
      await dbService.run('DELETE FROM orders WHERE user_id = ?', [testUserId]);
    } catch (e) {}
    try {
      await dbService.run('DELETE FROM order_details WHERE order_id LIKE ?', ['test-order-%']);
    } catch (e) {}
  });

  describe('getDefaultSeatType() - 获取默认席别', () => {
    it('G字头车次应该返回"二等座"作为默认席别', async () => {
      const result = await orderService.getDefaultSeatType('G27');
      expect(result.seatType).toBe('二等座');
    });

    it('C字头车次应该返回"二等座"作为默认席别', async () => {
      const result = await orderService.getDefaultSeatType('C2001');
      expect(result.seatType).toBe('二等座');
    });

    it('D字头车次应该返回"二等座"作为默认席别', async () => {
      const result = await orderService.getDefaultSeatType('D3001');
      expect(result.seatType).toBe('二等座');
    });

    it('车次不存在时应该抛出错误', async () => {
      await expect(orderService.getDefaultSeatType('INVALID999')).rejects.toThrow();
    });
  });

  describe('calculateOrderTotalPrice() - 计算订单总价', () => {
    it('应该正确计算订单总价', async () => {
      const passengers = [
        { passengerId: 'p1', seatType: '二等座' },
        { passengerId: 'p2', seatType: '二等座' }
      ];
      
      const result = await orderService.calculateOrderTotalPrice(
        passengers,
        'G27',
        '北京南站',
        '上海虹桥'
      );
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBe(passengers.length * (result / passengers.length));
    });
  });
});


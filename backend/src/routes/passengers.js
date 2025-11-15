const express = require('express');
const router = express.Router();
const passengerService = require('../services/passengerService');
const { authenticateUser } = require('../middleware/auth');

/**
 * 获取用户乘客列表
 * GET /api/passengers
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    
    const userId = req.user.id;
    const passengers = await passengerService.getUserPassengers(userId);
    
    res.status(200).json({ passengers });
  } catch (error) {
    console.error('获取乘客列表失败:', error);
    const status = error.status || 500;
    const message = error.message || '获取乘客列表失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 搜索乘客
 * POST /api/passengers/search
 */
router.post('/search', authenticateUser, async (req, res) => {
  try {
    
    const { keyword } = req.body;
    
    // 验证关键词
    if (keyword === undefined || keyword === null) {
      return res.status(400).json({ error: '请提供搜索关键词' });
    }
    
    const userId = req.user.id;
    const passengers = await passengerService.searchPassengers(userId, keyword);
    
    res.status(200).json({ passengers });
  } catch (error) {
    console.error('搜索乘客失败:', error);
    const status = error.status || 500;
    const message = error.message || '搜索失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 添加乘客
 * POST /api/passengers
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    
    const { name, idCardType, idCardNumber, discountType, phone } = req.body;
    
    // 验证必填字段
    if (!name || !idCardType || !idCardNumber || !discountType) {
      return res.status(400).json({ error: '参数错误' });
    }
    
    const userId = req.user.id;
    const result = await passengerService.createPassenger(userId, {
      name,
      idCardType,
      idCardNumber,
      discountType,
      phone
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('添加乘客失败:', error);
    const status = error.status || 500;
    const message = error.message || '添加乘客失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 更新乘客信息
 * PUT /api/passengers/:passengerId
 */
router.put('/:passengerId', authenticateUser, async (req, res) => {
  try {
    
    const { passengerId } = req.params;
    const { name, idCardType, idCardNumber, discountType, phone } = req.body;
    
    const userId = req.user.id;
    const result = await passengerService.updatePassenger(userId, passengerId, {
      name,
      idCardType,
      idCardNumber,
      discountType,
      phone
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('更新乘客失败:', error);
    const status = error.status || 500;
    const message = error.message || '更新乘客失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 删除乘客
 * DELETE /api/passengers/:passengerId
 */
router.delete('/:passengerId', authenticateUser, async (req, res) => {
  try {
    
    const { passengerId } = req.params;
    const userId = req.user.id;
    
    console.log('=== 删除乘客路由 ===');
    console.log('req.user:', req.user);
    console.log('passengerId:', passengerId);
    console.log('userId 来自 req.user.id:', userId);
    
    const result = await passengerService.deletePassenger(userId, passengerId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('删除乘客失败:', error);
    console.error('错误堆栈:', error.stack);
    const status = error.status || 500;
    const message = error.message || '删除乘客失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 获取乘客详细信息
 * GET /api/passengers/:passengerId
 */
router.get('/:passengerId', authenticateUser, async (req, res) => {
  try {
    
    const { passengerId } = req.params;
    const userId = req.user.id;
    
    const passenger = await passengerService.getPassengerDetails(userId, passengerId);
    
    res.status(200).json(passenger);
  } catch (error) {
    console.error('获取乘客详情失败:', error);
    const status = error.status || 500;
    const message = error.message || '获取乘客详情失败';
    res.status(status).json({ error: message });
  }
});

module.exports = router;



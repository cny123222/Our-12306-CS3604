const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { authenticateUser } = require('../middleware/auth');

/**
 * 获取支付页面数据
 * GET /api/payment/:orderId
 */
router.get('/:orderId', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const paymentData = await orderService.getPaymentPageData(orderId, userId);
    
    // 计算剩余时间
    const timeRemaining = await orderService.getOrderTimeRemaining(orderId);
    
    res.status(200).json({
      ...paymentData,
      timeRemaining // 剩余秒数
    });
  } catch (error) {
    console.error('获取支付页面数据失败:', error);
    const status = error.status || 500;
    const message = error.message || '获取支付页面数据失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 确认支付
 * POST /api/payment/:orderId/confirm
 */
router.post('/:orderId/confirm', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const result = await orderService.confirmPayment(orderId, userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('确认支付失败:', error);
    const status = error.status || 500;
    const message = error.message || '支付失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 取消订单
 * POST /api/payment/:orderId/cancel
 */
router.post('/:orderId/cancel', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const result = await orderService.cancelOrderWithTracking(orderId, userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('取消订单失败:', error);
    const status = error.status || 500;
    const message = error.message || '取消订单失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 检查用户是否有未支付的订单
 * GET /api/payment/check-unpaid
 */
router.get('/check-unpaid', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const hasUnpaid = await orderService.hasUnpaidOrder(userId);
    
    res.status(200).json({ hasUnpaidOrder: hasUnpaid });
  } catch (error) {
    console.error('检查未支付订单失败:', error);
    const status = error.status || 500;
    const message = error.message || '检查失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 获取订单剩余支付时间
 * GET /api/payment/:orderId/time-remaining
 */
router.get('/:orderId/time-remaining', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    // 验证订单属于当前用户
    const paymentData = await orderService.getPaymentPageData(orderId, userId);
    
    const timeRemaining = await orderService.getOrderTimeRemaining(orderId);
    
    res.status(200).json({ timeRemaining });
  } catch (error) {
    console.error('获取剩余时间失败:', error);
    const status = error.status || 500;
    const message = error.message || '获取失败';
    res.status(status).json({ error: message });
  }
});

module.exports = router;


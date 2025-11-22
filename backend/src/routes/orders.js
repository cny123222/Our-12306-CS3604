const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const passengerService = require('../services/passengerService');
const { authenticateUser } = require('../middleware/auth');
const { checkUnpaidOrder } = require('../middleware/bookingRestriction');

/**
 * 获取订单填写页面信息
 * GET /api/orders/new
 */
router.get('/new', authenticateUser, checkUnpaidOrder, async (req, res) => {
  try {
    
    const { trainNo, departureStation, arrivalStation, departureDate } = req.query;
    
    // 验证必填参数
    if (!trainNo || !departureStation || !arrivalStation || !departureDate) {
      return res.status(400).json({ error: '参数错误' });
    }
    
    const userId = req.user.id;
    
    // 获取车次信息、票价、余票
    const availableSeatTypes = await orderService.getAvailableSeatTypes({
      trainNo,
      departureStation,
      arrivalStation,
      departureDate
    });
    
    // 获取用户乘客列表
    const passengers = await passengerService.getUserPassengers(userId);
    
    // 获取默认席别
    const defaultSeat = await orderService.getDefaultSeatType(trainNo);
    
    // 获取车次时间信息（使用 trainService）
    const trainService = require('../services/trainService');
    const trainDetails = await trainService.getTrainTimeDetails(trainNo, departureStation, arrivalStation);
    
    // 构建票价和余票信息
    const fareInfo = {};
    const availableSeats = {};
    availableSeatTypes.forEach(st => {
      fareInfo[st.seat_type] = {
        price: st.price,
        available: st.available
      };
      availableSeats[st.seat_type] = st.available;
    });
    
    res.status(200).json({
      trainInfo: {
        trainNo,
        departureStation,
        arrivalStation,
        departureDate,
        departureTime: trainDetails?.departureTime,
        arrivalTime: trainDetails?.arrivalTime
      },
      fareInfo,
      availableSeats,
      passengers,
      defaultSeatType: defaultSeat.seatType
    });
  } catch (error) {
    console.error('获取订单页面信息失败:', error);
    const status = error.status || 500;
    const message = error.message || '加载订单页失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 获取有票席别列表（公开API，不需要登录）
 * GET /api/orders/available-seat-types
 */
router.get('/available-seat-types', async (req, res) => {
  try {
    const { trainNo, departureStation, arrivalStation, departureDate } = req.query;
    
    // 验证必填参数
    if (!trainNo || !departureStation || !arrivalStation || !departureDate) {
      return res.status(400).json({ error: '参数错误' });
    }
    
    const seatTypes = await orderService.getAvailableSeatTypes({
      trainNo,
      departureStation,
      arrivalStation,
      departureDate
    });
    
    // 转换格式
    const formattedSeatTypes = seatTypes.map(st => ({
      type: st.seat_type,
      price: st.price,
      available: st.available
    }));
    
    res.status(200).json({ seatTypes: formattedSeatTypes });
  } catch (error) {
    console.error('获取席别信息失败:', error);
    const status = error.status || 500;
    const message = error.message || '获取席别信息失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 提交订单
 * POST /api/orders/submit
 */
router.post('/submit', authenticateUser, async (req, res) => {
  try {
    
    const { trainNo, departureStation, arrivalStation, departureDate, passengers } = req.body;
    
    // 验证至少选择一名乘客
    if (!passengers || passengers.length === 0) {
      return res.status(400).json({ error: '请选择乘车人！' });
    }
    
    const userId = req.user.id;
    
    // 创建订单
    const result = await orderService.createOrder({
      userId,
      trainNo,
      departureStation,
      arrivalStation,
      departureDate,
      passengers
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('提交订单失败:', error);
    const status = error.status || 500;
    const message = error.message || '网络忙，请稍后再试';
    res.status(status).json({ error: message });
  }
});

/**
 * 获取订单核对信息
 * GET /api/orders/:orderId/confirmation
 */
router.get('/:orderId/confirmation', authenticateUser, async (req, res) => {
  try{
    
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const orderDetails = await orderService.getOrderDetails(orderId, userId);
    
    res.status(200).json(orderDetails);
  } catch (error) {
    console.error('获取订单信息失败:', error);
    const status = error.status || 500;
    const message = error.message || '获取订单信息失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 确认订单
 * POST /api/orders/:orderId/confirm
 */
router.post('/:orderId/confirm', authenticateUser, async (req, res) => {
  try {
    
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const result = await orderService.confirmOrder(orderId, userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('确认订单失败:', error);
    const status = error.status || 500;
    const message = error.message || '确认订单失败';
    res.status(status).json({ error: message });
  }
});

module.exports = router;

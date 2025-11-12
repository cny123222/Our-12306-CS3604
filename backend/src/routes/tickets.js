const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticketService');
const trainService = require('../services/trainService');

/**
 * 预订车票
 * POST /api/tickets/reserve
 */
router.post('/reserve', async (req, res) => {
  try {
    const { 
      trainNo, 
      departureStation, 
      arrivalStation, 
      departureDate, 
      seatType, 
      passengerId,
      queryTimestamp 
    } = req.body;
    
    // 先检查基本参数，如果缺少任何必要参数，抛出错误
    if (!trainNo || !departureStation || !arrivalStation || !departureDate || !seatType || !passengerId) {
      throw new Error('缺少必要参数');
    }
    
    // 验证用户已登录（从Authorization header或session中获取）
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: '请先登录！' });
    }
    
    // 简化处理：从Authorization header中提取userId
    // 实际应该验证JWT token
    let userId = null;
    try {
      // 假设格式是 "Bearer token"
      const token = authHeader.split(' ')[1];
      // TODO: 实际应该解析JWT token获取userId
      userId = token; // 简化处理
    } catch (error) {
      return res.status(401).json({ error: '请先登录！' });
    }
    
    // 检查查询时间是否超过5分钟
    if (queryTimestamp && ticketService.checkQueryExpired(queryTimestamp)) {
      return res.status(400).json({ error: '页面内容已过期，请重新查询！' });
    }
    
    // 获取车次详情以检查发车时间
    const trainDetails = await trainService.getTrainDetails(trainNo);
    if (!trainDetails) {
      return res.status(400).json({ error: '车次不存在' });
    }
    
    // 检查距离发车时间是否不足3小时
    const timeCheck = ticketService.checkDepartureTime(departureDate, trainDetails.route.departureTime);
    if (timeCheck.isNearDeparture) {
      return res.status(400).json({ error: timeCheck.message });
    }
    
    // 检查车次是否有余票
    const availableSeats = await trainService.calculateAvailableSeats(
      trainNo, 
      departureStation, 
      arrivalStation
    );
    
    if (!availableSeats[seatType] || availableSeats[seatType] === 0) {
      return res.status(400).json({ error: '手慢了，该车次车票已售罄！' });
    }
    
    // 预订车票
    const result = await ticketService.reserveTicket(
      trainNo, 
      departureStation, 
      arrivalStation, 
      departureDate, 
      seatType, 
      passengerId,
      userId
    );
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // 预订成功
    res.status(200).json({
      message: '预订成功',
      orderId: result.orderId,
      seatNo: result.seatNo,
      redirectUrl: '/order-details'
    });
  } catch (error) {
    console.error('预订车票失败:', error);
    res.status(500).json({ error: '网络忙，请稍后重试' });
  }
});

module.exports = router;

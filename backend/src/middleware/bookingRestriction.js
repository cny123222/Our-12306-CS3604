const orderService = require('../services/orderService');

/**
 * 检查用户是否有未支付的订单
 * 如果有，阻止继续购票
 */
async function checkUnpaidOrder(req, res, next) {
  try {
    const userId = req.user.id;
    
    const hasUnpaid = await orderService.hasUnpaidOrder(userId);
    
    if (hasUnpaid) {
      return res.status(403).json({
        error: '您还有未处理的订单，请您到[未完成订单]进行处理！',
        hasUnpaidOrder: true
      });
    }
    
    next();
  } catch (error) {
    console.error('检查未支付订单失败:', error);
    // 如果检查失败，允许继续（避免阻塞正常流程）
    next();
  }
}

module.exports = {
  checkUnpaidOrder
};


/**
 * 乘客管理相关API路由
 * 为乘客管理页提供HTTP接口
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const personalInfoDbService = require('../services/personalInfoDbService');
const db = require('../database');

/**
 * API-PUT-Passenger: 更新乘客信息
 * PUT /api/passengers/:passengerId
 */
router.put('/:passengerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { passengerId } = req.params;
    const { phone } = req.body;
    
    // 验证手机号格式
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '您输入的手机号码不是有效的格式！' });
    }
    
    // 获取乘客信息并验证所有权
    const passenger = await db.queryOne(
      'SELECT * FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    if (!passenger) {
      return res.status(404).json({ error: '乘客不存在' });
    }
    
    if (passenger.user_id !== userId) {
      return res.status(403).json({ error: '无权修改此乘客信息' });
    }
    
    // 更新乘客手机号
    await db.run(
      "UPDATE passengers SET phone = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
      [phone, passengerId, userId]
    );
    
    res.status(200).json({ message: '修改成功' });
  } catch (error) {
    console.error('更新乘客信息失败:', error);
    res.status(500).json({ error: '更新乘客信息失败' });
  }
});

/**
 * API-DELETE-Passenger: 删除乘客信息
 * DELETE /api/passengers/:passengerId
 */
router.delete('/:passengerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { passengerId } = req.params;
    
    // 验证乘客属于当前用户
    const passenger = await db.queryOne(
      'SELECT * FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    if (!passenger) {
      return res.status(404).json({ error: '乘客不存在' });
    }
    
    if (passenger.user_id !== userId) {
      return res.status(403).json({ error: '无权删除此乘客' });
    }
    
    // 检查是否有未完成的订单
    const orders = await db.query(
      `SELECT od.* FROM order_details od
       JOIN orders o ON od.order_id = o.id
       WHERE od.passenger_id = ? AND o.status IN ('pending', 'processing', 'confirmed')
       LIMIT 1`,
      [passengerId]
    );
    
    if (orders.length > 0) {
      return res.status(400).json({ error: '该乘客有未完成的订单，无法删除' });
    }
    
    // 删除乘客
    await db.run(
      'DELETE FROM passengers WHERE id = ? AND user_id = ?',
      [passengerId, userId]
    );
    
    res.status(200).json({ message: '删除成功' });
  } catch (error) {
    console.error('删除乘客失败:', error);
    res.status(500).json({ error: '删除乘客失败' });
  }
});

/**
 * API-POST-ValidatePassenger: 验证乘客信息的合法性
 * POST /api/passengers/validate
 */
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, idCardType, idCardNumber, phone, discountType } = req.body;
    
    // 验证姓名长度（1个汉字算2个字符）
    let nameLength = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charAt(i);
      if (char.match(/[\u4e00-\u9fa5]/)) {
        nameLength += 2;
      } else {
        nameLength += 1;
      }
    }
    
    if (nameLength < 3 || nameLength > 30) {
      return res.status(400).json({ error: '允许输入的字符串在3-30个字符之间！' });
    }
    
    // 验证姓名只包含中英文字符、"."和单空格
    if (!/^[\u4e00-\u9fa5a-zA-Z\.\s]+$/.test(name)) {
      return res.status(400).json({ error: '请输入姓名！' });
    }
    
    // 验证证件号码长度为18个字符
    if (idCardNumber.length !== 18) {
      return res.status(400).json({ error: '请正确输入18位证件号码！' });
    }
    
    // 验证证件号码只包含数字和字母
    if (!/^[0-9A-Za-z]+$/.test(idCardNumber)) {
      return res.status(400).json({ error: '输入的证件编号中包含中文信息或特殊字符！' });
    }
    
    // 验证手机号
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '您输入的手机号码不是有效的格式！' });
    }
    
    // 验证乘客信息唯一性
    const exists = await personalInfoDbService.checkPassengerExists(userId, name, idCardNumber);
    
    if (exists) {
      return res.status(409).json({ error: '该联系人已存在，请使用不同的姓名和证件。' });
    }
    
    res.status(200).json({ valid: true, message: '验证通过' });
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

module.exports = router;

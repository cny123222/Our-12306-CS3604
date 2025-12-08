const express = require('express');
const router = express.Router();
const addressService = require('../services/addressService');
const { authenticateUser } = require('../middleware/auth');

/**
 * 获取用户地址列表
 * GET /api/addresses
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await addressService.getUserAddresses(userId);
    res.status(200).json({ addresses });
  } catch (error) {
    console.error('获取地址列表失败:', error);
    const status = error.status || 500;
    const message = error.message || '获取地址列表失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 添加地址
 * POST /api/addresses
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;

    // 简单验证
    if (!addressData.province || !addressData.detailAddress || !addressData.recipient || !addressData.phone) {
      return res.status(400).json({ error: '请填写所有必填项' });
    }

    const newAddress = await addressService.addAddress(userId, addressData);
    res.status(201).json({ address: newAddress });
  } catch (error) {
    console.error('添加地址失败:', error);
    const status = error.status || 500;
    const message = error.message || '添加地址失败';
    res.status(status).json({ error: message });
  }
});

/**
 * 删除地址
 * DELETE /api/addresses/:addressId
 */
router.delete('/:addressId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const success = await addressService.deleteAddress(userId, addressId);
    
    if (success) {
      res.status(200).json({ message: '删除成功' });
    } else {
      res.status(404).json({ error: '地址不存在或无权删除' });
    }
  } catch (error) {
    console.error('删除地址失败:', error);
    const status = error.status || 500;
    const message = error.message || '删除地址失败';
    res.status(status).json({ error: message });
  }
});

module.exports = router;

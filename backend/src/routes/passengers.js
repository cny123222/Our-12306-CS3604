const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const passengerService = require('../services/passengerService');

/**
 * API-GET-Passengers: 获取用户的乘客列表
 * Route: GET /api/passengers
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const passengers = await passengerService.getUserPassengers(userId);
    res.status(200).json({ passengers });
  } catch (error) {
    res.status(500).json({ error: error.message || '获取乘客列表失败' });
  }
});

/**
 * API-POST-SearchPassengers: 搜索乘客
 * Route: POST /api/passengers/search
 */
router.post('/search', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: '请输入搜索关键词' });
    }
    
    const passengers = await passengerService.searchPassengers(userId, keyword);
    res.status(200).json({ passengers });
  } catch (error) {
    res.status(500).json({ error: error.message || '搜索失败' });
  }
});

/**
 * API-POST-AddPassenger: 添加乘客信息
 * Route: POST /api/passengers
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, idCardType, idCardNumber, phone, discountType } = req.body;
    
    // 验证必填字段
    if (!name || !idCardType || !idCardNumber) {
      return res.status(400).json({ error: '参数错误' });
    }
    
    const result = await passengerService.createPassenger(userId, {
      name,
      idCardType,
      idCardNumber,
      phone,
      discountType: discountType || '成人票'
    });
    
    res.status(201).json(result);
  } catch (error) {
    if (error.status === 409) {
      res.status(409).json({ error: error.message });
    } else if (error.status === 400) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || '添加乘客失败' });
    }
  }
});

/**
 * API-PUT-UpdatePassenger: 更新乘客信息
 * Route: PUT /api/passengers/:passengerId
 */
router.put('/:passengerId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { passengerId } = req.params;
    const updateData = req.body;
    
    const result = await passengerService.updatePassenger(userId, passengerId, updateData);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ error: error.message });
    } else if (error.status === 403) {
      res.status(403).json({ error: error.message });
    } else if (error.status === 400) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || '更新失败' });
    }
  }
});

/**
 * API-DELETE-Passenger: 删除乘客信息
 * Route: DELETE /api/passengers/:passengerId
 */
router.delete('/:passengerId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { passengerId } = req.params;
    
    const result = await passengerService.deletePassenger(userId, passengerId);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ error: error.message });
    } else if (error.status === 403) {
      res.status(403).json({ error: error.message });
    } else if (error.status === 400) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || '删除失败' });
    }
  }
});

/**
 * API-POST-CheckPassengerDuplicate: 检查乘客是否已存在
 * Route: POST /api/passengers/check-duplicate
 */
router.post('/check-duplicate', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, idCardNumber } = req.body;
    
    if (!name || !idCardNumber) {
      return res.status(400).json({ error: '请提供姓名和证件号码' });
    }
    
    const exists = await passengerService.checkPassengerExists(userId, name, idCardNumber);
    res.status(200).json({ exists });
  } catch (error) {
    res.status(500).json({ error: error.message || '检查失败' });
  }
});

/**
 * API-GET-PassengerDetails: 获取乘客详细信息
 * Route: GET /api/passengers/:passengerId
 */
router.get('/:passengerId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { passengerId } = req.params;
    
    const passenger = await passengerService.getPassengerDetails(userId, passengerId);
    res.status(200).json(passenger);
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ error: error.message });
    } else if (error.status === 403) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || '获取乘客信息失败' });
    }
  }
});

module.exports = router;

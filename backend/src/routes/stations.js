const express = require('express');
const router = express.Router();
const stationService = require('../services/stationService');

/**
 * 获取所有可用站点列表
 * 骨架实现：仅包含路由结构，不实现真实逻辑
 * GET /api/stations
 */
router.get('/', async (req, res) => {
  try {
    // TODO: 实现站点列表获取
    const { keyword } = req.query;
    
    // TODO: 如果提供keyword，返回模糊匹配的站点
    // TODO: 如果未提供keyword，返回所有站点
    
    res.status(200).json({
      stations: []
    });
  } catch (error) {
    console.error('获取站点列表失败:', error);
    res.status(500).json({ error: '获取站点列表失败' });
  }
});

/**
 * 验证站点是否有效
 * 骨架实现：仅包含路由结构，不实现真实逻辑
 * POST /api/stations/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { stationName } = req.body;
    
    // TODO: 验证站点名称是否在系统支持的站点列表中
    // TODO: 如果站点无效，返回相似度匹配的推荐站点
    
    res.status(200).json({
      valid: true,
      station: {}
    });
  } catch (error) {
    console.error('验证站点失败:', error);
    res.status(400).json({
      valid: false,
      error: '无法匹配该出发地/到达地',
      suggestions: []
    });
  }
});

module.exports = router;


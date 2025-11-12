const express = require('express');
const router = express.Router();
const stationService = require('../services/stationService');

/**
 * 获取所有可用站点列表
 * GET /api/stations
 * 支持关键词搜索（简拼、全拼、汉字）
 */
router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    let stations;
    if (keyword) {
      // 如果提供keyword，返回模糊匹配的站点
      stations = await stationService.searchStations(keyword);
    } else {
      // 如果未提供keyword，返回所有站点
      stations = await stationService.getAllStations();
    }
    
    res.status(200).json({
      stations: stations
    });
  } catch (error) {
    console.error('获取站点列表失败:', error);
    res.status(500).json({ error: '获取站点列表失败' });
  }
});

/**
 * 验证站点是否有效
 * POST /api/stations/validate
 * 如果站点无效，返回相似度匹配的推荐站点
 */
router.post('/validate', async (req, res) => {
  try {
    const { stationName } = req.body;
    
    // 验证站点名称是否在系统支持的站点列表中
    const result = await stationService.validateStation(stationName);
    
    if (result.valid) {
      res.status(200).json({
        valid: true,
        station: result.station
      });
    } else {
      res.status(400).json({
        valid: false,
        error: result.error || '无法匹配该出发地/到达地',
        suggestions: result.suggestions || []
      });
    }
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


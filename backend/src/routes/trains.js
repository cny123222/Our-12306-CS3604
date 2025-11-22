const express = require('express');
const router = express.Router();
const trainService = require('../services/trainService');
const stationService = require('../services/stationService');

/**
 * 获取所有支持的城市列表
 * GET /api/trains/cities
 */
router.get('/cities', async (req, res) => {
  try {
    const cities = await stationService.getAllCities();
    res.status(200).json({
      cities: cities
    });
  } catch (error) {
    console.error('获取城市列表失败:', error);
    res.status(500).json({ error: '获取城市列表失败' });
  }
});

/**
 * 根据城市获取车站列表
 * GET /api/trains/cities/:cityName/stations
 */
router.get('/cities/:cityName/stations', async (req, res) => {
  try {
    const { cityName } = req.params;
    const stations = await stationService.getStationsByCity(cityName);
    
    if (stations.length === 0) {
      return res.status(404).json({ error: '该城市不存在或没有配置车站' });
    }
    
    res.status(200).json({
      city: cityName,
      stations: stations
    });
  } catch (error) {
    console.error('获取城市车站列表失败:', error);
    res.status(500).json({ error: '获取城市车站列表失败' });
  }
});

/**
 * 根据车站名获取所属城市
 * GET /api/trains/stations/:stationName/city
 */
router.get('/stations/:stationName/city', async (req, res) => {
  try {
    const { stationName } = req.params;
    const city = await stationService.getCityByStation(stationName);
    
    if (!city) {
      return res.status(404).json({ error: '找不到该车站对应的城市' });
    }
    
    res.status(200).json({
      station: stationName,
      city: city
    });
  } catch (error) {
    console.error('获取车站所属城市失败:', error);
    res.status(500).json({ error: '获取车站所属城市失败' });
  }
});

/**
 * 计算指定车次在指定区间的余票数
 * POST /api/trains/available-seats
 */
router.post('/available-seats', async (req, res) => {
  try {
    const { trainNo, departureStation, arrivalStation, departureDate } = req.body;
    
    // 验证必要参数
    if (!trainNo || !departureStation || !arrivalStation) {
      return res.status(400).json({ error: '参数错误' });
    }
    
    // 计算各席别的余票数
    const availableSeats = await trainService.calculateAvailableSeats(
      trainNo, 
      departureStation, 
      arrivalStation
    );
    
    res.status(200).json({
      trainNo: trainNo,
      availableSeats: availableSeats
    });
  } catch (error) {
    console.error('计算余票失败:', error);
    res.status(500).json({ error: '计算余票失败' });
  }
});

/**
 * 获取车次筛选选项
 * GET /api/trains/filter-options
 */
router.get('/filter-options', async (req, res) => {
  try {
    const { departureStation, arrivalStation, departureDate } = req.query;
    
    // 验证必要参数
    if (!departureStation || !arrivalStation || !departureDate) {
      return res.status(400).json({ error: '参数错误' });
    }
    
    // 返回当前查询结果中所有唯一的出发站、到达站、席别类型
    const filterOptions = await trainService.getFilterOptions(
      departureStation, 
      arrivalStation, 
      departureDate
    );
    
    res.status(200).json(filterOptions);
  } catch (error) {
    console.error('获取筛选选项失败:', error);
    res.status(500).json({ error: '获取筛选选项失败' });
  }
});

/**
 * 获取可选的出发日期列表
 * GET /api/trains/available-dates
 */
router.get('/available-dates', async (req, res) => {
  try {
    // 返回已放票的日期列表
    const availableDates = await trainService.getAvailableDates();
    
    res.status(200).json({
      availableDates: availableDates,
      currentDate: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('获取可选日期失败:', error);
    res.status(500).json({ error: '获取可选日期失败' });
  }
});

/**
 * 搜索符合条件的车次列表
 * 支持按城市或车站搜索
 * POST /api/trains/search
 */
router.post('/search', async (req, res) => {
  try {
    const { departureStation, arrivalStation, departureDate, trainTypes } = req.body;
    
    // 验证出发地和到达地不为空
    if (!departureStation) {
      return res.status(400).json({ error: '请选择出发城市' });
    }
    
    if (!arrivalStation) {
      return res.status(400).json({ error: '请选择到达城市' });
    }
    
    // 验证出发日期格式（YYYY-MM-DD）
    if (departureDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(departureDate)) {
        console.error('日期格式错误:', { departureDate });
        return res.status(400).json({ error: '日期格式错误，请使用YYYY-MM-DD格式' });
      }
      // 验证日期是否有效
      const date = new Date(departureDate);
      if (isNaN(date.getTime())) {
        console.error('无效日期:', { departureDate });
        return res.status(400).json({ error: '无效的日期' });
      }
    }
    
    // 验证出发城市是否有效
    const depCityResult = await stationService.validateCity(departureStation);
    if (!depCityResult.valid) {
      return res.status(400).json({ 
        error: '无法匹配该出发城市',
        suggestions: depCityResult.suggestions 
      });
    }
    
    // 验证到达城市是否有效
    const arrCityResult = await stationService.validateCity(arrivalStation);
    if (!arrCityResult.valid) {
      return res.status(400).json({ 
        error: '无法匹配该到达城市',
        suggestions: arrCityResult.suggestions 
      });
    }
    
    // 记录查询参数
    console.log('车次搜索请求（城市级）:', { departureStation, arrivalStation, departureDate, trainTypes });
    
    // 查询符合条件的车次
    const trains = await trainService.searchTrains(
      departureStation, 
      arrivalStation, 
      departureDate, 
      trainTypes
    );
    
    console.log(`查询结果: 找到 ${trains.length} 个车次`);
    
    res.status(200).json({
      trains: trains,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('查询车次失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      params: req.body
    });
    res.status(500).json({ error: '查询失败，请稍后重试' });
  }
});

/**
 * 获取指定车次的详细信息
 * GET /api/trains/:trainNo
 */
router.get('/:trainNo', async (req, res) => {
  try {
    const { trainNo } = req.params;
    
    // 查询车次详细信息
    const trainDetails = await trainService.getTrainDetails(trainNo);
    
    if (!trainDetails) {
      return res.status(404).json({ error: '车次不存在' });
    }
    
    res.status(200).json(trainDetails);
  } catch (error) {
    console.error('获取车次详情失败:', error);
    res.status(500).json({ error: '获取车次详情失败' });
  }
});

module.exports = router;

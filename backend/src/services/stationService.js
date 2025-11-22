const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cityStationMapping = require('../config/cityStationMapping');

// 创建数据库连接
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
    : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
  
  return new sqlite3.Database(dbPath);
}

/**
 * 站点服务
 */

/**
 * 获取所有站点
 */
async function getAllStations() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.all('SELECT * FROM stations ORDER BY name', [], (err, rows) => {
if (err) {
        console.error('获取站点列表失败:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * 根据关键词搜索站点
 * 支持简拼、全拼、汉字搜索
 */
async function searchStations(keyword) {
  if (!keyword) {
    return await getAllStations();
  }
  
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const searchPattern = `%${keyword}%`;
    
    // 搜索站点名称、拼音、简拼
    db.all(
      `SELECT * FROM stations 
       WHERE name LIKE ? OR pinyin LIKE ? OR short_pinyin LIKE ? 
       ORDER BY name`,
      [searchPattern, searchPattern, searchPattern],
      (err, rows) => {
if (err) {
          console.error('搜索站点失败:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

/**
 * 验证站点是否有效
 * 如果站点无效，返回相似度匹配的推荐站点
 */
async function validateStation(stationName) {
  if (!stationName) {
    return { valid: false, error: '站点名称不能为空', suggestions: [] };
  }
  
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 先精确匹配
    db.get('SELECT * FROM stations WHERE name = ?', [stationName], (err, row) => {
      if (err) {
console.error('验证站点失败:', err);
        return reject(err);
      }
      
      if (row) {
        // 站点有效
return resolve({ valid: true, station: row });
      }
      
      // 站点无效，查找相似站点
      const searchPattern = `%${stationName}%`;
      db.all(
        `SELECT * FROM stations 
         WHERE name LIKE ? OR pinyin LIKE ? OR short_pinyin LIKE ? 
         ORDER BY name LIMIT 10`,
        [searchPattern, searchPattern, searchPattern],
        (err, rows) => {
if (err) {
            console.error('查找相似站点失败:', err);
            return reject(err);
          }
          
          resolve({
            valid: false,
            error: '无法匹配该出发地/到达地',
            suggestions: rows || []
          });
        }
      );
    });
  });
}

/**
 * 获取所有支持的城市列表
 */
async function getAllCities() {
  return cityStationMapping.getAllCities();
}

/**
 * 根据城市名获取该城市的所有车站
 * @param {string} cityName - 城市名
 * @returns {string[]} 车站列表
 */
async function getStationsByCity(cityName) {
  return cityStationMapping.getStationsByCity(cityName);
}

/**
 * 验证城市名是否有效
 * @param {string} cityName - 城市名
 * @returns {Object} 验证结果
 */
async function validateCity(cityName) {
  if (!cityName) {
    return { valid: false, error: '城市名称不能为空', suggestions: [] };
  }
  
  const isValid = cityStationMapping.isCityValid(cityName);
  
  if (isValid) {
    const stations = cityStationMapping.getStationsByCity(cityName);
    return { valid: true, city: cityName, stations };
  }
  
  // 城市无效，提供所有城市作为建议
  const allCities = cityStationMapping.getAllCities();
  return {
    valid: false,
    error: '无法匹配该城市',
    suggestions: allCities
  };
}

/**
 * 根据车站名反查所属城市
 * @param {string} stationName - 车站名
 * @returns {string|null} 城市名
 */
async function getCityByStation(stationName) {
  return cityStationMapping.getCityByStation(stationName);
}

module.exports = {
  getAllStations,
  searchStations,
  validateStation,
  getAllCities,
  getStationsByCity,
  validateCity,
  getCityByStation
};


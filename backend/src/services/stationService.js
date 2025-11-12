const dbService = require('./dbService');

/**
 * 站点服务
 * 骨架实现：仅包含服务结构，不实现真实逻辑
 */

/**
 * 获取所有站点
 */
async function getAllStations() {
  // TODO: 从数据库获取所有站点
  return [];
}

/**
 * 根据关键词搜索站点
 */
async function searchStations(keyword) {
  // TODO: 支持简拼、全拼、汉字搜索
  return [];
}

/**
 * 验证站点是否有效
 */
async function validateStation(stationName) {
  // TODO: 验证站点名称是否在系统支持的站点列表中
  return { valid: false, suggestions: [] };
}

module.exports = {
  getAllStations,
  searchStations,
  validateStation
};


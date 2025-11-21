/**
 * 城市-车站映射配置
 * 定义各城市包含的车站列表
 */

const CITY_STATION_MAPPING = {
  '上海': ['上海虹桥', '上海', '上海松江', '上海南'],
  '北京': ['北京南', '北京丰台', '北京']
};

/**
 * 获取所有支持的城市列表
 */
function getAllCities() {
  return Object.keys(CITY_STATION_MAPPING);
}

/**
 * 根据城市名获取该城市的所有车站
 * @param {string} cityName - 城市名
 * @returns {string[]} 车站列表
 */
function getStationsByCity(cityName) {
  return CITY_STATION_MAPPING[cityName] || [];
}

/**
 * 验证城市名是否有效
 * @param {string} cityName - 城市名
 * @returns {boolean} 是否有效
 */
function isCityValid(cityName) {
  return CITY_STATION_MAPPING.hasOwnProperty(cityName);
}

/**
 * 根据车站名反查所属城市
 * @param {string} stationName - 车站名
 * @returns {string|null} 城市名，如果找不到返回null
 */
function getCityByStation(stationName) {
  for (const [city, stations] of Object.entries(CITY_STATION_MAPPING)) {
    if (stations.includes(stationName)) {
      return city;
    }
  }
  return null;
}

/**
 * 获取所有城市-车站映射
 * @returns {Object} 完整的映射对象
 */
function getCityStationMapping() {
  return { ...CITY_STATION_MAPPING };
}

module.exports = {
  getAllCities,
  getStationsByCity,
  isCityValid,
  getCityByStation,
  getCityStationMapping
};


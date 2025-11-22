/**
 * 城市-车站映射配置
 * 定义各城市包含的车站列表
 */

const CITY_STATION_MAPPING = {
  // 主要城市（按地理位置从北到南排序）
  '北京': ['北京南', '北京南站', '北京', '北京西'],
  '天津': ['天津西', '天津南'],
  '石家庄': ['石家庄'],
  '沧州': ['沧州西'],
  '济南': ['济南西'],
  '徐州': ['徐州东'],
  '宿州': ['宿州东'],
  '蚌埠': ['蚌埠南'],
  '郑州': ['郑州东'],
  '南京': ['南京南', '南京'],
  '苏州': ['苏州', '苏州北'],
  '无锡': ['无锡东', '无锡'],
  '昆山': ['昆山南'],
  '上海': ['上海虹桥', '上海', '上海南'],
  '金山': ['金山北'],
  '嘉兴': ['嘉兴南'],
  '桐乡': ['桐乡'],
  '杭州': ['杭州东', '杭州'],
  '义乌': ['义乌'],
  '武汉': ['武汉'],
  '南昌': ['南昌西'],
  '长沙': ['长沙南'],
  '广州': ['广州南'],
  '深圳': ['深圳北']
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


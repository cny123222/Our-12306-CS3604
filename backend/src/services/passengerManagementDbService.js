// 乘客管理数据库服务
// 用于乘客管理页功能

const db = require('../database');

/**
 * DB-CheckPassengerExists: 检查乘客信息是否已存在
 * @param {string} userId - 用户ID
 * @param {string} name - 乘客姓名
 * @param {string} idCardNumber - 证件号码
 * @returns {Promise<boolean>} 存在返回true
 */
async function checkPassengerExists(userId, name, idCardNumber) {
  try {
    const sql = `
      SELECT id 
      FROM passengers 
      WHERE user_id = ? 
        AND name = ? 
        AND id_card_number = ?
    `;
    
    const passenger = await db.queryOne(sql, [userId, name, idCardNumber]);
    return passenger !== null && passenger !== undefined;
  } catch (error) {
    console.error('检查乘客是否存在失败:', error);
    throw error;
  }
}

/**
 * DB-GetPassengerByIdCard: 根据证件号码获取乘客信息
 * @param {string} userId - 用户ID
 * @param {string} idCardNumber - 证件号码
 * @returns {Promise<Object|null>} 乘客信息对象或null
 */
async function getPassengerByIdCard(userId, idCardNumber) {
  try {
    const sql = `
      SELECT 
        id,
        name,
        id_card_type as idCardType,
        id_card_number as idCardNumber,
        phone,
        discount_type as discountType,
        created_at as addedDate
      FROM passengers
      WHERE user_id = ? 
        AND id_card_number = ?
    `;
    
    const passenger = await db.queryOne(sql, [userId, idCardNumber]);
    return passenger || null;
  } catch (error) {
    console.error('根据证件号码获取乘客信息失败:', error);
    throw error;
  }
}

module.exports = {
  checkPassengerExists,
  getPassengerByIdCard
};


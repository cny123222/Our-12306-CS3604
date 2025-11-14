/**
 * 个人信息相关数据库服务
 * 为个人信息页提供数据库操作接口
 */

const db = require('../database');

/**
 * 手机号脱敏处理（中间四位用*隐去）
 * @param {string} phone - 手机号
 * @returns {string} 脱敏后的手机号
 */
function maskPhone(phone) {
  if (!phone || phone.length !== 11) {
    return phone;
  }
  return phone.substring(0, 3) + '****' + phone.substring(7);
}

/**
 * DB-GetUserInfo: 获取用户的完整个人信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户信息对象
 */
async function getUserInfo(userId) {
  try {
    const user = await db.queryOne(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return null;
    }
    
    return {
      username: user.username,
      name: user.name || '',
      country: '中国China', // 默认国家
      idCardType: user.id_card_type || '居民身份证',
      idCardNumber: user.id_card_number || '',
      verificationStatus: '已通过', // 默认已通过核验
      phone: maskPhone(user.phone), // 手机号脱敏
      email: user.email || '',
      discountType: user.discount_type || '成人'
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

/**
 * DB-UpdateUserEmail: 更新用户的邮箱地址
 * @param {string} userId - 用户ID
 * @param {string} email - 新邮箱地址
 * @returns {Promise<boolean>} 更新是否成功
 */
async function updateUserEmail(userId, email) {
  try {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('请输入有效的电子邮件地址！');
    }
    
    const result = await db.run(
      "UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?",
      [email, userId]
    );
    
    return result.changes > 0;
  } catch (error) {
    console.error('更新用户邮箱失败:', error);
    throw error;
  }
}

/**
 * DB-UpdateUserPhone: 更新用户的手机号
 * @param {string} userId - 用户ID
 * @param {string} newPhone - 新手机号
 * @returns {Promise<boolean>} 更新是否成功
 */
async function updateUserPhone(userId, newPhone) {
  try {
    // 验证新手机号是否被其他用户使用
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE phone = ? AND id != ?',
      [newPhone, userId]
    );
    
    if (existingUser) {
      throw new Error('该手机号已被使用');
    }
    
    const result = await db.run(
      "UPDATE users SET phone = ?, updated_at = datetime('now') WHERE id = ?",
      [newPhone, userId]
    );
    
    return result.changes > 0;
  } catch (error) {
    console.error('更新用户手机号失败:', error);
    throw error;
  }
}

/**
 * DB-CheckPassengerExists: 检查乘客信息是否已存在
 * @param {string} userId - 用户ID
 * @param {string} name - 乘客姓名
 * @param {string} idCardNumber - 证件号码
 * @returns {Promise<boolean>} 是否存在
 */
async function checkPassengerExists(userId, name, idCardNumber) {
  try {
    const passenger = await db.queryOne(
      'SELECT id FROM passengers WHERE user_id = ? AND name = ? AND id_card_number = ?',
      [userId, name, idCardNumber]
    );
    
    return !!passenger;
  } catch (error) {
    console.error('检查乘客是否存在失败:', error);
    throw error;
  }
}

/**
 * DB-GetUserOrders: 获取用户的订单列表
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项
 * @param {string} options.startDate - 开始日期（可选）
 * @param {string} options.endDate - 结束日期（可选）
 * @returns {Promise<Array>} 订单列表
 */
async function getUserOrders(userId, options = {}) {
  try {
    let sql = `
      SELECT * FROM orders 
      WHERE user_id = ?
      AND datetime(created_at) >= datetime('now', '-30 days')
    `;
    const params = [userId];
    
    // 按日期范围筛选
    if (options.startDate) {
      sql += ' AND date(departure_date) >= date(?)';
      params.push(options.startDate);
    }
    
    if (options.endDate) {
      sql += ' AND date(departure_date) <= date(?)';
      params.push(options.endDate);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const orders = await db.query(sql, params);
    
    return orders.map(order => ({
      orderId: order.id,
      trainNumber: order.train_number,
      departureStation: order.departure_station,
      arrivalStation: order.arrival_station,
      departureDate: order.departure_date,
      departureTime: order.departure_time,
      arrivalTime: order.arrival_time,
      status: order.status,
      totalPrice: order.total_price,
      createdAt: order.created_at
    }));
  } catch (error) {
    console.error('获取用户订单列表失败:', error);
    throw error;
  }
}

/**
 * DB-SearchOrders: 搜索用户的订单
 * @param {string} userId - 用户ID
 * @param {Object} searchParams - 搜索参数
 * @param {string} searchParams.keyword - 搜索关键词（订单号/车次号/姓名）
 * @param {string} searchParams.startDate - 开始日期（可选）
 * @param {string} searchParams.endDate - 结束日期（可选）
 * @returns {Promise<Array>} 匹配的订单列表
 */
async function searchOrders(userId, searchParams) {
  try {
    const { keyword, startDate, endDate } = searchParams;
    
    let sql = `
      SELECT DISTINCT o.* FROM orders o
      LEFT JOIN order_details od ON o.id = od.order_id
      WHERE o.user_id = ?
      AND datetime(o.created_at) >= datetime('now', '-30 days')
    `;
    const params = [userId];
    
    // 关键词搜索
    if (keyword) {
      sql += ` AND (
        o.id LIKE ? OR 
        o.train_number LIKE ? OR 
        od.passenger_name LIKE ?
      )`;
      const searchPattern = `%${keyword}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // 日期范围筛选
    if (startDate) {
      sql += ' AND date(o.departure_date) >= date(?)';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND date(o.departure_date) <= date(?)';
      params.push(endDate);
    }
    
    sql += ' ORDER BY o.created_at DESC';
    
    const orders = await db.query(sql, params);
    
    return orders.map(order => ({
      orderId: order.id,
      trainNumber: order.train_number,
      departureStation: order.departure_station,
      arrivalStation: order.arrival_station,
      departureDate: order.departure_date,
      departureTime: order.departure_time,
      arrivalTime: order.arrival_time,
      status: order.status,
      totalPrice: order.total_price,
      createdAt: order.created_at
    }));
  } catch (error) {
    console.error('搜索订单失败:', error);
    throw error;
  }
}

/**
 * DB-GetPassengerByIdCard: 根据证件号码获取乘客信息
 * @param {string} userId - 用户ID
 * @param {string} idCardNumber - 证件号码
 * @returns {Promise<Object|null>} 乘客信息或null
 */
async function getPassengerByIdCard(userId, idCardNumber) {
  try {
    const passenger = await db.queryOne(
      'SELECT * FROM passengers WHERE user_id = ? AND id_card_number = ?',
      [userId, idCardNumber]
    );
    
    if (!passenger) {
      return null;
    }
    
    return {
      id: passenger.id,
      name: passenger.name,
      idCardType: passenger.id_card_type,
      idCardNumber: passenger.id_card_number,
      phone: passenger.phone,
      discountType: passenger.discount_type,
      createdAt: passenger.created_at
    };
  } catch (error) {
    console.error('根据证件号查询乘客失败:', error);
    throw error;
  }
}

module.exports = {
  getUserInfo,
  updateUserEmail,
  updateUserPhone,
  checkPassengerExists,
  getUserOrders,
  searchOrders,
  getPassengerByIdCard
};


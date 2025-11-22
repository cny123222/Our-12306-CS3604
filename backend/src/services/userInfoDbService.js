// 用户信息数据库服务
// 用于个人信息页功能

const db = require('../database');

/**
 * 手机号脱敏处理
 * @param {string} phone - 原始手机号
 * @returns {string} 脱敏后的手机号
 */
function maskPhone(phone) {
  if (!phone) return '';
  // 格式：(+86)158****9968
  const phoneStr = phone.replace(/\D/g, ''); // 去除非数字字符
  if (phoneStr.length === 11) {
    return `(+86)${phoneStr.substring(0, 3)}****${phoneStr.substring(7)}`;
  }
  return phone;
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否合法
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * DB-GetUserInfo: 获取用户的完整个人信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户信息对象
 */
async function getUserInfo(userId) {
  try {
    const sql = `
      SELECT 
        id,
        username,
        name,
        '中国China' as country,
        COALESCE(id_card_type, '居民身份证') as idCardType,
        id_card_number as idCardNumber,
        '已通过' as verificationStatus,
        phone,
        email,
        COALESCE(discount_type, '成人') as discountType
      FROM users
      WHERE id = ?
    `;
    
    const user = await db.queryOne(sql, [userId]);
    
    if (!user) {
      return null;
    }
    
    // 手机号脱敏处理
    user.phone = maskPhone(user.phone);
    
    return {
      username: user.username,
      name: user.name,
      country: user.country,
      idCardType: user.idCardType,
      idCardNumber: user.idCardNumber,
      verificationStatus: user.verificationStatus,
      phone: user.phone,
      email: user.email || '',
      discountType: user.discountType
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
 * @returns {Promise<boolean>} 更新成功返回true
 */
async function updateUserEmail(userId, email) {
  try {
    // 验证邮箱格式
    if (!isValidEmail(email)) {
      throw new Error('请输入有效的电子邮件地址！');
    }
    
    const sql = `
      UPDATE users 
      SET email = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await db.run(sql, [email, userId]);
    return result.changes > 0;
  } catch (error) {
    console.error('更新用户邮箱失败:', error);
    throw error;
  }
}

/**
 * DB-UpdateUserPhone: 更新用户的手机号
 * @param {string} userId - 用户ID
 * @param {string} phone - 新手机号
 * @returns {Promise<boolean>} 更新成功返回true
 */
async function updateUserPhone(userId, phone) {
  try {
    // 检查新手机号是否已被其他用户使用
    const checkSql = 'SELECT id FROM users WHERE phone = ? AND id != ?';
    const existingUser = await db.queryOne(checkSql, [phone, userId]);
    
    if (existingUser) {
      throw new Error('该手机号已被使用');
    }
    
    const sql = `
      UPDATE users 
      SET phone = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await db.run(sql, [phone, userId]);
    return result.changes > 0;
  } catch (error) {
    console.error('更新用户手机号失败:', error);
    throw error;
  }
}

/**
 * DB-UpdateUserDiscountType: 更新用户的优惠类型
 * @param {string} userId - 用户ID
 * @param {string} discountType - 新优惠类型
 * @returns {Promise<boolean>} 更新成功返回true
 */
async function updateUserDiscountType(userId, discountType) {
  try {
    // 验证优惠类型是否在允许的范围内
    const validTypes = ['成人', '儿童', '学生', '残疾军人'];
    if (!validTypes.includes(discountType)) {
      throw new Error('无效的优惠类型');
    }
    
    const sql = `
      UPDATE users 
      SET discount_type = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await db.run(sql, [discountType, userId]);
    return result.changes > 0;
  } catch (error) {
    console.error('更新用户优惠类型失败:', error);
    throw error;
  }
}

/**
 * DB-GetUserOrders: 获取用户的订单列表
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项 { startDate, endDate, searchType }
 * @returns {Promise<Array>} 订单列表
 */
async function getUserOrders(userId, options = {}) {
  try {
    const { startDate, endDate, searchType } = options;
    
    // 计算30日前的日期
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    let sql = `
      SELECT 
        id,
        train_number,
        departure_station,
        arrival_station,
        departure_date,
        departure_time,
        arrival_time,
        status,
        total_price,
        created_at
      FROM orders
      WHERE user_id = ?
        AND created_at >= ?
        AND status != 'pending'
        AND (
          status != 'confirmed_unpaid' 
          OR payment_expires_at IS NULL 
          OR datetime('now') <= payment_expires_at
        )
    `;
    
    const params = [String(userId), thirtyDaysAgoStr];
    
    // 添加日期范围筛选（根据查询类型选择字段）
    const dateField = searchType === 'travel-date' ? 'departure_date' : 'DATE(created_at)';
    
    if (startDate) {
      sql += ` AND ${dateField} >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND ${dateField} <= ?`;
      params.push(endDate);
    }
    
    // 按创建时间倒序排列
    sql += ' ORDER BY created_at DESC';
    
    const orders = await db.query(sql, params);
    
    // 为每个订单查询乘客信息和座位信息
    const ordersWithPassengers = await Promise.all(orders.map(async (order) => {
      // 查询该订单的乘客信息和座位信息
      const passengersSql = `
        SELECT passenger_name, seat_type, seat_number, car_number, ticket_type
        FROM order_details
        WHERE order_id = ?
      `;
      const passengerDetails = await db.query(passengersSql, [order.id]);
      
      // 提取乘客姓名列表和座位信息
      const passengerNames = passengerDetails.map(p => p.passenger_name).join(', ');
      
      // 根据订单状态构建座位信息
      let seatInfo = '';
      let seatType = '';
      
      if (order.status === 'completed' || order.status === 'paid' || order.status === 'confirmed_unpaid') {
        // 已完成、已支付或已确认未支付订单：返回完整的座位信息（包括座位号）
        seatInfo = passengerDetails.map(p => {
          if (p.seat_number) {
            return `${p.seat_type} ${p.seat_number}`;
          }
          return p.seat_type;
        }).join(', ');
      } else if (order.status === 'pending') {
        // 待确认订单：只返回席位类型，不包含座位号
        seatType = passengerDetails.map(p => p.seat_type).join(', ');
      }
      
      // 返回下划线命名的字段（匹配前端期望）
      return {
        id: order.id,
        order_id: order.id,
        train_no: order.train_number,
        departure_station: order.departure_station,
        arrival_station: order.arrival_station,
        departure_date: order.departure_date,
        departure_time: order.departure_time || '',
        arrival_time: order.arrival_time || '',
        status: order.status,
        total_price: order.total_price,
        created_at: order.created_at,
        passenger_name: passengerNames || '',
        seat_info: seatInfo || '',
        seat_type: seatType || '',
        passengers: passengerDetails
      };
    }));
    
    return ordersWithPassengers;
  } catch (error) {
    console.error('获取用户订单列表失败:', error);
    throw error;
  }
}

/**
 * DB-SearchOrders: 搜索用户的订单
 * @param {string} userId - 用户ID
 * @param {Object} searchCriteria - 搜索条件 { keyword, startDate, endDate, searchType }
 * @returns {Promise<Array>} 匹配的订单列表
 */
async function searchOrders(userId, searchCriteria) {
  try {
    const { keyword, startDate, endDate, searchType } = searchCriteria;
    
    let sql = `
      SELECT 
        id,
        train_number,
        departure_station,
        arrival_station,
        departure_date,
        departure_time,
        arrival_time,
        status,
        total_price,
        created_at
      FROM orders
      WHERE user_id = ?
        AND status != 'pending'
        AND (
          status != 'confirmed_unpaid' 
          OR payment_expires_at IS NULL 
          OR datetime('now') <= payment_expires_at
        )
    `;
    
    const params = [String(userId)];
    
    // 关键词搜索（订单号、车次号、乘客姓名）
    if (keyword) {
      sql += ` AND (
        id LIKE ? 
        OR train_number LIKE ?
        OR EXISTS (
          SELECT 1 FROM order_details 
          WHERE order_details.order_id = orders.id 
          AND order_details.passenger_name LIKE ?
        )
      )`;
      const keywordParam = `%${keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }
    
    // 日期范围筛选（根据查询类型选择字段）
    const dateField = searchType === 'travel-date' ? 'departure_date' : 'DATE(created_at)';
    
    if (startDate) {
      sql += ` AND ${dateField} >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND ${dateField} <= ?`;
      params.push(endDate);
    }
    
    // 按创建时间倒序排列
    sql += ' ORDER BY created_at DESC';
    
    const orders = await db.query(sql, params);
    
    // 为每个订单查询乘客信息和座位信息
    const ordersWithPassengers = await Promise.all(orders.map(async (order) => {
      // 查询该订单的乘客信息和座位信息
      const passengersSql = `
        SELECT passenger_name, seat_type, seat_number, car_number, ticket_type
        FROM order_details
        WHERE order_id = ?
      `;
      const passengerDetails = await db.query(passengersSql, [order.id]);
      
      // 提取乘客姓名列表和座位信息
      const passengerNames = passengerDetails.map(p => p.passenger_name).join(', ');
      
      // 根据订单状态构建座位信息
      let seatInfo = '';
      let seatType = '';
      
      if (order.status === 'completed' || order.status === 'paid' || order.status === 'confirmed_unpaid') {
        // 已完成、已支付或已确认未支付订单：返回完整的座位信息（包括座位号）
        seatInfo = passengerDetails.map(p => {
          if (p.seat_number) {
            return `${p.seat_type} ${p.seat_number}`;
          }
          return p.seat_type;
        }).join(', ');
      } else if (order.status === 'pending') {
        // 待确认订单：只返回席位类型，不包含座位号
        seatType = passengerDetails.map(p => p.seat_type).join(', ');
      }
      
      // 返回下划线命名的字段（匹配前端期望）
      return {
        id: order.id,
        order_id: order.id,
        train_no: order.train_number,
        departure_station: order.departure_station,
        arrival_station: order.arrival_station,
        departure_date: order.departure_date,
        departure_time: order.departure_time || '',
        arrival_time: order.arrival_time || '',
        status: order.status,
        total_price: order.total_price,
        created_at: order.created_at,
        passenger_name: passengerNames || '',
        seat_info: seatInfo || '',
        seat_type: seatType || '',
        passengers: passengerDetails
      };
    }));
    
    return ordersWithPassengers;
  } catch (error) {
    console.error('搜索订单失败:', error);
    throw error;
  }
}

module.exports = {
  getUserInfo,
  updateUserEmail,
  updateUserPhone,
  updateUserDiscountType,
  getUserOrders,
  searchOrders
};


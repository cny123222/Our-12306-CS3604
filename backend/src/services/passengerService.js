const crypto = require('crypto');
const db = require('../database');

// 生成UUID v4
function uuidv4() {
  return crypto.randomUUID();
}

/**
 * 乘客服务
 */

/**
 * 证件号码脱敏
 * 保留前4位和后3位，中间用星号替换
 */
function maskIdNumber(idNumber) {
  if (!idNumber || idNumber.length < 8) return idNumber;
  const length = idNumber.length;
  if (length === 18) {
    // 18位身份证：保留前4位和后3位
    return idNumber.substring(0, 4) + '***********' + idNumber.substring(length - 3);
  }
  // 其他证件：保留前4位和后3位
  return idNumber.substring(0, 4) + '*'.repeat(length - 7) + idNumber.substring(length - 3);
}

/**
 * 获取用户的所有乘客列表
 */
async function getUserPassengers(userId) {
  try {
    // 首先获取当前用户的身份证号码
    const userRows = await db.query(
      'SELECT id_card_number FROM users WHERE id = ?',
      [userId]
    );
    const userIdCardNumber = userRows[0]?.id_card_number || '';
    
    const rows = await db.query(
      'SELECT * FROM passengers WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    // 证件号码脱敏，并标记是否是自己
    const passengers = rows.map(p => ({
      id: p.id,
      name: p.name,
      idCardType: p.id_card_type,
      idCardNumber: maskIdNumber(p.id_card_number),
      discountType: p.discount_type,
      phone: p.phone || '',
      points: p.points || 0,
      isSelf: p.id_card_number === userIdCardNumber  // 标记是否是本人
    }));
    
    return passengers;
  } catch (err) {
    console.error('获取乘客列表失败:', err);
    const error = new Error('获取乘客列表失败');
    error.status = 500;
    throw error;
  }
}

/**
 * 搜索乘客
 */
async function searchPassengers(userId, keyword) {
  // 如果关键词为空，返回所有乘客
  if (!keyword || keyword.trim() === '') {
    return getUserPassengers(userId);
  }
  
  try {
    // 首先获取当前用户的身份证号码
    const userRows = await db.query(
      'SELECT id_card_number FROM users WHERE id = ?',
      [userId]
    );
    const userIdCardNumber = userRows[0]?.id_card_number || '';
    
    const searchPattern = `%${keyword}%`;
    
    const rows = await db.query(
      'SELECT * FROM passengers WHERE user_id = ? AND name LIKE ? ORDER BY name',
      [userId, searchPattern]
    );
    
    // 证件号码脱敏，并标记是否是自己
    const passengers = rows.map(p => ({
      id: p.id,
      name: p.name,
      idCardType: p.id_card_type,
      idCardNumber: maskIdNumber(p.id_card_number),
      discountType: p.discount_type,
      phone: p.phone || '',
      points: p.points || 0,
      isSelf: p.id_card_number === userIdCardNumber  // 标记是否是本人
    }));
    
    return passengers;
  } catch (err) {
    console.error('搜索乘客失败:', err);
    const error = new Error('搜索失败');
    error.status = 500;
    throw error;
  }
}

/**
 * 获取乘客详细信息
 */
async function getPassengerDetails(userId, passengerId) {
  try {
    const rows = await db.query(
      'SELECT * FROM passengers WHERE id = ? AND user_id = ?',
      [passengerId, userId]
    );
    
    const row = rows[0];
    
    if (!row) {
      const error = new Error('乘客不存在');
      error.status = 404;
      throw error;
    }
    
    // 类型转换：确保两者都是字符串进行比较
    if (String(row.user_id) !== String(userId)) {
      const error = new Error('无权访问此乘客信息');
      error.status = 403;
      throw error;
    }
    
    return {
      id: row.id,
      name: row.name,
      idCardType: row.id_card_type,
      idCardNumber: maskIdNumber(row.id_card_number),
      discountType: row.discount_type,
      phone: row.phone || '',
      points: row.points || 0
    };
  } catch (err) {
    if (err.status) throw err;
    console.error('获取乘客详情失败:', err);
    const error = new Error('获取乘客详情失败');
    error.status = 500;
    throw error;
  }
}

/**
 * 获取乘客积分
 */
async function getPassengerPoints(passengerId) {
  try {
    const rows = await db.query(
      'SELECT points FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    const row = rows[0];
    return row ? (row.points || 0) : 0;
  } catch (err) {
    console.error('获取乘客积分失败:', err);
    const error = new Error('获取乘客积分失败');
    error.status = 500;
    throw error;
  }
}

/**
 * 验证姓名长度
 * 1个汉字算2个字符
 */
function validateNameLength(name) {
  if (!name || name.trim() === '') {
    return false;
  }
  // 计算字符长度（汉字算2个字符）
  let length = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charAt(i);
    // 判断是否为汉字
    if (char.match(/[\u4e00-\u9fa5]/)) {
      length += 2;
    } else {
      length += 1;
    }
  }
  return length >= 3 && length <= 30;
}

/**
 * 验证证件号码格式
 */
function validateIdCardNumber(idCardNumber, idCardType) {
  if (!idCardNumber) return false;
  
  if (idCardType === '居民身份证') {
    // 18位身份证号验证
    if (idCardNumber.length !== 18) {
      return false;
    }
    // 只能包含数字和字母
    if (!/^[0-9X]+$/i.test(idCardNumber)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 创建乘客
 */
async function createPassenger(userId, passengerData) {
  const { name, idCardType, idCardNumber, discountType, phone } = passengerData;
  
  // 验证姓名长度
  if (!validateNameLength(name)) {
    const error = new Error('姓名长度不符合要求');
    error.status = 400;
    throw error;
  }
  
  // 验证证件号码格式
  if (!validateIdCardNumber(idCardNumber, idCardType)) {
    const error = new Error('证件号码格式错误');
    error.status = 400;
    throw error;
  }
  
  try {
    // 验证证件号码唯一性（同一用户下证件号不能重复）
    const existingRows = await db.query(
      'SELECT id FROM passengers WHERE user_id = ? AND id_card_number = ?',
      [userId, idCardNumber]
    );
    
    if (existingRows.length > 0) {
      const error = new Error('该乘客已存在');
      error.status = 409;
      throw error;
    }
    
    const passengerId = uuidv4();
    
    // 创建乘客记录
    await db.run(
      `INSERT INTO passengers (id, user_id, name, id_card_type, id_card_number, discount_type, phone, points, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
      [passengerId, userId, name, idCardType, idCardNumber, discountType || '成人票', phone || '']
    );
    
    return { 
      message: '添加乘客成功', 
      passengerId,
      points: 0
    };
  } catch (err) {
    if (err.status) throw err;
    console.error('创建乘客失败:', err);
    if (err.code === 'SQLITE_CONSTRAINT' || err.code === 'ER_DUP_ENTRY') {
      const error = new Error('该乘客已存在');
      error.status = 409;
      throw error;
    }
    const error = new Error('添加乘客失败');
    error.status = 500;
    throw error;
  }
}

/**
 * 更新乘客信息
 * 注意：只允许更新 phone 和 discountType 字段
 * 姓名、证件类型、证件号码等基本信息不允许修改
 */
async function updatePassenger(userId, passengerId, updateData) {
  console.log('📝 收到更新乘客请求:', { userId, passengerId, updateData });
  
  const { discountType, phone } = updateData;
  
  // 验证优惠类型
  const validDiscountTypes = ['成人', '儿童', '学生', '残疾军人'];
  if (discountType && !validDiscountTypes.includes(discountType)) {
    const error = new Error(`优惠类型无效，必须是以下之一：${validDiscountTypes.join('、')}`);
    error.status = 400;
    throw error;
  }
  
  // 验证手机号格式（可选）
  if (phone && phone.trim() !== '') {
    if (!/^\d{11}$/.test(phone)) {
      const error = new Error('手机号码格式错误，必须是11位数字');
      error.status = 400;
      throw error;
    }
  }
  
  try {
    // 先检查乘客是否存在且属于当前用户
    const rows = await db.query(
      'SELECT * FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    const passenger = rows[0];
    
    if (!passenger) {
      const error = new Error('乘客不存在');
      error.status = 404;
      throw error;
    }
    
    // 类型转换：确保两者都是字符串或数字进行比较
    const passengerUserId = String(passenger.user_id);
    const requestUserId = String(userId);
    
    console.log('🔐 权限检查:', { 
      passengerUserId, 
      requestUserId, 
      match: passengerUserId === requestUserId 
    });
    
    if (passengerUserId !== requestUserId) {
      const error = new Error('无权修改此乘客信息');
      error.status = 403;
      throw error;
    }
    
    console.log('📊 更新前数据:', { 
      oldPhone: passenger.phone, 
      oldDiscountType: passenger.discount_type,
      newPhone: phone,
      newDiscountType: discountType
    });
    
    // 只更新允许修改的字段：phone 和 discountType
    const result = await db.run(
      `UPDATE passengers 
       SET discount_type = ?, phone = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [discountType, phone || '', passengerId, userId]
    );
    
    console.log('✅ 乘客信息更新成功:', { 
      passengerId, 
      userId, 
      discountType, 
      phone: phone ? '***' + phone.slice(-4) : '',
      changes: result.changes 
    });
    
    return { 
      message: '更新乘客信息成功',
      passengerId
    };
  } catch (err) {
    if (err.status) throw err;
    console.error('❌ 更新乘客失败:', err);
    const error = new Error('更新乘客失败: ' + err.message);
    error.status = 500;
    throw error;
  }
}

/**
 * 删除乘客
 */
async function deletePassenger(userId, passengerId) {
  try {
    // 先检查乘客是否存在且属于当前用户
    const passengerRows = await db.query(
      'SELECT * FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    const passenger = passengerRows[0];
    
    console.log('删除乘客 - 检查权限:', {
      passengerId,
      requestUserId: userId,
      requestUserIdType: typeof userId,
      passengerUserId: passenger?.user_id,
      passengerUserIdType: typeof passenger?.user_id,
      exists: !!passenger
    });
    
    if (!passenger) {
      const error = new Error('乘客不存在');
      error.status = 404;
      throw error;
    }
    
    // 将两个值都转换为字符串进行比较，避免类型不匹配
    const passengerUserIdStr = String(passenger.user_id);
    const userIdStr = String(userId);
    
    console.log('删除乘客 - 字符串比较:', {
      passengerUserIdStr,
      userIdStr,
      match: passengerUserIdStr === userIdStr
    });
    
    if (passengerUserIdStr !== userIdStr) {
      const error = new Error('无权删除此乘客');
      error.status = 403;
      throw error;
    }
    
    // 检查该乘客是否有未完成的订单
    const orderRows = await db.query(
      `SELECT od.* FROM order_details od
       JOIN orders o ON od.order_id = o.id
       WHERE od.passenger_id = ? AND o.status IN ('pending', 'processing', 'confirmed')
       LIMIT 1`,
      [passengerId]
    );
    
    const order = orderRows[0];
    
    if (order) {
      const error = new Error('该乘客有未完成的订单，无法删除');
      error.status = 400;
      throw error;
    }
    
    // 删除乘客
    await db.run(
      'DELETE FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    console.log('删除乘客成功:', { passengerId, userId });
    
    return { message: '删除乘客成功' };
  } catch (err) {
    if (err.status) throw err;
    console.error('删除乘客失败:', err);
    const error = new Error('删除乘客失败');
    error.status = 500;
    throw error;
  }
}

module.exports = {
  getUserPassengers,
  searchPassengers,
  getPassengerDetails,
  getPassengerPoints,
  createPassenger,
  updatePassenger,
  deletePassenger,
  maskIdNumber
};

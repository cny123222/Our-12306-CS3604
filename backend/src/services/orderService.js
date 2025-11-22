const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// 生成UUID v4
function uuidv4() {
  return crypto.randomUUID();
}

// 创建数据库连接
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
    : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
  
  return new sqlite3.Database(dbPath);
}

/**
 * 订单服务
 */

/**
 * 计算跨区间票价
 * 当用户选择的出发站和到达站不是相邻站点时，需要累加途经所有区间的票价
 */
async function calculateCrossIntervalFare(trainNo, departureStation, arrivalStation) {
  console.log('calculateCrossIntervalFare called with:', { trainNo, departureStation, arrivalStation });
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 步骤1: 查询该车次的所有停靠站（按顺序）
    db.all(
      'SELECT station, seq FROM train_stops WHERE train_no = ? ORDER BY seq',
      [trainNo],
      (err, stops) => {
        if (err) {
          db.close();
          return reject({ status: 500, message: '查询停靠站失败' });
        }
        
        if (!stops || stops.length === 0) {
          db.close();
          return reject({ status: 404, message: '未找到该车次的停靠站信息' });
        }
        
        // 步骤2: 找到出发站和到达站的序号
        const depIndex = stops.findIndex(s => s.station === departureStation);
        const arrIndex = stops.findIndex(s => s.station === arrivalStation);
        
        console.log('Found stops:', stops.map(s => s.station));
        console.log('depIndex:', depIndex, 'arrIndex:', arrIndex);
        
        if (depIndex === -1 || arrIndex === -1) {
          db.close();
          const errorMsg = depIndex === -1 ? `出发站"${departureStation}"不在该车次的停靠站中` : `到达站"${arrivalStation}"不在该车次的停靠站中`;
          console.error('Station not found:', errorMsg);
          return reject({ status: 400, message: errorMsg });
        }
        
        if (depIndex >= arrIndex) {
          db.close();
          console.error('Departure index >= arrival index:', { depIndex, arrIndex });
          return reject({ status: 400, message: '出发站必须在到达站之前' });
        }
        
        // 步骤3: 提取途经的所有相邻区间
        const intervals = [];
        for (let i = depIndex; i < arrIndex; i++) {
          intervals.push({
            from: stops[i].station,
            to: stops[i + 1].station
          });
        }
        console.log('Intervals:', intervals);
        
        // 步骤4: 查询每个区间的票价并累加
        let totalDistance = 0;
        const fareTypes = {
          second_class_price: 0,
          first_class_price: 0,
          business_price: 0,
          hard_sleeper_price: 0,
          soft_sleeper_price: 0
        };
        let completedQueries = 0;
        let hasError = false;
        
        intervals.forEach(interval => {
          db.get(
            `SELECT distance_km, second_class_price, first_class_price, business_price,
                    hard_sleeper_price, soft_sleeper_price
             FROM train_fares
             WHERE train_no = ? AND from_station = ? AND to_station = ?`,
            [trainNo, interval.from, interval.to],
            (err, fareRow) => {
              if (err || !fareRow) {
                if (!hasError) {
                  hasError = true;
                  db.close();
                  return reject({ 
                    status: 404, 
                    message: `未找到区间 ${interval.from}->${interval.to} 的票价信息` 
                  });
                }
                return;
              }
              
              // 累加各类型票价
              totalDistance += fareRow.distance_km || 0;
              Object.keys(fareTypes).forEach(key => {
                if (fareRow[key]) {
                  fareTypes[key] += fareRow[key];
                }
              });
              
              completedQueries++;
              
              // 所有区间查询完成
              if (completedQueries === intervals.length && !hasError) {
                db.close();
                resolve({
                  distance_km: totalDistance,
                  ...fareTypes
                });
              }
            }
          );
        });
      }
    );
  });
}

/**
 * 获取订单填写页面数据
 */
async function getOrderPageData(params) {
  const { trainNo, departureStation, arrivalStation, departureDate, userId } = params;
  
  // 验证参数
  if (!trainNo || !departureStation || !arrivalStation || !departureDate) {
    throw { status: 400, message: '参数错误' };
  }
  
  // TODO: 获取车次信息、票价、余票、乘客列表、默认席别
  return {
    trainInfo: {},
    fareInfo: {},
    availableSeats: {},
    passengers: [],
    defaultSeatType: '二等座'
  };
}

/**
 * 获取默认席别
 * G/C/D字头车次默认二等座
 */
async function getDefaultSeatType(trainNo) {
  const firstChar = trainNo.charAt(0);
  
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 查询车次信息
    db.get(
      'SELECT * FROM trains WHERE train_no = ?',
      [trainNo],
      (err, train) => {
        if (err) {
          db.close();
          return reject({ status: 500, message: '数据库查询失败' });
        }
        
        if (!train) {
          db.close();
          return reject({ status: 404, message: '车次不存在' });
        }
        
        // 根据车次类型确定默认席别
        let defaultSeatType = '硬座';
        if (firstChar === 'G' || firstChar === 'C' || firstChar === 'D') {
          defaultSeatType = '二等座';
        }
        
        // 由于不需要特定票价（会根据具体区间查询），直接返回席别类型
        db.close();
        resolve({
          seatType: defaultSeatType,
          price: 0  // 价格需要根据具体区间查询
        });
      }
    );
  });
}

/**
 * 获取有票席别列表
 * 支持跨区间票价计算
 */
async function getAvailableSeatTypes(params) {
  const { trainNo, departureStation, arrivalStation, departureDate } = params;
  
  return new Promise(async (resolve, reject) => {
    try {
      // 步骤1: 计算跨区间票价（自动累加途经区间）
      const fareData = await calculateCrossIntervalFare(trainNo, departureStation, arrivalStation);
      
      // 步骤2: 使用 trainService 的 calculateAvailableSeats 获取正确的余票数量
      // 这个函数会正确处理跨区间场景，检查所有中间站点
      const trainService = require('./trainService');
      const availableSeats = await trainService.calculateAvailableSeats(
        trainNo,
        departureStation,
        arrivalStation,
        departureDate
      );
      
      // 步骤3: 构建席别列表（只返回有票的席别）
      const seatTypeMap = {
        '二等座': fareData.second_class_price,
        '一等座': fareData.first_class_price,
        '商务座': fareData.business_price,
        '硬卧': fareData.hard_sleeper_price,
        '软卧': fareData.soft_sleeper_price
      };
      
      const availableSeatTypes = [];
      
      // 遍历所有席别类型
      for (const [seatType, price] of Object.entries(seatTypeMap)) {
        // 只添加有价格且有余票的席别
        if (price !== null && price !== undefined && price > 0) {
          const available = availableSeats[seatType] || 0;
          if (available > 0) {
            availableSeatTypes.push({
              seat_type: seatType,
              available: available,
              price: price
            });
          }
        }
      }
      
      resolve(availableSeatTypes);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 创建订单
 */
async function createOrder(orderData) {
  const { userId, trainNo, departureStation, arrivalStation, departureDate, passengers } = orderData;
  
  // 验证至少选择一名乘客
  if (!passengers || passengers.length === 0) {
    throw { status: 400, message: '请选择乘车人！' };
  }
  
  return new Promise(async (resolve, reject) => {
    const db = getDatabase();
    const orderId = uuidv4();
    
    try {
      // 查询车次信息
      db.get(
        'SELECT * FROM trains WHERE train_no = ? AND departure_date = ?',
        [trainNo, departureDate],
        async (err, train) => {
          if (err) {
            db.close();
            return reject({ status: 500, message: '数据库查询失败' });
          }
          
          if (!train) {
            db.close();
            return reject({ status: 404, message: '车次不存在' });
          }
          
          // 获取票价信息（使用跨区间票价计算）
          try {
            const fareData = await calculateCrossIntervalFare(trainNo, departureStation, arrivalStation);
            
            const fareRow = {
              second_class_price: fareData.second_class_price,
              first_class_price: fareData.first_class_price,
              business_price: fareData.business_price,
              hard_sleeper_price: fareData.hard_sleeper_price,
              soft_sleeper_price: fareData.soft_sleeper_price
            };
            
            // 为每个乘客计算对应席别的价格
            const getPriceForSeatType = (seatType) => {
              if (seatType === '二等座') {
                return fareRow.second_class_price;
              } else if (seatType === '一等座') {
                return fareRow.first_class_price;
              } else if (seatType === '商务座') {
                return fareRow.business_price;
              } else if (seatType === '硬卧') {
                return fareRow.hard_sleeper_price;
              } else if (seatType === '软卧') {
                return fareRow.soft_sleeper_price;
              } else {
                return fareRow.second_class_price; // 默认二等座价格
              }
            };
            
            // 计算总价：累加每个乘客的票价
            let totalPrice = 0;
            for (const p of passengers) {
              const price = getPriceForSeatType(p.seatType);
              if (!price) {
                db.close();
                return reject({ status: 400, message: `席别"${p.seatType}"暂不支持` });
              }
              totalPrice += price;
            }
            
            // 获取乘客信息
            const passengerIds = passengers.map(p => p.passengerId).join("','");
            db.all(
              `SELECT * FROM passengers WHERE id IN ('${passengerIds}')`,
              [],
              (err, passengerRecords) => {
                if (err) {
                  db.close();
                  return reject({ status: 500, message: '查询乘客失败' });
                }
                
                // 验证所有乘客是否都存在
                if (!passengerRecords || passengerRecords.length !== passengers.length) {
                  db.close();
                  return reject({ status: 400, message: '部分乘客信息不存在，请重新选择乘客' });
                }
                
                // 验证每个乘客ID都能找到对应记录
                for (const p of passengers) {
                  const passenger = passengerRecords.find(pr => pr.id === p.passengerId);
                  if (!passenger) {
                    db.close();
                    return reject({ status: 400, message: `乘客${p.passengerId}不存在` });
                  }
                }
                    
                // 创建订单
                db.run(
                  `INSERT INTO orders (id, user_id, train_number, departure_station, arrival_station, 
                   departure_date, departure_time, arrival_time, total_price, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
                  [orderId, String(userId), trainNo, departureStation, arrivalStation, departureDate,
                   train.departure_time, train.arrival_time, totalPrice],
                  (err) => {
                    if (err) {
                      db.close();
                      return reject({ status: 500, message: '创建订单失败' });
                    }
                    
                    // 创建订单明细
                    let detailsInserted = 0;
                    let insertError = null;
                    
                    passengers.forEach((p, index) => {
                      const passenger = passengerRecords.find(pr => pr.id === p.passengerId);
                      // 为每个乘客计算对应席别的价格
                      const passengerPrice = getPriceForSeatType(p.seatType);
                      
                      db.run(
                        `INSERT INTO order_details (order_id, passenger_id, passenger_name, 
                         id_card_type, id_card_number, seat_type, ticket_type, price, sequence_number)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [orderId, p.passengerId, passenger.name, passenger.id_card_type, 
                         passenger.id_card_number, p.seatType, p.ticketType || '成人票', 
                         passengerPrice, index + 1],
                        (err) => {
                          if (err && !insertError) {
                            insertError = err;
                          }
                          
                          detailsInserted++;
                          
                          if (detailsInserted === passengers.length) {
                            db.close();
                            
                            if (insertError) {
                              return reject({ status: 500, message: '创建订单明细失败' });
                            }
                            
                            resolve({
                              message: '订单提交成功',
                              orderId,
                              orderDetails: {
                                trainInfo: {
                                  trainNo,
                                  departureStation,
                                  arrivalStation,
                                  departureDate
                                },
                                passengers,
                                totalPrice
                              }
                            });
                          }
                        }
                      );
                    });
                  }
                );
              }
            );
          } catch (fareError) {
            db.close();
            return reject(fareError);
          }
        }
      );
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * 获取订单详细信息
 */
async function getOrderDetails(orderId, userId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 查询订单基本信息
    db.get(
      'SELECT * FROM orders WHERE id = ?',
      [orderId],
      (err, order) => {
        if (err) {
          db.close();
          return reject({ status: 500, message: '数据库查询失败' });
        }
        
        if (!order) {
          db.close();
          return reject({ status: 404, message: '订单不存在' });
        }
        
        // 调试日志：检查userId匹配
        console.log('🔍 订单权限检查:', {
          orderId,
          order_user_id: order.user_id,
          order_user_id_type: typeof order.user_id,
          requested_userId: userId,
          requested_userId_type: typeof userId,
          match: order.user_id === userId,
          string_match: String(order.user_id) === String(userId)
        });
        
        // 兼容userId的类型差异（字符串 vs 数字）
        if (String(order.user_id) !== String(userId)) {
          db.close();
          return reject({ status: 403, message: '无权访问此订单' });
        }
        
        // 查询订单明细
        db.all(
          'SELECT * FROM order_details WHERE order_id = ?',
          [orderId],
          (err, details) => {
            if (err) {
              db.close();
              return reject({ status: 500, message: '查询订单明细失败' });
            }
            
            // 获取乘客积分
            const passengerIds = details.map(d => d.passenger_id);
            db.all(
              `SELECT id, points FROM passengers WHERE id IN ('${passengerIds.join("','")}')`,
              [],
              (err, passengerPoints) => {
                db.close();
                
                if (err) {
                  return reject({ status: 500, message: '查询乘客积分失败' });
                }
                
                const passengers = details.map(d => {
                  const points = passengerPoints.find(p => p.id === d.passenger_id);
                  return {
                    sequence: d.sequence_number,
                    seatType: d.seat_type,
                    ticketType: d.ticket_type,
                    name: d.passenger_name,
                    idCardType: d.id_card_type,
                    idCardNumber: d.id_card_number,
                    carNumber: d.car_number,
                    seatNumber: d.seat_number,
                    price: d.price,
                    points: points ? points.points : 0
                  };
                });
                
                // 获取实时余票信息
                const trainService = require('./trainService');
                trainService.calculateAvailableSeats(
                  order.train_number,
                  order.departure_station,
                  order.arrival_station,
                  order.departure_date
                ).then(availableSeats => {
                  resolve({
                    trainInfo: {
                      trainNo: order.train_number,
                      departureStation: order.departure_station,
                      arrivalStation: order.arrival_station,
                      departureDate: order.departure_date,
                      departureTime: order.departure_time,
                      arrivalTime: order.arrival_time
                    },
                    passengers,
                    availableSeats,
                    totalPrice: order.total_price
                  });
                }).catch(err => {
                  // 如果获取余票信息失败，返回空对象
                  console.error('获取余票信息失败:', err);
                  resolve({
                    trainInfo: {
                      trainNo: order.train_number,
                      departureStation: order.departure_station,
                      arrivalStation: order.arrival_station,
                      departureDate: order.departure_date,
                      departureTime: order.departure_time,
                      arrivalTime: order.arrival_time
                    },
                    passengers,
                    availableSeats: {},
                    totalPrice: order.total_price
                  });
                });
              }
            );
          }
        );
      }
    );
  });
}

/**
 * 确认订单
 * 分配座位并更新座位状态为已预定
 */
async function confirmOrder(orderId, userId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 查询订单基本信息
    db.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)],
      (err, order) => {
        if (err) {
          db.close();
          return reject({ status: 500, message: '数据库查询失败' });
        }
        
        if (!order) {
          db.close();
          return reject({ status: 404, message: '订单不存在' });
        }
        
        if (order.status !== 'pending') {
          db.close();
          return reject({ status: 400, message: '订单状态错误' });
        }
        
        // 检查当日取消订单次数
        const today = new Date().toISOString().split('T')[0];
        db.get(
          `SELECT COUNT(*) as count FROM order_cancellations 
           WHERE user_id = ? AND cancellation_date = ?`,
          [String(userId), today],
          (err, result) => {
            if (err) {
              db.close();
              return reject({ status: 500, message: '查询取消记录失败' });
            }
            
            if (result && result.count >= 3) {
              db.close();
              return reject({ 
                status: 403, 
                message: '今日取消订单次数已达上限',
                code: 'CANCELLATION_LIMIT_EXCEEDED'
              });
            }
            
            // 查询订单明细
            db.all(
              'SELECT * FROM order_details WHERE order_id = ?',
              [orderId],
              async (err, details) => {
            if (err) {
              db.close();
              return reject({ status: 500, message: '查询订单明细失败' });
            }
            
            if (!details || details.length === 0) {
              db.close();
              return reject({ status: 400, message: '订单明细为空' });
            }
            
            try {
              // 为每个乘客分配座位
              const ticketInfo = [];
              
              for (const detail of details) {
                // 首先获取出发站和到达站之间的所有区间
                const stops = await new Promise((resolve, reject) => {
                  db.all(
                    `SELECT station FROM train_stops 
                     WHERE train_no = ? 
                     AND seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
                     AND seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
                     ORDER BY seq`,
                    [order.train_number, order.train_number, order.departure_station, 
                     order.train_number, order.arrival_station],
                    (err, stops) => {
                      if (err) return reject(err);
                      resolve(stops);
                    }
                  );
                });
                
                // 构建所有区间
                const segments = [];
                for (let i = 0; i < stops.length - 1; i++) {
                  segments.push({
                    from: stops[i].station,
                    to: stops[i + 1].station
                  });
                }
                
                // 获取该席别的所有座位，然后找到在所有区间都是available的座位
                const allSeats = await new Promise((resolve, reject) => {
                  db.all(
                    `SELECT DISTINCT car_no, seat_no 
                     FROM seat_status 
                     WHERE train_no = ? 
                     AND departure_date = ?
                     AND seat_type = ?`,
                    [order.train_number, order.departure_date, detail.seat_type],
                    (err, seats) => {
                      if (err) return reject(err);
                      resolve(seats);
                    }
                  );
                });
                
                if (!allSeats || allSeats.length === 0) {
                  db.close();
                  return reject({ status: 400, message: `${detail.seat_type}座位不存在` });
                }
                
                // 找到第一个在所有区间都是available的座位
                let selectedSeatNo = null;
                let selectedCarNo = null;
                
                for (const seat of allSeats) {
                  // 检查该座位在所有区间是否都是available
                  const segmentConditions = segments.map(() => 
                    '(from_station = ? AND to_station = ?)'
                  ).join(' OR ');
                  
                  const segmentParams = segments.flatMap(s => [s.from, s.to]);
                  
                  const seatStatuses = await new Promise((resolve, reject) => {
                    db.all(
                      `SELECT status 
                       FROM seat_status 
                       WHERE train_no = ? 
                       AND departure_date = ?
                       AND seat_type = ? 
                       AND seat_no = ? 
                       AND (${segmentConditions})`,
                      [order.train_number, order.departure_date, detail.seat_type, seat.seat_no, ...segmentParams],
                      (err, statuses) => {
                        if (err) return reject(err);
                        resolve(statuses);
                      }
                    );
                  });
                  
                  // 检查是否所有区间都是available
                  if (seatStatuses.length === segments.length) {
                    const allAvailable = seatStatuses.every(s => s.status === 'available');
                    if (allAvailable) {
                      selectedSeatNo = seat.seat_no;
                      selectedCarNo = seat.car_no;
                      break;
                    }
                  }
                }
                
                if (!selectedSeatNo) {
                  db.close();
                  return reject({ status: 400, message: `${detail.seat_type}座位已售罄` });
                }
                
                // 更新所有区间的座位状态为已预定
                for (const segment of segments) {
                  await new Promise((resolve, reject) => {
                    db.run(
                      `UPDATE seat_status 
                       SET status = 'booked', booked_by = ?, booked_at = datetime('now')
                       WHERE train_no = ? 
                       AND departure_date = ?
                       AND seat_type = ? 
                       AND seat_no = ? 
                       AND from_station = ? 
                       AND to_station = ?`,
                      [String(userId), order.train_number, order.departure_date, detail.seat_type, selectedSeatNo, segment.from, segment.to],
                      (err) => {
                        if (err) return reject(err);
                        resolve(true);
                      }
                    );
                  });
                }
                
                // 更新订单明细中的车厢号和座位号
                await new Promise((resolve, reject) => {
                  db.run(
                    'UPDATE order_details SET car_number = ?, seat_number = ? WHERE id = ?',
                    [selectedCarNo, selectedSeatNo, detail.id],
                    (err) => {
                      if (err) return reject(err);
                      resolve(true);
                    }
                  );
                });
                
                ticketInfo.push({
                  passengerName: detail.passenger_name,
                  seatType: detail.seat_type,
                  carNo: selectedCarNo,
                  seatNo: selectedSeatNo,
                  ticketType: detail.ticket_type
                });
              }
              
              // 计算支付过期时间（20分钟后）
              // 使用 SQLite 的 datetime 函数来确保时间格式一致性
              db.run(
                "UPDATE orders SET status = 'confirmed_unpaid', payment_expires_at = datetime('now', '+20 minutes'), updated_at = datetime('now') WHERE id = ?",
                [orderId],
                (err) => {
                  if (err) {
                    db.close();
                    return reject({ status: 500, message: '更新订单状态失败' });
                  }
                  
                  // 查询更新后的订单信息以获取 payment_expires_at
                  db.get(
                    'SELECT payment_expires_at FROM orders WHERE id = ?',
                    [orderId],
                    (err, orderInfo) => {
                      db.close();
                      
                      if (err) {
                        return reject({ status: 500, message: '查询订单信息失败' });
                      }
                      
                      resolve({
                        message: '订单已确认，请完成支付',
                        orderId,
                        status: 'confirmed_unpaid',
                        paymentExpiresAt: orderInfo?.payment_expires_at,
                        trainInfo: {
                          trainNo: order.train_number,
                          departureStation: order.departure_station,
                          arrivalStation: order.arrival_station,
                          departureDate: order.departure_date,
                          departureTime: order.departure_time,
                          arrivalTime: order.arrival_time
                        },
                        tickets: ticketInfo
                      });
                    }
                  );
                }
              );
            } catch (error) {
              db.close();
              return reject({ status: 500, message: error.message || '座位分配失败' });
            }
          }
        );
          }
        );
      }
    );
  });
}

/**
 * 更新订单状态
 */
async function updateOrderStatus(orderId, status) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.run(
      "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, orderId],
      function(err) {
        db.close();
        
        if (err) {
          return reject({ status: 500, message: '更新订单状态失败' });
        }
        
        if (this.changes === 0) {
          return reject({ status: 404, message: '订单不存在' });
        }
        
        resolve({ success: true });
      }
    );
  });
}

/**
 * 锁定座位
 */
async function lockSeats(orderId, passengers, trainNo, departureDate) {
  // TODO: 实现座位锁定逻辑
  return Promise.resolve([]);
}


/**
 * 确认座位分配
 */
async function confirmSeatAllocation(orderId) {
  // TODO: 实现座位分配确认逻辑
  return Promise.resolve({ success: true });
}

/**
 * 计算订单总价
 * 支持跨区间票价计算
 */
async function calculateOrderTotalPrice(passengers, trainNo, departureStation, arrivalStation) {
  try {
    // 使用跨区间票价计算
    const fareData = await calculateCrossIntervalFare(trainNo, departureStation, arrivalStation);
    
    let totalPrice = 0;
    
    passengers.forEach(p => {
      let price = 0;
      if (p.seatType === '二等座') {
        price = fareData.second_class_price;
      } else if (p.seatType === '一等座') {
        price = fareData.first_class_price;
      } else if (p.seatType === '商务座') {
        price = fareData.business_price;
      } else if (p.seatType === '硬卧') {
        price = fareData.hard_sleeper_price;
      } else if (p.seatType === '软卧') {
        price = fareData.soft_sleeper_price;
      } else {
        price = fareData.second_class_price; // 默认二等座价格
      }
      
      totalPrice += price;
    });
    
    return totalPrice;
  } catch (error) {
    throw error;
  }
}

/**
 * 获取支付页面数据
 */
async function getPaymentPageData(orderId, userId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 查询订单基本信息
    db.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)],
      (err, order) => {
        if (err) {
          db.close();
          return reject({ status: 500, message: '数据库查询失败' });
        }
        
        if (!order) {
          db.close();
          return reject({ status: 404, message: '订单不存在' });
        }
        
        if (order.status !== 'confirmed_unpaid') {
          db.close();
          return reject({ status: 400, message: '订单状态错误，无法支付' });
        }
        
        // 检查订单是否已过期
        // 使用 SQLite 的 datetime 函数进行比较，避免时区问题
        const checkExpiredAndProcess = () => {
          // 查询订单明细
          db.all(
            'SELECT * FROM order_details WHERE order_id = ? ORDER BY sequence_number',
            [orderId],
            (err, details) => {
              db.close();
              
              if (err) {
                return reject({ status: 500, message: '查询订单明细失败' });
              }
              
              // 格式化订单明细
              const passengers = details.map(d => ({
                sequence: d.sequence_number,
                name: d.passenger_name,
                idCardType: d.id_card_type,
                idCardNumber: d.id_card_number,
                ticketType: d.ticket_type,
                seatType: d.seat_type,
                carNumber: d.car_number,
                seatNumber: d.seat_number,
                price: d.price
              }));
              
              resolve({
                orderId: order.id,
                trainInfo: {
                  trainNo: order.train_number,
                  departureStation: order.departure_station,
                  arrivalStation: order.arrival_station,
                  departureDate: order.departure_date,
                  departureTime: order.departure_time,
                  arrivalTime: order.arrival_time
                },
                passengers,
                totalPrice: order.total_price,
                paymentExpiresAt: order.payment_expires_at,
                createdAt: order.created_at
              });
            }
          );
        };
        
        if (order.payment_expires_at) {
          // 使用 SQLite 比较当前时间和过期时间
          db.get(
            "SELECT datetime('now') > ? as is_expired",
            [order.payment_expires_at],
            (err, result) => {
              if (err) {
                db.close();
                return reject({ status: 500, message: '检查订单过期时间失败' });
              }
              
              if (result && result.is_expired === 1) {
                db.close();
                return reject({ status: 400, message: '订单已过期' });
              }
              
              // 未过期，继续处理
              checkExpiredAndProcess();
            }
          );
        } else {
          // 如果没有过期时间，直接继续处理
          checkExpiredAndProcess();
        }
      }
    );
  });
}

/**
 * 确认支付
 */
async function confirmPayment(orderId, userId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 查询订单基本信息
    db.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)],
      (err, order) => {
        if (err) {
          db.close();
          return reject({ status: 500, message: '数据库查询失败' });
        }
        
        if (!order) {
          db.close();
          return reject({ status: 404, message: '订单不存在' });
        }
        
        if (order.status !== 'confirmed_unpaid') {
          db.close();
          return reject({ status: 400, message: '订单状态错误，无法支付' });
        }
        
        // 检查订单是否已过期（使用 SQLite 函数避免时区问题）
        if (order.payment_expires_at) {
          db.get(
            "SELECT datetime('now') > ? as is_expired",
            [order.payment_expires_at],
            (err, result) => {
              if (err) {
                db.close();
                return reject({ status: 500, message: '检查订单过期时间失败' });
              }
              
              if (result && result.is_expired === 1) {
                db.close();
                return reject({ status: 400, message: '订单已过期，请重新购票' });
              }
              
              // 未过期，继续处理支付
              processPayment();
            }
          );
          return; // 等待异步检查完成
        } else {
          // 如果没有过期时间，直接处理支付
          processPayment();
        }
        
        function processPayment() {
        
          // 更新订单状态为已支付
          db.run(
            "UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ?",
            [orderId],
            (err) => {
              if (err) {
                db.close();
                return reject({ status: 500, message: '更新订单状态失败' });
              }
              
              // 查询订单明细获取座位信息
              db.all(
              'SELECT * FROM order_details WHERE order_id = ? ORDER BY sequence_number',
              [orderId],
              (err, details) => {
                db.close();
                
                if (err) {
                  return reject({ status: 500, message: '查询订单明细失败' });
                }
                
                // 生成订单号（EA + 8位数字）
                const orderNumber = 'EA' + orderId.substring(0, 8).toUpperCase().replace(/-/g, '');
                
                resolve({
                  message: '支付成功',
                  orderId: order.id,
                  orderNumber,
                  status: 'paid',
                  trainInfo: {
                    trainNo: order.train_number,
                    departureStation: order.departure_station,
                    arrivalStation: order.arrival_station,
                    departureDate: order.departure_date,
                    departureTime: order.departure_time,
                    arrivalTime: order.arrival_time
                  },
                  passengers: details.map(d => ({
                    name: d.passenger_name,
                    seatType: d.seat_type,
                    carNumber: d.car_number,
                    seatNumber: d.seat_number,
                    ticketType: d.ticket_type,
                    price: d.price
                  })),
                  totalPrice: order.total_price
                });
              }
            );
          }
        );
        }
      }
    );
  });
}

/**
 * 取消订单并记录取消次数
 */
async function cancelOrderWithTracking(orderId, userId) {
  // Step 1: Validate order (use separate connection, then close)
  const order = await new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)],
      (err, order) => {
        db.close();
        
        if (err) {
          return reject({ status: 500, message: '数据库查询失败' });
        }
        
        if (!order) {
          return reject({ status: 404, message: '订单不存在' });
        }
        
        if (order.status !== 'confirmed_unpaid') {
          return reject({ status: 400, message: '只能取消待支付订单' });
        }
        
        resolve(order);
      }
    );
  });
  
  // Step 2: Release seat locks (has its own connection)
  try {
    await releaseSeatLocks(orderId);
  } catch (error) {
    console.error('释放座位锁定失败:', error);
    throw { status: 500, message: error.message || '释放座位失败' };
  }
  
  // Step 3: Record cancellation (use separate connection)
  await new Promise((resolve, reject) => {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    db.run(
      `INSERT INTO order_cancellations (user_id, order_id, cancellation_date, cancelled_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [String(userId), orderId, today],
      (err) => {
        db.close();
        
        if (err) {
          console.error('记录取消次数失败:', err);
          // 不阻止取消流程，继续执行
        }
        resolve(true);
      }
    );
  });
  
  // Step 4: Delete order details and order (use separate connection)
  await new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 删除订单明细
    db.run(
      'DELETE FROM order_details WHERE order_id = ?',
      [orderId],
      (err) => {
        if (err) {
          db.close();
          return reject({ status: 500, message: '删除订单明细失败' });
        }
        
        // 删除订单
        db.run(
          'DELETE FROM orders WHERE id = ?',
          [orderId],
          (err) => {
            db.close();
            
            if (err) {
              return reject({ status: 500, message: '删除订单失败' });
            }
            
            resolve(true);
          }
        );
      }
    );
  });
  
  return { success: true, message: '订单已取消' };
}

/**
 * 检查用户是否有未支付的订单
 */
async function hasUnpaidOrder(userId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 使用 SQLite 的 datetime 函数进行比较，避免时区问题
    db.get(
      `SELECT id FROM orders 
       WHERE user_id = ? 
       AND status = 'confirmed_unpaid' 
       AND (payment_expires_at IS NULL OR datetime('now') <= payment_expires_at)`,
      [String(userId)],
      (err, order) => {
        db.close();
        
        if (err) {
          return reject({ status: 500, message: '查询失败' });
        }
        
        resolve(!!order);
      }
    );
  });
}

/**
 * 获取订单剩余支付时间（秒）
 */
async function getOrderTimeRemaining(orderId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 使用 SQLite 的 julianday 函数计算剩余秒数，避免时区问题
    db.get(
      `SELECT 
        payment_expires_at,
        CASE 
          WHEN payment_expires_at IS NULL THEN 0
          WHEN datetime('now') > payment_expires_at THEN 0
          ELSE CAST((julianday(payment_expires_at) - julianday('now')) * 86400 AS INTEGER)
        END as remaining_seconds
       FROM orders WHERE id = ?`,
      [orderId],
      (err, result) => {
        db.close();
        
        if (err) {
          return reject({ status: 500, message: '查询失败' });
        }
        
        if (!result || !result.payment_expires_at) {
          return resolve(0);
        }
        
        const remaining = Math.max(0, result.remaining_seconds || 0);
        resolve(remaining);
      }
    );
  });
}

/**
 * 释放座位锁定
 */
async function releaseSeatLocks(orderId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 查询订单信息
    db.get(
      'SELECT * FROM orders WHERE id = ?',
      [orderId],
      (err, order) => {
        if (err) {
          db.close();
          return reject({ status: 500, message: '查询订单失败' });
        }
        
        if (!order) {
          db.close();
          return resolve({ success: true });
        }
        
        // 查询订单明细获取座位信息
        db.all(
          'SELECT * FROM order_details WHERE order_id = ?',
          [orderId],
          async (err, details) => {
            if (err) {
              db.close();
              return reject({ status: 500, message: '查询订单明细失败' });
            }
            
            try {
              // 获取出发站和到达站之间的所有区间
              const stops = await new Promise((resolve, reject) => {
                db.all(
                  `SELECT station FROM train_stops 
                   WHERE train_no = ? 
                   AND seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
                   AND seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
                   ORDER BY seq`,
                  [order.train_number, order.train_number, order.departure_station, 
                   order.train_number, order.arrival_station],
                  (err, stops) => {
                    if (err) return reject(err);
                    resolve(stops);
                  }
                );
              });
              
              // 构建所有区间
              const segments = [];
              for (let i = 0; i < stops.length - 1; i++) {
                segments.push({
                  from: stops[i].station,
                  to: stops[i + 1].station
                });
              }
              
              // 释放每个乘客的座位
              for (const detail of details) {
                if (!detail.seat_number) continue;
                
                for (const segment of segments) {
                  await new Promise((resolve, reject) => {
                    db.run(
                      `UPDATE seat_status 
                       SET status = 'available', booked_by = NULL, booked_at = NULL
                       WHERE train_no = ? 
                       AND departure_date = ?
                       AND seat_type = ? 
                       AND seat_no = ? 
                       AND from_station = ? 
                       AND to_station = ?`,
                      [order.train_number, order.departure_date, detail.seat_type, 
                       detail.seat_number, segment.from, segment.to],
                      (err) => {
                        if (err) return reject(err);
                        resolve(true);
                      }
                    );
                  });
                }
              }
              
              db.close();
              resolve({ success: true });
            } catch (error) {
              db.close();
              return reject({ status: 500, message: error.message || '释放座位失败' });
            }
          }
        );
      }
    );
  });
}

module.exports = {
  getOrderPageData,
  getDefaultSeatType,
  getAvailableSeatTypes,
  createOrder,
  getOrderDetails,
  confirmOrder,
  updateOrderStatus,
  lockSeats,
  releaseSeatLocks,
  confirmSeatAllocation,
  calculateOrderTotalPrice,
  getPaymentPageData,
  confirmPayment,
  cancelOrderWithTracking,
  hasUnpaidOrder,
  getOrderTimeRemaining
};

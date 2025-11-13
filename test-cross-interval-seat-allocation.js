/**
 * 跨区间座位分配集成测试
 * 
 * 测试目标：
 * 1. 预订全程车票（上海→北京），验证余票数减少
 * 2. 预订部分区间车票（无锡→南京），验证余票数减少
 * 3. 验证座位状态在数据库中正确更新
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');

const dbPath = path.join(__dirname, 'backend/database/railway.db');
const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = null;
let userId = null;

// 工具函数：获取余票数量
async function getAvailableSeats(trainNo, departureStation, arrivalStation) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    // 获取出发站和到达站的序号
    db.all(
      'SELECT seq, station FROM train_stops WHERE train_no = ? AND (station = ? OR station = ?) ORDER BY seq',
      [trainNo, departureStation, arrivalStation],
      (err, stops) => {
        if (err || stops.length < 2) {
          db.close();
          return resolve({});
        }
        
        const depStop = stops.find(s => s.station === departureStation);
        const arrStop = stops.find(s => s.station === arrivalStation);
        
        if (!depStop || !arrStop || depStop.seq >= arrStop.seq) {
          db.close();
          return resolve({});
        }
        
        // 获取所有途经站点
        db.all(
          'SELECT station FROM train_stops WHERE train_no = ? AND seq >= ? AND seq <= ? ORDER BY seq',
          [trainNo, depStop.seq, arrStop.seq],
          (err, intermediateStops) => {
            if (err) {
              db.close();
              return reject(err);
            }
            
            // 获取所有席别类型
            db.all(
              'SELECT DISTINCT seat_type FROM train_cars WHERE train_no = ? AND seat_type != ?',
              [trainNo, '餐车'],
              (err, seatTypes) => {
                if (err) {
                  db.close();
                  return reject(err);
                }
                
                const result = {};
                let completed = 0;
                
                if (seatTypes.length === 0) {
                  db.close();
                  return resolve({});
                }
                
                // 对每个席别计算余票
                seatTypes.forEach(({ seat_type }) => {
                  if (intermediateStops.length <= 2) {
                    // 相邻两站
                    db.get(
                      `SELECT COUNT(DISTINCT seat_no) as count 
                       FROM seat_status 
                       WHERE train_no = ? 
                       AND seat_type = ? 
                       AND from_station = ? 
                       AND to_station = ? 
                       AND status = 'available'`,
                      [trainNo, seat_type, departureStation, arrivalStation],
                      (err, row) => {
                        result[seat_type] = row ? row.count : 0;
                        completed++;
                        
                        if (completed === seatTypes.length) {
                          db.close();
                          resolve(result);
                        }
                      }
                    );
                  } else {
                    // 非相邻两站
                    db.all(
                      `SELECT DISTINCT seat_no 
                       FROM seat_status 
                       WHERE train_no = ? 
                       AND seat_type = ?`,
                      [trainNo, seat_type],
                      (err, seats) => {
                        if (err || !seats) {
                          result[seat_type] = 0;
                          completed++;
                          
                          if (completed === seatTypes.length) {
                            db.close();
                            resolve(result);
                          }
                          return;
                        }
                        
                        let availableCount = 0;
                        let seatChecked = 0;
                        
                        if (seats.length === 0) {
                          result[seat_type] = 0;
                          completed++;
                          
                          if (completed === seatTypes.length) {
                            db.close();
                            resolve(result);
                          }
                          return;
                        }
                        
                        // 对每个座位检查所有区间是否都available
                        seats.forEach(({ seat_no }) => {
                          const segments = [];
                          for (let i = 0; i < intermediateStops.length - 1; i++) {
                            segments.push({
                              from: intermediateStops[i].station,
                              to: intermediateStops[i + 1].station
                            });
                          }
                          
                          const segmentConditions = segments.map(() => 
                            '(from_station = ? AND to_station = ?)'
                          ).join(' OR ');
                          
                          const segmentParams = segments.flatMap(s => [s.from, s.to]);
                          
                          db.all(
                            `SELECT status 
                             FROM seat_status 
                             WHERE train_no = ? 
                             AND seat_type = ? 
                             AND seat_no = ? 
                             AND (${segmentConditions})`,
                            [trainNo, seat_type, seat_no, ...segmentParams],
                            (err, statuses) => {
                              if (!err && statuses.length === segments.length) {
                                const allAvailable = statuses.every(s => s.status === 'available');
                                if (allAvailable) {
                                  availableCount++;
                                }
                              }
                              
                              seatChecked++;
                              
                              if (seatChecked === seats.length) {
                                result[seat_type] = availableCount;
                                completed++;
                                
                                if (completed === seatTypes.length) {
                                  db.close();
                                  resolve(result);
                                }
                              }
                            }
                          );
                        });
                      }
                    );
                  }
                });
              }
            );
          }
        );
      }
    );
  });
}

// 工具函数：登录
async function login() {
  console.log('\n📋 步骤 0: 登录测试用户...');
  
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier: 'testuser',
      password: 'password123'
    })
  });
  
  if (!response.ok) {
    throw new Error('登录失败');
  }
  
  const data = await response.json();
  authToken = data.token;
  userId = data.userId;
  
  console.log('✅ 登录成功, userId:', userId);
}

// 工具函数：获取乘客列表
async function getPassengers() {
  const response = await fetch(`${API_BASE_URL}/passengers`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error('获取乘客列表失败');
  }
  
  const data = await response.json();
  return data.passengers;
}

// 工具函数：创建订单并确认
async function createAndConfirmOrder(trainNo, departureStation, arrivalStation, departureDate, seatType) {
  // 获取乘客列表
  const passengers = await getPassengers();
  if (passengers.length === 0) {
    throw new Error('没有可用的乘客');
  }
  
  const passenger = passengers[0];
  
  // 创建订单
  console.log(`\n📋 创建订单: ${trainNo} ${departureStation}→${arrivalStation}, 席别: ${seatType}`);
  
  const createResponse = await fetch(`${API_BASE_URL}/orders/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      trainNo,
      departureStation,
      arrivalStation,
      departureDate,
      passengers: [
        {
          passengerId: passenger.id,
          seatType,
          ticketType: '成人票'
        }
      ]
    })
  });
  
  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`创建订单失败: ${error.error || error.message}`);
  }
  
  const orderData = await createResponse.json();
  const orderId = orderData.orderId;
  console.log('✅ 订单创建成功, orderId:', orderId);
  
  // 确认订单
  console.log(`📋 确认订单: ${orderId}`);
  
  const confirmResponse = await fetch(`${API_BASE_URL}/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!confirmResponse.ok) {
    const error = await confirmResponse.json();
    throw new Error(`确认订单失败: ${error.error || error.message}`);
  }
  
  const confirmData = await confirmResponse.json();
  console.log('✅ 订单确认成功, 座位号:', confirmData.tickets.map(t => t.seatNo).join(', '));
  
  return confirmData;
}

// 主测试流程
async function runTests() {
  try {
    console.log('🚀 开始跨区间座位分配集成测试');
    console.log('=' .repeat(80));
    
    // 登录
    await login();
    
    // 测试 1: 全程订单（上海→北京）
    console.log('\n' + '='.repeat(80));
    console.log('📝 测试 1: 全程订单（上海→北京）');
    console.log('='.repeat(80));
    
    const beforeFullTrip = await getAvailableSeats('D6', '上海', '北京');
    console.log('预订前余票:', beforeFullTrip);
    
    await createAndConfirmOrder('D6', '上海', '北京', '2025-11-15', '二等座');
    
    const afterFullTrip = await getAvailableSeats('D6', '上海', '北京');
    console.log('预订后余票:', afterFullTrip);
    
    if (afterFullTrip['二等座'] === beforeFullTrip['二等座'] - 1) {
      console.log('✅ 测试 1 通过: 全程订单余票数正确减少 1');
    } else {
      console.log('❌ 测试 1 失败: 余票数变化不正确');
      console.log(`   期望: ${beforeFullTrip['二等座'] - 1}, 实际: ${afterFullTrip['二等座']}`);
    }
    
    // 测试 2: 部分区间订单（无锡→南京）
    console.log('\n' + '='.repeat(80));
    console.log('📝 测试 2: 部分区间订单（无锡→南京）');
    console.log('='.repeat(80));
    
    const beforePartialTrip = await getAvailableSeats('D6', '无锡', '南京');
    console.log('预订前余票:', beforePartialTrip);
    
    await createAndConfirmOrder('D6', '无锡', '南京', '2025-11-15', '二等座');
    
    const afterPartialTrip = await getAvailableSeats('D6', '无锡', '南京');
    console.log('预订后余票:', afterPartialTrip);
    
    if (afterPartialTrip['二等座'] === beforePartialTrip['二等座'] - 1) {
      console.log('✅ 测试 2 通过: 部分区间订单余票数正确减少 1');
    } else {
      console.log('❌ 测试 2 失败: 余票数变化不正确');
      console.log(`   期望: ${beforePartialTrip['二等座'] - 1}, 实际: ${afterPartialTrip['二等座']}`);
    }
    
    // 测试 3: 另一个部分区间订单（徐州→济南）
    console.log('\n' + '='.repeat(80));
    console.log('📝 测试 3: 部分区间订单（徐州→济南）');
    console.log('='.repeat(80));
    
    const beforePartialTrip2 = await getAvailableSeats('D6', '徐州', '济南');
    console.log('预订前余票:', beforePartialTrip2);
    
    await createAndConfirmOrder('D6', '徐州', '济南', '2025-11-15', '二等座');
    
    const afterPartialTrip2 = await getAvailableSeats('D6', '徐州', '济南');
    console.log('预订后余票:', afterPartialTrip2);
    
    if (afterPartialTrip2['二等座'] === beforePartialTrip2['二等座'] - 1) {
      console.log('✅ 测试 3 通过: 部分区间订单余票数正确减少 1');
    } else {
      console.log('❌ 测试 3 失败: 余票数变化不正确');
      console.log(`   期望: ${beforePartialTrip2['二等座'] - 1}, 实际: ${afterPartialTrip2['二等座']}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 测试完成！');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('测试执行失败:', err);
      process.exit(1);
    });
}

module.exports = { runTests, getAvailableSeats };


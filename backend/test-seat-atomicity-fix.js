/**
 * 测试座位预定原子性修复
 * 
 * 测试场景：
 * 1. 确保商务座只剩1张票
 * 2. 尝试为2个乘客购买2张商务座票
 * 3. 验证订单确认失败
 * 4. 验证余票数仍然是1张（没有被错误地标记为已预定）
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/railway.db');

// 测试配置
const TEST_CONFIG = {
  trainNo: 'G16',
  departureStation: '上海虹桥',
  arrivalStation: '北京南',
  departureDate: new Date().toISOString().split('T')[0], // 今天
  seatType: '商务座'
};

// 测试用户
const TEST_USER = {
  username: 'testuser_atomicity',
  password: 'Test123456',
  realName: '测试用户',
  idCard: '110101199001011234',
  phone: '13800138000',
  email: 'testuser@test.com'
};

let authToken = null;
let testUserId = null;
let passengerIds = [];

/**
 * 创建测试用户
 */
async function createTestUser() {
  console.log('\n📝 创建测试用户...');
  
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('✅ 测试用户创建成功');
    return data;
  } else if (response.status === 400) {
    console.log('ℹ️  测试用户已存在，将直接登录');
    return null;
  } else {
    throw new Error('创建测试用户失败: ' + await response.text());
  }
}

/**
 * 登录测试用户
 */
async function loginTestUser() {
  console.log('\n🔑 登录测试用户...');
  
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: TEST_USER.username,
      password: TEST_USER.password
    })
  });
  
  if (!response.ok) {
    throw new Error('登录失败: ' + await response.text());
  }
  
  const data = await response.json();
  authToken = data.token;
  testUserId = data.user.id;
  console.log('✅ 登录成功');
  console.log(`   用户ID: ${testUserId}`);
}

/**
 * 创建测试乘客
 */
async function createTestPassengers() {
  console.log('\n👥 创建测试乘客...');
  
  const passengers = [
    {
      name: '测试乘客一',
      idCardType: '身份证',
      idCardNumber: '110101199001011111',
      phone: '13800000001',
      passengerType: '成人'
    },
    {
      name: '测试乘客二',
      idCardType: '身份证',
      idCardNumber: '110101199001012222',
      phone: '13800000002',
      passengerType: '成人'
    }
  ];
  
  for (const passenger of passengers) {
    const response = await fetch('http://localhost:5000/api/passengers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(passenger)
    });
    
    if (response.ok) {
      const data = await response.json();
      passengerIds.push(data.passenger.id);
      console.log(`✅ 创建乘客: ${passenger.name}`);
    } else {
      throw new Error(`创建乘客失败: ${await response.text()}`);
    }
  }
}

/**
 * 获取当前余票数
 */
async function getAvailableSeats() {
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    // 获取所有途经站点
    db.all(
      `SELECT station FROM train_stops 
       WHERE train_no = ? 
       AND seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       AND seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       ORDER BY seq`,
      [TEST_CONFIG.trainNo, TEST_CONFIG.trainNo, TEST_CONFIG.departureStation, 
       TEST_CONFIG.trainNo, TEST_CONFIG.arrivalStation],
      (err, stops) => {
        if (err) {
          db.close();
          return reject(err);
        }
        
        // 构建所有区间
        const segments = [];
        for (let i = 0; i < stops.length - 1; i++) {
          segments.push({
            from: stops[i].station,
            to: stops[i + 1].station
          });
        }
        
        // 获取该席别的所有座位
        db.all(
          `SELECT DISTINCT seat_no 
           FROM seat_status 
           WHERE train_no = ? 
           AND departure_date = ?
           AND seat_type = ?`,
          [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType],
          async (err, seats) => {
            if (err) {
              db.close();
              return reject(err);
            }
            
            let availableCount = 0;
            const segmentConditions = segments.map(() => 
              '(from_station = ? AND to_station = ?)'
            ).join(' OR ');
            const segmentParams = segments.flatMap(s => [s.from, s.to]);
            
            for (const seat of seats) {
              const result = await new Promise((resolve, reject) => {
                db.all(
                  `SELECT status 
                   FROM seat_status 
                   WHERE train_no = ? 
                   AND departure_date = ?
                   AND seat_type = ? 
                   AND seat_no = ? 
                   AND (${segmentConditions})`,
                  [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType, seat.seat_no, ...segmentParams],
                  (err, statuses) => {
                    if (err) return reject(err);
                    resolve(statuses);
                  }
                );
              });
              
              if (result.length === segments.length && result.every(s => s.status === 'available')) {
                availableCount++;
              }
            }
            
            db.close();
            resolve(availableCount);
          }
        );
      }
    );
  });
}

/**
 * 预定座位直到只剩1张
 */
async function bookSeatsUntilOneLeft() {
  console.log('\n🎫 预定座位，确保只剩1张商务座票...');
  
  let availableSeats = await getAvailableSeats();
  console.log(`   当前余票: ${availableSeats}张`);
  
  if (availableSeats === 1) {
    console.log('✅ 余票已经是1张，无需预定');
    return;
  }
  
  const db = new sqlite3.Database(dbPath);
  
  // 直接在数据库中标记座位为已预定，只留1张
  await new Promise((resolve, reject) => {
    // 获取所有途经站点
    db.all(
      `SELECT station FROM train_stops 
       WHERE train_no = ? 
       AND seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       AND seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       ORDER BY seq`,
      [TEST_CONFIG.trainNo, TEST_CONFIG.trainNo, TEST_CONFIG.departureStation, 
       TEST_CONFIG.trainNo, TEST_CONFIG.arrivalStation],
      async (err, stops) => {
        if (err) {
          db.close();
          return reject(err);
        }
        
        // 构建所有区间
        const segments = [];
        for (let i = 0; i < stops.length - 1; i++) {
          segments.push({
            from: stops[i].station,
            to: stops[i + 1].station
          });
        }
        
        // 获取该席别的所有座位
        db.all(
          `SELECT DISTINCT seat_no 
           FROM seat_status 
           WHERE train_no = ? 
           AND departure_date = ?
           AND seat_type = ?
           ORDER BY seat_no`,
          [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType],
          async (err, seats) => {
            if (err) {
              db.close();
              return reject(err);
            }
            
            // 预定除最后1个以外的所有座位
            const seatsToBook = seats.slice(0, -1);
            
            for (const seat of seatsToBook) {
              for (const segment of segments) {
                await new Promise((resolve, reject) => {
                  db.run(
                    `UPDATE seat_status 
                     SET status = 'booked', booked_by = 'system_test', booked_at = datetime('now')
                     WHERE train_no = ? 
                     AND departure_date = ?
                     AND seat_type = ? 
                     AND seat_no = ? 
                     AND from_station = ? 
                     AND to_station = ?`,
                    [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType, 
                     seat.seat_no, segment.from, segment.to],
                    (err) => {
                      if (err) return reject(err);
                      resolve(true);
                    }
                  );
                });
              }
            }
            
            db.close();
            resolve(true);
          }
        );
      }
    );
  });
  
  availableSeats = await getAvailableSeats();
  console.log(`✅ 座位预定完成，当前余票: ${availableSeats}张`);
}

/**
 * 提交订单
 */
async function submitOrder() {
  console.log('\n📋 提交订单（2个乘客）...');
  
  const response = await fetch('http://localhost:5000/api/orders/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      trainNo: TEST_CONFIG.trainNo,
      departureStation: TEST_CONFIG.departureStation,
      arrivalStation: TEST_CONFIG.arrivalStation,
      departureDate: TEST_CONFIG.departureDate,
      passengers: [
        {
          passengerId: passengerIds[0],
          seatType: TEST_CONFIG.seatType,
          ticketType: '成人票'
        },
        {
          passengerId: passengerIds[1],
          seatType: TEST_CONFIG.seatType,
          ticketType: '成人票'
        }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error('提交订单失败: ' + await response.text());
  }
  
  const data = await response.json();
  console.log('✅ 订单提交成功');
  console.log(`   订单ID: ${data.orderId}`);
  return data.orderId;
}

/**
 * 确认订单
 */
async function confirmOrder(orderId) {
  console.log('\n✔️  尝试确认订单...');
  
  const response = await fetch(`http://localhost:5000/api/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    return { success: true, data };
  } else {
    const error = await response.json();
    return { success: false, error: error.error };
  }
}

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  console.log('\n🧹 清理测试数据...');
  
  const db = new sqlite3.Database(dbPath);
  
  await new Promise((resolve) => {
    db.serialize(() => {
      // 恢复所有商务座为可用状态
      db.run(
        `UPDATE seat_status 
         SET status = 'available', booked_by = NULL, booked_at = NULL
         WHERE train_no = ? 
         AND departure_date = ?
         AND seat_type = ?`,
        [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType],
        () => {
          // 删除测试订单
          db.run(
            'DELETE FROM order_details WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)',
            [testUserId],
            () => {
              db.run(
                'DELETE FROM orders WHERE user_id = ?',
                [testUserId],
                () => {
                  // 删除测试乘客
                  db.run(
                    'DELETE FROM passengers WHERE user_id = ?',
                    [testUserId],
                    () => {
                      // 删除测试用户
                      db.run(
                        'DELETE FROM users WHERE id = ?',
                        [testUserId],
                        () => {
                          db.close();
                          console.log('✅ 清理完成');
                          resolve(true);
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log('========================================');
  console.log('🧪 座位预定原子性修复测试');
  console.log('========================================');
  
  try {
    // 1. 创建测试用户
    await createTestUser();
    await loginTestUser();
    
    // 2. 创建测试乘客
    await createTestPassengers();
    
    // 3. 确保商务座只剩1张票
    await bookSeatsUntilOneLeft();
    
    // 4. 检查余票数
    const availableBeforeTest = await getAvailableSeats();
    console.log(`\n📊 测试前余票数: ${availableBeforeTest}张`);
    
    if (availableBeforeTest !== 1) {
      throw new Error(`余票数应该是1张，实际是${availableBeforeTest}张`);
    }
    
    // 5. 提交订单（2个乘客）
    const orderId = await submitOrder();
    
    // 6. 尝试确认订单
    const confirmResult = await confirmOrder(orderId);
    
    // 7. 验证结果
    console.log('\n📊 测试结果:');
    console.log('========================================');
    
    if (confirmResult.success) {
      console.log('❌ 测试失败：订单应该确认失败，但实际成功了');
      console.log('   这说明修复无效！');
      return false;
    } else {
      console.log('✅ 订单确认失败（符合预期）');
      console.log(`   错误信息: ${confirmResult.error}`);
      
      // 检查错误信息是否包含余票不足的提示
      if (confirmResult.error.includes('余票不足') || confirmResult.error.includes('已售罄')) {
        console.log('✅ 错误信息正确');
      } else {
        console.log('⚠️  错误信息可能不够清晰');
      }
    }
    
    // 8. 检查余票数是否保持不变
    const availableAfterTest = await getAvailableSeats();
    console.log(`\n📊 测试后余票数: ${availableAfterTest}张`);
    
    if (availableAfterTest === availableBeforeTest) {
      console.log('✅ 余票数保持不变（符合预期）');
      console.log('✅ 修复成功！座位状态没有被错误地修改');
    } else {
      console.log('❌ 测试失败：余票数发生了变化');
      console.log(`   预期: ${availableBeforeTest}张，实际: ${availableAfterTest}张`);
      console.log('   这说明座位状态被错误地修改了！');
      return false;
    }
    
    console.log('\n========================================');
    console.log('🎉 所有测试通过！');
    console.log('========================================');
    
    return true;
  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    // 清理测试数据
    await cleanupTestData();
  }
}

// 运行测试
runTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});


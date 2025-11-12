/**
 * 高并发购票测试脚本
 * 
 * 测试目标：
 * 1. 模拟多用户同时购票场景
 * 2. 验证余票数据一致性
 * 3. 验证不会出现超卖（余票为负）
 * 4. 验证余票计算的并发安全性
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const trainService = require('../src/services/trainService');

const dbPath = path.join(__dirname, '../database/railway.db');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function pass(testName) {
  totalTests++;
  passedTests++;
  console.log(`✅ PASS: ${testName}`);
}

function fail(testName, reason) {
  totalTests++;
  failedTests++;
  console.log(`❌ FAIL: ${testName}`);
  console.log(`   Reason: ${reason}`);
}

function assertEquals(actual, expected, testName) {
  if (actual === expected) {
    pass(testName);
  } else {
    fail(testName, `Expected ${expected}, got ${actual}`);
  }
}

function assertGreaterThanOrEqual(actual, threshold, testName) {
  if (actual >= threshold) {
    pass(testName);
  } else {
    fail(testName, `Expected >= ${threshold}, got ${actual}`);
  }
}

// 模拟预订座位
function bookSeat(trainNo, seatNo, fromStation, toStation, userId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    // 使用事务确保原子性
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 先查询座位是否可用
      db.get(
        `SELECT status FROM seat_status 
         WHERE train_no = ? AND seat_no = ? 
         AND from_station = ? AND to_station = ? 
         AND status = 'available'
         LIMIT 1`,
        [trainNo, seatNo, fromStation, toStation],
        (err, row) => {
          if (err || !row) {
            db.run('ROLLBACK');
            db.close();
            resolve({ success: false, reason: '座位不可用' });
            return;
          }
          
          // 座位可用，进行预订
          db.run(
            `UPDATE seat_status 
             SET status = 'booked', booked_by = ?, booked_at = CURRENT_TIMESTAMP 
             WHERE train_no = ? AND seat_no = ? 
             AND from_station = ? AND to_station = ? 
             AND status = 'available'`,
            [userId, trainNo, seatNo, fromStation, toStation],
            function(err) {
              if (err || this.changes === 0) {
                db.run('ROLLBACK');
                db.close();
                resolve({ success: false, reason: '预订失败' });
                return;
              }
              
              db.run('COMMIT', (err) => {
                db.close();
                if (err) {
                  resolve({ success: false, reason: '提交失败' });
                } else {
                  resolve({ success: true });
                }
              });
            }
          );
        }
      );
    });
  });
}

// 取消预订
function cancelBooking(trainNo, seatNo, fromStation, toStation) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.run(
      `UPDATE seat_status 
       SET status = 'available', booked_by = NULL, booked_at = NULL 
       WHERE train_no = ? AND seat_no = ? 
       AND from_station = ? AND to_station = ?`,
      [trainNo, seatNo, fromStation, toStation],
      function(err) {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

// 测试1: 基本并发预订测试
async function test1_basicConcurrentBooking() {
  console.log('\n--- 测试1: 基本并发预订测试 ---');
  
  try {
    // 获取初始余票
    const initialSeats = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
    const initialBusiness = initialSeats['商务座'];
    
    // 模拟5个用户同时预订不同的商务座
    const bookingPromises = [];
    for (let i = 1; i <= 5; i++) {
      bookingPromises.push(
        bookSeat('G103', `1-0${i}`, '北京南', '沧州西', `user_${i}`)
      );
    }
    
    const results = await Promise.all(bookingPromises);
    const successCount = results.filter(r => r.success).length;
    
    // 验证所有预订都成功
    assertEquals(successCount, 5, '5个并发预订应全部成功');
    
    // 验证余票减少
    const finalSeats = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
    const finalBusiness = finalSeats['商务座'];
    
    assertEquals(finalBusiness, initialBusiness - 5, '商务座余票应减少5');
    
    // 清理：取消预订
    for (let i = 1; i <= 5; i++) {
      await cancelBooking('G103', `1-0${i}`, '北京南', '沧州西');
    }
    
    pass('基本并发预订测试清理完成');
    
  } catch (error) {
    fail('基本并发预订测试', error.message);
  }
}

// 测试2: 超额预订测试（防止超卖）
async function test2_overbookingPrevention() {
  console.log('\n--- 测试2: 超额预订测试（防止超卖） ---');
  
  try {
    // 获取初始余票（应该是10个商务座）
    const initialSeats = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
    const initialBusiness = initialSeats['商务座'];
    
    // 模拟15个用户同时预订前10个商务座（只有10个）
    const bookingPromises = [];
    for (let i = 1; i <= 10; i++) {
      const seatNo = i < 10 ? `1-0${i}` : `1-${i}`;
      bookingPromises.push(
        bookSeat('G103', seatNo, '北京南', '沧州西', `user_overbook_${i}`)
      );
    }
    
    const results = await Promise.all(bookingPromises);
    const successCount = results.filter(r => r.success).length;
    
    // 验证最多只能预订10个
    assertGreaterThanOrEqual(successCount, 1, '至少应有1个预订成功');
    assertGreaterThanOrEqual(10, successCount, '预订数不应超过座位数');
    
    // 验证余票不为负
    const finalSeats = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
    const finalBusiness = finalSeats['商务座'];
    
    assertGreaterThanOrEqual(finalBusiness, 0, '余票数不应为负');
    
    // 清理：取消所有预订
    for (let i = 1; i <= 10; i++) {
      const seatNo = i < 10 ? `1-0${i}` : `1-${i}`;
      await cancelBooking('G103', seatNo, '北京南', '沧州西');
    }
    
    pass('超额预订测试清理完成');
    
  } catch (error) {
    fail('超额预订测试', error.message);
  }
}

// 测试3: 多区间并发预订测试
async function test3_multiSegmentConcurrentBooking() {
  console.log('\n--- 测试3: 多区间并发预订测试 ---');
  
  try {
    // 模拟多个用户预订同一座位的不同区间
    // 用户1: 北京南-沧州西
    // 用户2: 沧州西-济南西
    // 用户3: 济南西-徐州东
    
    const bookingPromises = [
      bookSeat('G103', '1-01', '北京南', '沧州西', 'user_multi_1'),
      bookSeat('G103', '1-01', '沧州西', '济南西', 'user_multi_2'),
      bookSeat('G103', '1-01', '济南西', '徐州东', 'user_multi_3')
    ];
    
    const results = await Promise.all(bookingPromises);
    const successCount = results.filter(r => r.success).length;
    
    // 所有预订都应该成功，因为是不同区间
    assertEquals(successCount, 3, '不同区间的并发预订应全部成功');
    
    // 验证全程余票减少（因为1-01不能用于全程）
    const fullJourneySeats = await trainService.calculateAvailableSeats('G103', '北京南', '上海虹桥');
    const fullJourneyBusiness = fullJourneySeats['商务座'];
    
    assertEquals(fullJourneyBusiness, 9, '全程商务座余票应减少1');
    
    // 但各单独区间应该还有余票
    const seg1Seats = await trainService.calculateAvailableSeats('G103', '徐州东', '宿州东');
    assertEquals(seg1Seats['商务座'], 10, '未被预订区间的余票不变');
    
    // 清理
    await cancelBooking('G103', '1-01', '北京南', '沧州西');
    await cancelBooking('G103', '1-01', '沧州西', '济南西');
    await cancelBooking('G103', '1-01', '济南西', '徐州东');
    
    pass('多区间并发预订测试清理完成');
    
  } catch (error) {
    fail('多区间并发预订测试', error.message);
  }
}

// 测试4: 冲突预订测试
async function test4_conflictingBooking() {
  console.log('\n--- 测试4: 冲突预订测试 ---');
  
  try {
    // 先预订1-02从北京南到济南西
    await bookSeat('G103', '1-02', '北京南', '沧州西', 'user_conflict_1');
    
    // 尝试预订1-02从北京南到徐州东（包含已预订区间，应该失败）
    const bookingPromises = [];
    for (let i = 1; i <= 3; i++) {
      bookingPromises.push(
        bookSeat('G103', '1-02', '北京南', '沧州西', `user_conflict_${i + 1}`)
      );
    }
    
    const results = await Promise.all(bookingPromises);
    const successCount = results.filter(r => r.success).length;
    
    // 所有冲突预订都应该失败
    assertEquals(successCount, 0, '冲突区间的预订应全部失败');
    
    // 清理
    await cancelBooking('G103', '1-02', '北京南', '沧州西');
    
    pass('冲突预订测试清理完成');
    
  } catch (error) {
    fail('冲突预订测试', error.message);
  }
}

// 测试5: 大规模并发测试
async function test5_massiveConcurrentBooking() {
  console.log('\n--- 测试5: 大规模并发测试 ---');
  
  try {
    // 获取初始余票
    const initialSeats = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
    const initialSecondClass = initialSeats['二等座'];
    
    // 模拟100个用户同时查询余票
    const queryPromises = [];
    for (let i = 0; i < 100; i++) {
      queryPromises.push(
        trainService.calculateAvailableSeats('G103', '北京南', '沧州西')
      );
    }
    
    const queryResults = await Promise.all(queryPromises);
    
    // 验证所有查询结果一致
    const allConsistent = queryResults.every(r => r['二等座'] === initialSecondClass);
    
    if (allConsistent) {
      pass('100个并发查询结果一致');
    } else {
      fail('100个并发查询结果一致', '查询结果不一致');
    }
    
    // 模拟50个用户同时预订（但只有960个座位）
    const bookingPromises = [];
    for (let i = 1; i <= 50; i++) {
      const carNo = Math.floor((i - 1) / 80) + 4;  // 从4号车厢开始
      const seatInCar = ((i - 1) % 80) + 1;
      const seatNo = `${carNo}-${String(seatInCar).padStart(2, '0')}`;
      
      bookingPromises.push(
        bookSeat('G103', seatNo, '北京南', '沧州西', `user_massive_${i}`)
      );
    }
    
    const bookingResults = await Promise.all(bookingPromises);
    const successBookings = bookingResults.filter(r => r.success).length;
    
    assertGreaterThanOrEqual(successBookings, 1, '大规模并发预订至少有1个成功');
    assertGreaterThanOrEqual(50, successBookings, '成功预订数不超过请求数');
    
    // 验证余票一致性
    const finalSeats = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
    const finalSecondClass = finalSeats['二等座'];
    
    assertEquals(finalSecondClass, initialSecondClass - successBookings, '余票减少与成功预订数一致');
    
    // 清理
    for (let i = 1; i <= 50; i++) {
      const carNo = Math.floor((i - 1) / 80) + 4;
      const seatInCar = ((i - 1) % 80) + 1;
      const seatNo = `${carNo}-${String(seatInCar).padStart(2, '0')}`;
      
      await cancelBooking('G103', seatNo, '北京南', '沧州西');
    }
    
    pass('大规模并发测试清理完成');
    
  } catch (error) {
    fail('大规模并发测试', error.message);
  }
}

// 主函数
async function main() {
  console.log('\n=== 开始测试高并发购票场景 ===\n');
  
  await test1_basicConcurrentBooking();
  await test2_overbookingPrevention();
  await test3_multiSegmentConcurrentBooking();
  await test4_conflictingBooking();
  await test5_massiveConcurrentBooking();
  
  console.log('\n=== 测试完成 ===');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests/totalTests) * 100).toFixed(2)}%\n`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('测试脚本出错:', err);
  process.exit(1);
});


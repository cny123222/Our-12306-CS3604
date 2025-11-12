/**
 * 余票计算逻辑测试脚本
 * 
 * 测试目标：
 * 1. 相邻站余票计算
 * 2. 非相邻站余票计算（全程空闲）
 * 3. 部分区间预订后的余票计算
 * 4. 售罄情况的余票计算
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/railway.db');
const trainService = require('../src/services/trainService');

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

function assertGreaterThan(actual, threshold, testName) {
  if (actual > threshold) {
    pass(testName);
  } else {
    fail(testName, `Expected > ${threshold}, got ${actual}`);
  }
}

// 测试1: 相邻站余票计算
async function test1_adjacentStations() {
  console.log('\n--- 测试1: 相邻站余票计算 ---');
  
  try {
    // 测试G103从北京南到沧州西（相邻站）
    const result = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
    
    // 初始状态，所有座位都应该可用
    assertGreaterThan(result['商务座'], 0, 'G103北京南-沧州西商务座余票 > 0');
    assertGreaterThan(result['一等座'], 0, 'G103北京南-沧州西一等座余票 > 0');
    assertGreaterThan(result['二等座'], 0, 'G103北京南-沧州西二等座余票 > 0');
    
    // 验证具体数值
    assertEquals(result['商务座'], 10, 'G103北京南-沧州西商务座余票');
    assertEquals(result['一等座'], 80, 'G103北京南-沧州西一等座余票');
    assertEquals(result['二等座'], 960, 'G103北京南-沧州西二等座余票');
    
  } catch (error) {
    fail('相邻站余票计算', error.message);
  }
}

// 测试2: 非相邻站余票计算（全程）
async function test2_nonAdjacentStations() {
  console.log('\n--- 测试2: 非相邻站余票计算 ---');
  
  try {
    // 测试G103从北京南到上海虹桥（全程）
    const result = await trainService.calculateAvailableSeats('G103', '北京南', '上海虹桥');
    
    // 初始状态，所有座位都应该可用
    assertGreaterThan(result['商务座'], 0, 'G103北京南-上海虹桥商务座余票 > 0');
    assertGreaterThan(result['一等座'], 0, 'G103北京南-上海虹桥一等座余票 > 0');
    assertGreaterThan(result['二等座'], 0, 'G103北京南-上海虹桥二等座余票 > 0');
    
    // 验证具体数值
    assertEquals(result['商务座'], 10, 'G103北京南-上海虹桥商务座余票');
    assertEquals(result['一等座'], 80, 'G103北京南-上海虹桥一等座余票');
    assertEquals(result['二等座'], 960, 'G103北京南-上海虹桥二等座余票');
    
  } catch (error) {
    fail('非相邻站余票计算', error.message);
  }
}

// 测试3: 中间站段余票计算
async function test3_middleSegment() {
  console.log('\n--- 测试3: 中间站段余票计算 ---');
  
  try {
    // 测试G103从济南西到南京南（中间段）
    const result = await trainService.calculateAvailableSeats('G103', '济南西', '南京南');
    
    assertGreaterThan(result['商务座'], 0, 'G103济南西-南京南商务座余票 > 0');
    assertGreaterThan(result['一等座'], 0, 'G103济南西-南京南一等座余票 > 0');
    assertGreaterThan(result['二等座'], 0, 'G103济南西-南京南二等座余票 > 0');
    
    // 验证具体数值
    assertEquals(result['商务座'], 10, 'G103济南西-南京南商务座余票');
    assertEquals(result['一等座'], 80, 'G103济南西-南京南一等座余票');
    assertEquals(result['二等座'], 960, 'G103济南西-南京南二等座余票');
    
  } catch (error) {
    fail('中间站段余票计算', error.message);
  }
}

// 测试4: 模拟预订后的余票计算
async function test4_afterBooking() {
  console.log('\n--- 测试4: 模拟预订后的余票计算 ---');
  
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve) => {
    // 先预订一个座位
    db.run(
      `UPDATE seat_status 
       SET status = 'booked', booked_by = 'test_user', booked_at = CURRENT_TIMESTAMP 
       WHERE train_no = 'G103' 
       AND seat_no = '1-01' 
       AND from_station = '北京南' 
       AND to_station = '沧州西'`,
      async function(err) {
        if (err) {
          fail('预订座位', err.message);
          db.close();
          resolve();
          return;
        }
        
        try {
          // 再次查询相邻站余票
          const result = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
          
          // 商务座应该减少1个
          assertEquals(result['商务座'], 9, 'G103北京南-沧州西预订后商务座余票');
          assertEquals(result['一等座'], 80, 'G103北京南-沧州西预订后一等座余票（不变）');
          
          // 恢复座位状态
          db.run(
            `UPDATE seat_status 
             SET status = 'available', booked_by = NULL, booked_at = NULL 
             WHERE train_no = 'G103' 
             AND seat_no = '1-01' 
             AND from_station = '北京南' 
             AND to_station = '沧州西'`,
            (err) => {
              if (err) {
                fail('恢复座位状态', err.message);
              } else {
                pass('预订后座位状态恢复');
              }
              db.close();
              resolve();
            }
          );
          
        } catch (error) {
          fail('预订后余票计算', error.message);
          db.close();
          resolve();
        }
      }
    );
  });
}

// 测试5: 跨多个区间的座位预订
async function test5_multiSegmentBooking() {
  console.log('\n--- 测试5: 跨多个区间的座位预订 ---');
  
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve) => {
    // 预订一个座位的北京南到济南西段
    db.run(
      `UPDATE seat_status 
       SET status = 'booked', booked_by = 'test_user2', booked_at = CURRENT_TIMESTAMP 
       WHERE train_no = 'G103' 
       AND seat_no = '1-02' 
       AND from_station = '北京南' 
       AND to_station = '沧州西'`,
      async function(err) {
        if (err) {
          fail('预订多区间座位', err.message);
          db.close();
          resolve();
          return;
        }
        
        try {
          // 查询北京南到上海虹桥的余票
          // 座位1-02在北京南到沧州西段被占用，所以不能用于全程
          const result = await trainService.calculateAvailableSeats('G103', '北京南', '上海虹桥');
          
          // 商务座应该减少1个（因为1-02不能用于全程）
          assertEquals(result['商务座'], 9, 'G103北京南-上海虹桥预订后商务座余票');
          
          // 但从沧州西到济南西查询，1-02应该是可用的
          const result2 = await trainService.calculateAvailableSeats('G103', '沧州西', '济南西');
          assertEquals(result2['商务座'], 10, 'G103沧州西-济南西商务座余票（不受影响）');
          
          // 恢复座位状态
          db.run(
            `UPDATE seat_status 
             SET status = 'available', booked_by = NULL, booked_at = NULL 
             WHERE train_no = 'G103' 
             AND seat_no = '1-02' 
             AND from_station = '北京南' 
             AND to_station = '沧州西'`,
            (err) => {
              if (err) {
                fail('恢复多区间座位状态', err.message);
              } else {
                pass('多区间预订后座位状态恢复');
              }
              db.close();
              resolve();
            }
          );
          
        } catch (error) {
          fail('多区间预订后余票计算', error.message);
          db.close();
          resolve();
        }
      }
    );
  });
}

// 测试6: D6车次的余票计算（测试不同席别）
async function test6_differentSeatTypes() {
  console.log('\n--- 测试6: D6车次的余票计算（测试不同席别） ---');
  
  try {
    // 测试D6从上海到北京
    const result = await trainService.calculateAvailableSeats('D6', '上海', '北京');
    
    // D6有二等座、硬卧、软卧
    assertGreaterThan(result['二等座'], 0, 'D6上海-北京二等座余票 > 0');
    assertGreaterThan(result['硬卧'], 0, 'D6上海-北京硬卧余票 > 0');
    assertGreaterThan(result['软卧'], 0, 'D6上海-北京软卧余票 > 0');
    
    // 验证具体数值
    assertEquals(result['二等座'], 1040, 'D6上海-北京二等座余票');
    assertEquals(result['硬卧'], 120, 'D6上海-北京硬卧余票');
    assertEquals(result['软卧'], 30, 'D6上海-北京软卧余票');
    
    // 验证不应该有商务座和一等座
    assertEquals(result['商务座'], undefined, 'D6不应有商务座');
    assertEquals(result['一等座'], undefined, 'D6不应有一等座');
    
  } catch (error) {
    fail('D6余票计算', error.message);
  }
}

// 测试7: 出发站在到达站之后的情况
async function test7_invalidStationOrder() {
  console.log('\n--- 测试7: 出发站在到达站之后的情况 ---');
  
  try {
    // 测试G103从上海虹桥到北京南（顺序错误）
    const result = await trainService.calculateAvailableSeats('G103', '上海虹桥', '北京南');
    
    // 应该返回空对象或没有余票
    const hasSeats = Object.keys(result).length > 0 && Object.values(result).some(v => v > 0);
    
    if (!hasSeats) {
      pass('出发站在到达站之后应返回无余票');
    } else {
      fail('出发站在到达站之后应返回无余票', `返回了 ${JSON.stringify(result)}`);
    }
    
  } catch (error) {
    // 如果抛出错误也是合理的
    pass('出发站在到达站之后正确处理（抛出错误）');
  }
}

// 主函数
async function main() {
  console.log('\n=== 开始测试余票计算逻辑 ===\n');
  
  await test1_adjacentStations();
  await test2_nonAdjacentStations();
  await test3_middleSegment();
  await test4_afterBooking();
  await test5_multiSegmentBooking();
  await test6_differentSeatTypes();
  await test7_invalidStationOrder();
  
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


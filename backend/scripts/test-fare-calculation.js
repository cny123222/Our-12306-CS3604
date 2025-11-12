/**
 * 票价计算逻辑测试脚本
 * 
 * 测试目标：
 * 1. 验证相邻站票价
 * 2. 验证非相邻站票价累加计算
 * 3. 验证不同席别的票价计算
 * 4. 验证全程票价
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/railway.db');
const trainsJsonPath = path.join(__dirname, '../../requirements/03-车次列表页/车次信息.json');

const trainsJsonData = JSON.parse(fs.readFileSync(trainsJsonPath, 'utf8'));
const db = new sqlite3.Database(dbPath);

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
  if (Math.abs(actual - expected) < 0.01) {  // 浮点数比较允许小误差
    pass(testName);
  } else {
    fail(testName, `Expected ${expected}, got ${actual}`);
  }
}

// 计算两站之间的票价
function calculateFare(trainNo, fromStation, toStation, seatType) {
  return new Promise((resolve, reject) => {
    // 获取所有相关的票价段
    db.all(
      `SELECT ts1.station as from_station, ts2.station as to_station, 
              tf.second_class_price, tf.first_class_price, tf.business_price,
              tf.hard_sleeper_price, tf.soft_sleeper_price
       FROM train_stops ts1
       JOIN train_stops ts2 ON ts1.train_no = ts2.train_no AND ts2.seq = ts1.seq + 1
       LEFT JOIN train_fares tf ON tf.train_no = ts1.train_no 
                                 AND tf.from_station = ts1.station 
                                 AND tf.to_station = ts2.station
       WHERE ts1.train_no = ?
       AND ts1.seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       AND ts2.seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       ORDER BY ts1.seq`,
      [trainNo, trainNo, fromStation, trainNo, toStation],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        let totalFare = 0;
        const priceFields = {
          '二等座': 'second_class_price',
          '一等座': 'first_class_price',
          '商务座': 'business_price',
          '硬卧': 'hard_sleeper_price',
          '软卧': 'soft_sleeper_price'
        };
        
        const priceField = priceFields[seatType];
        if (!priceField) {
          reject(new Error(`Unknown seat type: ${seatType}`));
          return;
        }
        
        rows.forEach(row => {
          if (row[priceField]) {
            totalFare += row[priceField];
          }
        });
        
        resolve(totalFare);
      }
    );
  });
}

// 测试1: 验证相邻站票价
async function test1_adjacentStationFares() {
  console.log('\n--- 测试1: 验证相邻站票价 ---');
  
  // 测试G103的第一段：北京南到沧州西
  const jsonTrain = trainsJsonData.find(t => t.train_no === 'G103');
  const firstSegment = jsonTrain.fares.segments[0];
  
  try {
    const fare = await calculateFare('G103', '北京南', '沧州西', '二等座');
    assertEquals(fare, firstSegment.second_class, 'G103北京南-沧州西二等座票价');
  } catch (error) {
    fail('G103北京南-沧州西二等座票价', error.message);
  }
  
  try {
    const fare = await calculateFare('G103', '北京南', '沧州西', '一等座');
    assertEquals(fare, firstSegment.first_class, 'G103北京南-沧州西一等座票价');
  } catch (error) {
    fail('G103北京南-沧州西一等座票价', error.message);
  }
  
  try {
    const fare = await calculateFare('G103', '北京南', '沧州西', '商务座');
    assertEquals(fare, firstSegment.business, 'G103北京南-沧州西商务座票价');
  } catch (error) {
    fail('G103北京南-沧州西商务座票价', error.message);
  }
}

// 测试2: 验证全程票价
async function test2_fullJourneyFares() {
  console.log('\n--- 测试2: 验证全程票价 ---');
  
  const jsonTrain = trainsJsonData.find(t => t.train_no === 'G103');
  
  try {
    const fare = await calculateFare('G103', '北京南', '上海虹桥', '二等座');
    assertEquals(fare, jsonTrain.fares.second_class, 'G103北京南-上海虹桥二等座全程票价');
  } catch (error) {
    fail('G103北京南-上海虹桥二等座全程票价', error.message);
  }
  
  try {
    const fare = await calculateFare('G103', '北京南', '上海虹桥', '一等座');
    assertEquals(fare, jsonTrain.fares.first_class, 'G103北京南-上海虹桥一等座全程票价');
  } catch (error) {
    fail('G103北京南-上海虹桥一等座全程票价', error.message);
  }
  
  try {
    const fare = await calculateFare('G103', '北京南', '上海虹桥', '商务座');
    assertEquals(fare, jsonTrain.fares.business, 'G103北京南-上海虹桥商务座全程票价');
  } catch (error) {
    fail('G103北京南-上海虹桥商务座全程票价', error.message);
  }
}

// 测试3: 验证中间段票价累加
async function test3_middleSegmentFares() {
  console.log('\n--- 测试3: 验证中间段票价累加 ---');
  
  const jsonTrain = trainsJsonData.find(t => t.train_no === 'G103');
  
  // 计算北京南到南京南的预期票价（前6段之和）
  let expectedSecondClass = 0;
  let expectedFirstClass = 0;
  let expectedBusiness = 0;
  
  for (let i = 0; i < 6; i++) {
    expectedSecondClass += jsonTrain.fares.segments[i].second_class;
    expectedFirstClass += jsonTrain.fares.segments[i].first_class;
    expectedBusiness += jsonTrain.fares.segments[i].business;
  }
  
  try {
    const fare = await calculateFare('G103', '北京南', '南京南', '二等座');
    assertEquals(fare, expectedSecondClass, 'G103北京南-南京南二等座票价');
  } catch (error) {
    fail('G103北京南-南京南二等座票价', error.message);
  }
  
  try {
    const fare = await calculateFare('G103', '北京南', '南京南', '一等座');
    assertEquals(fare, expectedFirstClass, 'G103北京南-南京南一等座票价');
  } catch (error) {
    fail('G103北京南-南京南一等座票价', error.message);
  }
  
  try {
    const fare = await calculateFare('G103', '北京南', '南京南', '商务座');
    assertEquals(fare, expectedBusiness, 'G103北京南-南京南商务座票价');
  } catch (error) {
    fail('G103北京南-南京南商务座票价', error.message);
  }
}

// 测试4: 验证D6车次的票价（不同席别）
async function test4_d6Fares() {
  console.log('\n--- 测试4: 验证D6车次的票价（不同席别） ---');
  
  const jsonTrain = trainsJsonData.find(t => t.train_no === 'D6');
  
  try {
    const fare = await calculateFare('D6', '上海', '北京', '二等座');
    assertEquals(fare, jsonTrain.fares.second_class, 'D6上海-北京二等座全程票价');
  } catch (error) {
    fail('D6上海-北京二等座全程票价', error.message);
  }
  
  try {
    const fare = await calculateFare('D6', '上海', '北京', '硬卧');
    assertEquals(fare, jsonTrain.fares.hard_sleeper, 'D6上海-北京硬卧全程票价');
  } catch (error) {
    fail('D6上海-北京硬卧全程票价', error.message);
  }
  
  try {
    const fare = await calculateFare('D6', '上海', '北京', '软卧');
    assertEquals(fare, jsonTrain.fares.soft_sleeper, 'D6上海-北京软卧全程票价');
  } catch (error) {
    fail('D6上海-北京软卧全程票价', error.message);
  }
}

// 测试5: 验证G16车次的票价（反向）
async function test5_g16Fares() {
  console.log('\n--- 测试5: 验证G16车次的票价（反向） ---');
  
  const jsonTrain = trainsJsonData.find(t => t.train_no === 'G16');
  
  try {
    const fare = await calculateFare('G16', '上海虹桥', '北京南', '二等座');
    assertEquals(fare, jsonTrain.fares.second_class, 'G16上海虹桥-北京南二等座全程票价');
  } catch (error) {
    fail('G16上海虹桥-北京南二等座全程票价', error.message);
  }
  
  try {
    const fare = await calculateFare('G16', '上海虹桥', '北京南', '一等座');
    assertEquals(fare, jsonTrain.fares.first_class, 'G16上海虹桥-北京南一等座全程票价');
  } catch (error) {
    fail('G16上海虹桥-北京南一等座全程票价', error.message);
  }
  
  try {
    const fare = await calculateFare('G16', '上海虹桥', '北京南', '商务座');
    assertEquals(fare, jsonTrain.fares.business, 'G16上海虹桥-北京南商务座全程票价');
  } catch (error) {
    fail('G16上海虹桥-北京南商务座全程票价', error.message);
  }
}

// 测试6: 验证所有车次所有区间的票价一致性
async function test6_allTrainsFares() {
  console.log('\n--- 测试6: 验证所有车次所有区间的票价一致性 ---');
  
  for (const jsonTrain of trainsJsonData) {
    // 验证全程票价
    const seatTypes = [];
    if (jsonTrain.fares.second_class) seatTypes.push(['二等座', jsonTrain.fares.second_class]);
    if (jsonTrain.fares.first_class) seatTypes.push(['一等座', jsonTrain.fares.first_class]);
    if (jsonTrain.fares.business) seatTypes.push(['商务座', jsonTrain.fares.business]);
    if (jsonTrain.fares.hard_sleeper) seatTypes.push(['硬卧', jsonTrain.fares.hard_sleeper]);
    if (jsonTrain.fares.soft_sleeper) seatTypes.push(['软卧', jsonTrain.fares.soft_sleeper]);
    
    for (const [seatType, expectedFare] of seatTypes) {
      try {
        const fare = await calculateFare(
          jsonTrain.train_no,
          jsonTrain.route.origin,
          jsonTrain.route.destination,
          seatType
        );
        assertEquals(fare, expectedFare, `${jsonTrain.train_no}全程${seatType}票价`);
      } catch (error) {
        fail(`${jsonTrain.train_no}全程${seatType}票价`, error.message);
      }
    }
  }
}

// 主函数
async function main() {
  console.log('\n=== 开始测试票价计算逻辑 ===\n');
  
  await test1_adjacentStationFares();
  await test2_fullJourneyFares();
  await test3_middleSegmentFares();
  await test4_d6Fares();
  await test5_g16Fares();
  await test6_allTrainsFares();
  
  db.close();
  
  console.log('\n=== 测试完成 ===');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests/totalTests) * 100).toFixed(2)}%\n`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('测试脚本出错:', err);
  db.close();
  process.exit(1);
});


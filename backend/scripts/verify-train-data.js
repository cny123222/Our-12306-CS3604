/**
 * 车次数据完整性验证脚本
 * 独立运行，不依赖Jest
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/railway.db');
const trainsJsonPath = path.join(__dirname, '../../requirements/03-车次列表页/车次信息.json');

// 读取JSON数据
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
  if (actual === expected) {
    pass(testName);
  } else {
    fail(testName, `Expected ${expected}, got ${actual}`);
  }
}

function assertArrayEquals(actual, expected, testName) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    pass(testName);
  } else {
    fail(testName, `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// 测试1: 验证数据库包含所有车次
function test1_allTrainsExist() {
  return new Promise((resolve) => {
    db.all('SELECT train_no FROM trains ORDER BY train_no', [], (err, rows) => {
      if (err) {
        fail('所有车次应存在于数据库', err.message);
        resolve();
        return;
      }
      
      const dbTrainNos = rows.map(r => r.train_no);
      const jsonTrainNos = trainsJsonData.map(t => t.train_no).sort();
      
      assertArrayEquals(dbTrainNos, jsonTrainNos, '数据库应包含JSON中的所有车次');
      resolve();
    });
  });
}

// 测试2: 验证每个车次的基本信息
function test2_trainBasicInfo() {
  return new Promise((resolve) => {
    let checked = 0;
    
    trainsJsonData.forEach(jsonTrain => {
      db.get('SELECT * FROM trains WHERE train_no = ?', [jsonTrain.train_no], (err, dbTrain) => {
        if (err) {
          fail(`车次${jsonTrain.train_no}基本信息验证`, err.message);
        } else if (!dbTrain) {
          fail(`车次${jsonTrain.train_no}基本信息验证`, '车次不存在');
        } else {
          assertEquals(dbTrain.train_no, jsonTrain.train_no, `车次${jsonTrain.train_no}的车次号`);
          assertEquals(dbTrain.train_type, jsonTrain.train_type, `车次${jsonTrain.train_no}的车型`);
          assertEquals(dbTrain.origin_station, jsonTrain.route.origin, `车次${jsonTrain.train_no}的始发站`);
          assertEquals(dbTrain.destination_station, jsonTrain.route.destination, `车次${jsonTrain.train_no}的终点站`);
          assertEquals(dbTrain.distance_km, jsonTrain.route.distance_km, `车次${jsonTrain.train_no}的里程`);
        }
        
        checked++;
        if (checked === trainsJsonData.length) {
          resolve();
        }
      });
    });
  });
}

// 测试3: 验证停靠站数量
function test3_stopsCount() {
  return new Promise((resolve) => {
    let checked = 0;
    
    trainsJsonData.forEach(jsonTrain => {
      db.all(
        'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
        [jsonTrain.train_no],
        (err, stops) => {
          if (err) {
            fail(`车次${jsonTrain.train_no}停靠站数量验证`, err.message);
          } else {
            assertEquals(stops.length, jsonTrain.stops.length, `车次${jsonTrain.train_no}的停靠站数量`);
            
            // 验证停靠站序号连续
            let seqCorrect = true;
            stops.forEach((stop, index) => {
              if (stop.seq !== index + 1) {
                seqCorrect = false;
              }
            });
            
            if (seqCorrect) {
              pass(`车次${jsonTrain.train_no}的停靠站序号连续`);
            } else {
              fail(`车次${jsonTrain.train_no}的停靠站序号连续`, '序号不连续');
            }
          }
          
          checked++;
          if (checked === trainsJsonData.length) {
            resolve();
          }
        }
      );
    });
  });
}

// 测试4: 验证车厢配置
function test4_carsConfig() {
  return new Promise((resolve) => {
    let checked = 0;
    
    trainsJsonData.forEach(jsonTrain => {
      db.all(
        'SELECT * FROM train_cars WHERE train_no = ? ORDER BY car_no',
        [jsonTrain.train_no],
        (err, cars) => {
          if (err) {
            fail(`车次${jsonTrain.train_no}车厢配置验证`, err.message);
          } else {
            assertEquals(cars.length, jsonTrain.cars.length, `车次${jsonTrain.train_no}的车厢数量`);
            
            // 验证车厢号连续
            let carNoCorrect = true;
            cars.forEach((car, index) => {
              if (car.car_no !== index + 1) {
                carNoCorrect = false;
              }
            });
            
            if (carNoCorrect) {
              pass(`车次${jsonTrain.train_no}的车厢号连续`);
            } else {
              fail(`车次${jsonTrain.train_no}的车厢号连续`, '车厢号不连续');
            }
          }
          
          checked++;
          if (checked === trainsJsonData.length) {
            resolve();
          }
        }
      );
    });
  });
}

// 测试5: 验证票价记录数量
function test5_faresCount() {
  return new Promise((resolve) => {
    let checked = 0;
    
    trainsJsonData.forEach(jsonTrain => {
      db.all(
        'SELECT * FROM train_fares WHERE train_no = ?',
        [jsonTrain.train_no],
        (err, fares) => {
          if (err) {
            fail(`车次${jsonTrain.train_no}票价记录验证`, err.message);
          } else {
            assertEquals(fares.length, jsonTrain.fares.segments.length, `车次${jsonTrain.train_no}的票价段数`);
          }
          
          checked++;
          if (checked === trainsJsonData.length) {
            resolve();
          }
        }
      );
    });
  });
}

// 测试6: 验证座位状态初始化
function test6_seatStatusInitialization() {
  return new Promise((resolve) => {
    // 验证所有座位初始状态为available
    db.get(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = "available" THEN 1 ELSE 0 END) as available FROM seat_status',
      [],
      (err, result) => {
        if (err) {
          fail('座位状态初始化验证', err.message);
        } else {
          assertEquals(result.available, result.total, '所有座位初始状态应为available');
        }
        
        // 验证G103的座位总数
        db.get(
          'SELECT COUNT(*) as total FROM seat_status WHERE train_no = "G103"',
          [],
          (err, g103Result) => {
            if (err) {
              fail('G103座位数量验证', err.message);
            } else {
              // G103: 商务座10 + 一等座80 + 二等座960 = 1050个座位
              // 8个区间段，共 1050 * 8 = 8400 条记录
              assertEquals(g103Result.total, 8400, 'G103的座位状态记录数');
            }
            
            resolve();
          }
        );
      }
    );
  });
}

// 测试7: 验证座位数量符合规范
function test7_seatCountByType() {
  return new Promise((resolve) => {
    db.all(
      `SELECT train_no, seat_type, COUNT(DISTINCT seat_no) as seat_count
       FROM seat_status
       WHERE seat_type != '餐车'
       GROUP BY train_no, seat_type
       ORDER BY train_no, seat_type`,
      [],
      (err, rows) => {
        if (err) {
          fail('座位数量规范验证', err.message);
          resolve();
          return;
        }
        
        // 验证座位总数（所有车厢的座位总和）
        // G103/G16: 商务座1节*10=10, 一等座2节*40=80, 二等座12节*80=960
        // D6/D9: 软卧1节*30=30, 硬卧2节*60=120, 二等座13节*80=1040
        const expectedTotalSeats = {
          'G103': { '商务座': 10, '一等座': 80, '二等座': 960 },
          'G16': { '商务座': 10, '一等座': 80, '二等座': 960 },
          'D6': { '软卧': 30, '硬卧': 120, '二等座': 1040 },
          'D9': { '软卧': 30, '硬卧': 120, '二等座': 1040 }
        };
        
        rows.forEach(row => {
          const expected = expectedTotalSeats[row.train_no]?.[row.seat_type];
          if (expected) {
            assertEquals(row.seat_count, expected, `${row.train_no}的${row.seat_type}座位数量`);
          }
        });
        
        resolve();
      }
    );
  });
}

// 测试8: 验证站点完整性
function test8_stationsCompleteness() {
  return new Promise((resolve) => {
    // 提取JSON中所有唯一站点
    const allStations = new Set();
    trainsJsonData.forEach(train => {
      train.stops.forEach(stop => {
        allStations.add(stop.station);
      });
    });

    db.all('SELECT name FROM stations ORDER BY name', [], (err, rows) => {
      if (err) {
        fail('站点完整性验证', err.message);
      } else {
        const dbStations = new Set(rows.map(r => r.name));
        
        let allIncluded = true;
        allStations.forEach(station => {
          if (!dbStations.has(station)) {
            allIncluded = false;
            fail('站点完整性验证', `缺少站点: ${station}`);
          }
        });
        
        if (allIncluded) {
          pass('所有JSON中的站点都在数据库中');
        }
      }
      
      resolve();
    });
  });
}

// 主函数
async function main() {
  console.log('\n=== 开始验证车次数据完整性 ===\n');
  
  await test1_allTrainsExist();
  await test2_trainBasicInfo();
  await test3_stopsCount();
  await test4_carsConfig();
  await test5_faresCount();
  await test6_seatStatusInitialization();
  await test7_seatCountByType();
  await test8_stationsCompleteness();
  
  db.close();
  
  console.log('\n=== 验证完成 ===');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests/totalTests) * 100).toFixed(2)}%\n`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('验证脚本出错:', err);
  db.close();
  process.exit(1);
});


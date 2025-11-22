/**
 * 从车次信息.json插入车次数据到数据库
 * 为2025-11-23到2025-12-08期间的每一天创建车次记录
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 读取车次信息JSON
const trainInfoPath = path.join(__dirname, '../../requirements/03-车次列表页/车次信息.json');
const trainInfo = JSON.parse(fs.readFileSync(trainInfoPath, 'utf8'));

const dbPath = path.join(__dirname, '../database/railway.db');
const db = new sqlite3.Database(dbPath);

// 日期范围：2025-11-23 到 2026-01-18
const startDate = new Date('2025-11-23');
const endDate = new Date('2026-01-18');

// 生成日期数组
function generateDateRange(start, end) {
  const dates = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current).toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// 插入trains表数据
function insertTrain(trainData, departureDate) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO trains (
        train_no, departure_date, train_type, model, 
        is_direct, has_air_conditioning, 
        origin_station, destination_station, 
        distance_km, planned_duration_min, 
        departure_time, arrival_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      trainData.train_no,
      departureDate,
      trainData.train_type,
      trainData.model,
      trainData.direct ? 1 : 0,
      trainData.air_conditioning ? 1 : 0,
      trainData.route.origin,
      trainData.route.destination,
      trainData.route.distance_km,
      trainData.route.planned_duration_min,
      trainData.route.departure_time,
      trainData.route.arrival_time
    ];
    
    db.run(sql, values, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// 插入train_stops表数据
function insertTrainStops(trainNo, stops) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO train_stops (
        train_no, seq, station, arrive_time, depart_time, stop_min
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    let completed = 0;
    let hasError = false;
    
    if (stops.length === 0) {
      resolve();
      return;
    }
    
    stops.forEach(stop => {
      // 先删除已存在的记录
      db.run('DELETE FROM train_stops WHERE train_no = ? AND seq = ?', [trainNo, stop.seq], (delErr) => {
        if (delErr && !hasError) {
          hasError = true;
          reject(delErr);
          return;
        }
        
        // 插入新记录
        db.run(sql, [
          trainNo,
          stop.seq,
          stop.station,
          stop.arrive,
          stop.depart,
          stop.stop_min
        ], (err) => {
          if (err && !hasError) {
            hasError = true;
            reject(err);
            return;
          }
          
          completed++;
          if (completed === stops.length && !hasError) {
            resolve();
          }
        });
      });
    });
  });
}

// 插入train_cars表数据
function insertTrainCars(trainNo, cars) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO train_cars (
        train_no, car_no, seat_type
      ) VALUES (?, ?, ?)
    `;
    
    let completed = 0;
    let hasError = false;
    
    if (cars.length === 0) {
      resolve();
      return;
    }
    
    cars.forEach(car => {
      db.run(sql, [trainNo, car.car_no, car.type], (err) => {
        if (err && !hasError) {
          hasError = true;
          reject(err);
          return;
        }
        
        completed++;
        if (completed === cars.length && !hasError) {
          resolve();
        }
      });
    });
  });
}

// 插入train_fares表数据
function insertFares(trainNo, fares) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO train_fares (
        train_no, from_station, to_station,
        distance_km, second_class_price, first_class_price, business_price,
        hard_sleeper_price, soft_sleeper_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    let completed = 0;
    let hasError = false;
    
    if (!fares.segments || fares.segments.length === 0) {
      resolve();
      return;
    }
    
    fares.segments.forEach(segment => {
      const values = [
        trainNo,
        segment.from,
        segment.to,
        segment.distance_km,
        segment.second_class || null,
        segment.first_class || null,
        segment.business || null,
        segment.hard_sleeper || null,
        segment.soft_sleeper || null
      ];
      
      db.run(sql, values, (err) => {
        if (err && !hasError) {
          hasError = true;
          reject(err);
          return;
        }
        
        completed++;
        if (completed === fares.segments.length && !hasError) {
          resolve();
        }
      });
    });
  });
}

// 主函数
async function insertAllTrains() {
  const dates = generateDateRange(startDate, endDate);
  
  console.log(`📅 日期范围: ${dates[0]} 到 ${dates[dates.length - 1]} (共${dates.length}天)`);
  console.log(`🚆 车次数量: ${trainInfo.length}个车次\n`);
  
  let totalInserted = 0;
  let totalSkipped = 0;
  
  try {
    // 开始事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    for (const train of trainInfo) {
      console.log(`\n处理车次: ${train.train_no}`);
      
      // 插入train_stops（一次性，与日期无关）
      try {
        await insertTrainStops(train.train_no, train.stops);
        console.log(`  ✓ 插入 ${train.stops.length} 个停靠站`);
      } catch (err) {
        console.error(`  ✗ 插入停靠站失败:`, err.message);
      }
      
      // 插入train_cars（一次性，与日期无关）
      try {
        await insertTrainCars(train.train_no, train.cars);
        console.log(`  ✓ 插入 ${train.cars.length} 个车厢`);
      } catch (err) {
        console.error(`  ✗ 插入车厢失败:`, err.message);
      }
      
      // 插入train_fares（一次性，与日期无关）
      try {
        await insertFares(train.train_no, train.fares);
        console.log(`  ✓ 插入 ${train.fares.segments.length} 个票价段`);
      } catch (err) {
        console.error(`  ✗ 插入票价失败:`, err.message);
      }
      
      // 为每个日期插入trains表数据
      for (const date of dates) {
        try {
          // 插入trains表
          await insertTrain(train, date);
          totalInserted++;
        } catch (err) {
          if (err.message && err.message.includes('UNIQUE constraint failed')) {
            totalSkipped++;
          } else {
            console.error(`  ✗ 插入 ${date} 失败:`, err.message);
            throw err;
          }
        }
      }
      
      console.log(`  ✓ 完成 ${dates.length} 天的trains表数据插入`);
    }
    
    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 数据插入完成！');
    console.log(`📊 统计:`);
    console.log(`   - 车次数量: ${trainInfo.length}`);
    console.log(`   - 日期范围: ${dates.length}天`);
    console.log(`   - 新增记录: ${totalInserted}`);
    console.log(`   - 跳过记录: ${totalSkipped} (已存在)`);
    console.log('='.repeat(60));
    
  } catch (error) {
    // 回滚事务
    await new Promise((resolve) => {
      db.run('ROLLBACK', () => resolve());
    });
    
    console.error('\n❌ 插入失败，已回滚:', error);
    throw error;
  } finally {
    db.close();
  }
}

// 运行
insertAllTrains().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


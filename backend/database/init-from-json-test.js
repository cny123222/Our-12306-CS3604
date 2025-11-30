const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库路径
const dbPath = path.join(__dirname, 'railway.db');
const jsonPath = path.join(__dirname, '../../requirements/03-车次列表页/车次信息.json');

// 读取车次JSON数据
const allTrainData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// ⚠️ 测试模式：只使用前5个车次，只生成3天数据
const TEST_TRAIN_COUNT = 5;
const TEST_DATE_COUNT = 3;
const trainData = allTrainData.slice(0, TEST_TRAIN_COUNT);

console.log('🧪 测试模式：快速初始化');
console.log(`   - 车次数量: ${TEST_TRAIN_COUNT}/${allTrainData.length}`);
console.log(`   - 日期天数: ${TEST_DATE_COUNT} 天\n`);

// 席别座位容量配置
const SEAT_CAPACITY = {
  '商务座': 10,
  '一等座': 65,
  '二等座': 100,
  '硬卧': 66,
  '软卧': 36,
  '餐车': 0
};

// 计算日期范围（从今天开始，只生成少量天数）
function getDateRange() {
  const dates = [];
  // 获取北京时间（UTC+8）
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const start = new Date(beijingTime.toISOString().split('T')[0]);
  
  console.log(`当前北京时间: ${beijingTime.toISOString()}`);
  console.log(`开始日期: ${start.toISOString().split('T')[0]}`);
  
  // 只生成指定天数的数据
  for (let i = 0; i < TEST_DATE_COUNT; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// 初始化数据库
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ 数据库连接失败:', err);
        reject(err);
      } else {
        console.log('✅ 数据库连接成功');
        resolve(db);
      }
    });
  });
}

// 清空现有车次数据
async function clearExistingData(db) {
  console.log('\n🧹 清空现有车次数据...');
  const tables = ['seat_status', 'seat_locks', 'train_fares', 'train_stops', 'train_cars', 'trains'];
  
  for (const table of tables) {
    await new Promise((resolve) => {
      db.run(`DELETE FROM ${table}`, (err) => {
        if (err) {
          console.log(`  清空${table}: ${err.message}`);
        } else {
          console.log(`  ✅ 清空${table}`);
        }
        resolve();
      });
    });
  }
  
  console.log('✅ 车次数据清空完成\n');
}

// 插入列车基础信息（仅一次，不按日期）
async function insertTrainBase(db, train) {
  // 插入train_stops
  for (const stop of train.stops) {
    const sql = `INSERT INTO train_stops (train_no, seq, station, arrive_time, depart_time, stop_min) VALUES (?, ?, ?, ?, ?, ?)`;
    await new Promise((resolve) => {
      db.run(sql, [train.train_no, stop.seq, stop.station, stop.arrive, stop.depart, stop.stop_min], resolve);
    });
  }
  
  // 插入train_cars
  for (const car of train.cars) {
    const sql = `INSERT INTO train_cars (train_no, car_no, seat_type) VALUES (?, ?, ?)`;
    await new Promise((resolve) => {
      db.run(sql, [train.train_no, car.car_no, car.type], resolve);
    });
  }
  
  // 插入train_fares
  for (const segment of train.fares.segments) {
    const sql = `
      INSERT INTO train_fares (
        train_no, from_station, to_station, distance_km,
        second_class_price, first_class_price, business_price,
        hard_sleeper_price, soft_sleeper_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await new Promise((resolve) => {
      db.run(sql, [
        train.train_no,
        segment.from,
        segment.to,
        segment.distance_km,
        segment.second_class || null,
        segment.first_class || null,
        segment.business || null,
        segment.hard_sleeper || null,
        segment.soft_sleeper || null
      ], resolve);
    });
  }
}

// 插入单日车次
async function insertTrainForDate(db, train, date) {
  const route = train.route;
  
  const sql = `
    INSERT INTO trains (
      train_no, departure_date, train_type, model,
      is_direct, has_air_conditioning,
      origin_station, destination_station,
      distance_km, planned_duration_min,
      departure_time, arrival_time, sale_starts_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  // 计算sale_starts_at (提前30天开售，早上8点)
  const saleDate = new Date(date);
  saleDate.setDate(saleDate.getDate() - 30);
  saleDate.setHours(8, 0, 0, 0);
  
  const params = [
    train.train_no,
    date,
    train.train_type,
    train.model,
    train.direct ? 1 : 0,
    train.air_conditioning ? 1 : 0,
    route.origin,
    route.destination,
    route.distance_km,
    route.planned_duration_min,
    route.departure_time,
    route.arrival_time,
    saleDate.toISOString()
  ];
  
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// 生成座位号（车厢号-座位序号）
function generateSeatNumber(carNo, seatIndex, seatType) {
  // 返回"车厢号-座位序号"格式，确保全局唯一
  return `${carNo}-${String(seatIndex + 1).padStart(2, '0')}`;
}

// 插入座位状态（为每个日期、每个座位、每个区间生成）
async function insertSeatsForDate(db, train, date) {
  const stops = train.stops;
  const batchSize = 500; // 批量插入
  let insertCount = 0;
  
  // 生成所有区间
  const intervals = [];
  for (let i = 0; i < stops.length - 1; i++) {
    intervals.push({
      from: stops[i].station,
      to: stops[i + 1].station
    });
  }
  
  // 为每个车厢生成座位
  const insertPromises = [];
  for (const car of train.cars) {
    if (car.type === '餐车') continue;
    
    const capacity = SEAT_CAPACITY[car.type] || 0;
    if (capacity === 0) continue;
    
    // 为每个座位生成记录
    for (let seatIdx = 0; seatIdx < capacity; seatIdx++) {
      const seatNo = generateSeatNumber(car.car_no, seatIdx, car.type);
      
      // 为每个区间生成一条座位记录
      for (const interval of intervals) {
        const sql = `
          INSERT INTO seat_status (
            train_no, departure_date, car_no, seat_no, seat_type,
            from_station, to_station, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
        `;
        
        insertPromises.push(
          new Promise((resolve) => {
            db.run(sql, [
              train.train_no,
              date,
              car.car_no,
              seatNo,
              car.type,
              interval.from,
              interval.to
            ], (err) => {
              if (err) console.error(`座位插入错误: ${err.message}`);
              insertCount++;
              if (insertCount % batchSize === 0) {
                process.stdout.write(`\r    已插入 ${insertCount} 条座位记录...`);
              }
              resolve();
            });
          })
        );
        
        // 批量执行
        if (insertPromises.length >= batchSize) {
          await Promise.all(insertPromises.splice(0, batchSize));
        }
      }
    }
  }
  
  // 执行剩余的插入
  if (insertPromises.length > 0) {
    await Promise.all(insertPromises);
  }
  
  return insertCount;
}

// 主函数
async function main() {
  console.log('\n🚀 开始初始化测试车次数据...\n');
  
  const db = await initDatabase();
  
  // 清空现有数据
  await clearExistingData(db);
  
  // 获取日期范围
  const dates = getDateRange();
  console.log(`📅 日期范围: ${dates[0]} 至 ${dates[dates.length - 1]} (共 ${dates.length} 天)`);
  console.log(`🚄 车次数量: ${trainData.length} 个 (测试模式)\n`);
  
  // 第一步：插入列车基础信息（只执行一次）
  console.log('📝 插入列车基础信息（停站、车厢、票价）...');
  for (const train of trainData) {
    await insertTrainBase(db, train);
    process.stdout.write(`\r  已处理 ${trainData.indexOf(train) + 1}/${trainData.length} 个车次`);
  }
  console.log('\n✅ 列车基础信息插入完成\n');
  
  // 第二步：为每天插入车次和座位
  console.log('📝 插入每日车次和座位数据...\n');
  
  let totalTrains = 0;
  let totalSeats = 0;
  
  for (let dateIdx = 0; dateIdx < dates.length; dateIdx++) {
    const date = dates[dateIdx];
    console.log(`\n📆 处理日期: ${date} (${dateIdx + 1}/${dates.length})`);
    
    for (let trainIdx = 0; trainIdx < trainData.length; trainIdx++) {
      const train = trainData[trainIdx];
      
      try {
        // 插入车次
        await insertTrainForDate(db, train, date);
        
        // 为所有日期插入座位
        const seatCount = await insertSeatsForDate(db, train, date);
        totalSeats += seatCount;
        process.stdout.write(`\r  ✅ ${train.train_no}: ${seatCount} 条座位记录`);
        
        totalTrains++;
        
      } catch (err) {
        console.error(`\n❌ 处理失败 [${train.train_no} ${date}]: ${err.message}`);
      }
    }
  }
  
  console.log(`\n\n✅ 测试数据初始化完成！`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 统计信息:`);
  console.log(`   - 车次总数: ${totalTrains} 条`);
  console.log(`   - 座位记录: ${totalSeats} 条`);
  console.log(`   - 日期范围: ${dates[0]} ~ ${dates[dates.length - 1]}`);
  console.log(`   - 每日车次: ${trainData.length} 个`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n💡 提示：这是测试模式，数据量较小便于快速调试`);
  console.log(`   如需完整数据，请运行: node init-from-json.js\n`);
  
  // 关闭数据库连接
  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err);
    } else {
      console.log('✅ 数据库连接已关闭\n');
    }
  });
}

// 执行
main().catch(err => {
  console.error('❌ 初始化失败:', err);
  process.exit(1);
});


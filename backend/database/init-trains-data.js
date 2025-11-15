/**
 * 车次数据初始化脚本
 * 
 * 功能：将车次信息.json中的数据导入到数据库
 * 包括：车次基本信息、停靠站点、车厢配置、票价、座位状态初始化
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
// const { pinyin } = require('pinyin'); // 暂时不使用pinyin功能

const dbPath = path.join(__dirname, 'railway.db');
const trainsJsonPath = path.join(__dirname, '../../requirements/03-车次列表页/车次信息.json');

// 读取车次信息JSON
const trainsData = JSON.parse(fs.readFileSync(trainsJsonPath, 'utf8'));

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

/**
 * 创建必要的表结构
 */
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 站点表
      db.run(`
        CREATE TABLE IF NOT EXISTS stations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          code TEXT,
          pinyin TEXT,
          short_pinyin TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('创建stations表失败:', err);
      });

      // 车次表
      db.run(`
        CREATE TABLE IF NOT EXISTS trains (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          train_no TEXT NOT NULL,
          departure_date DATE NOT NULL,
          train_type TEXT NOT NULL,
          model TEXT,
          is_direct BOOLEAN DEFAULT 1,
          has_air_conditioning BOOLEAN DEFAULT 1,
          origin_station TEXT NOT NULL,
          destination_station TEXT NOT NULL,
          distance_km INTEGER,
          planned_duration_min INTEGER,
          departure_time TEXT,
          arrival_time TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(train_no, departure_date)
        )
      `, (err) => {
        if (err) console.error('创建trains表失败:', err);
      });

      // 为trains表创建日期索引
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_trains_date ON trains(departure_date)
      `, (err) => {
        if (err) console.error('创建trains日期索引失败:', err);
      });

      // 为trains表创建车次号索引
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_trains_no ON trains(train_no)
      `, (err) => {
        if (err) console.error('创建trains车次号索引失败:', err);
      });

      // 车次停靠站表
      db.run(`
        CREATE TABLE IF NOT EXISTS train_stops (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          train_no TEXT NOT NULL,
          seq INTEGER NOT NULL,
          station TEXT NOT NULL,
          arrive_time TEXT,
          depart_time TEXT,
          stop_min INTEGER DEFAULT 0,
          FOREIGN KEY (train_no) REFERENCES trains(train_no)
        )
      `, (err) => {
        if (err) console.error('创建train_stops表失败:', err);
      });

      // 车厢配置表
      db.run(`
        CREATE TABLE IF NOT EXISTS train_cars (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          train_no TEXT NOT NULL,
          car_no INTEGER NOT NULL,
          seat_type TEXT NOT NULL,
          FOREIGN KEY (train_no) REFERENCES trains(train_no)
        )
      `, (err) => {
        if (err) console.error('创建train_cars表失败:', err);
      });

      // 票价表
      db.run(`
        CREATE TABLE IF NOT EXISTS train_fares (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          train_no TEXT NOT NULL,
          from_station TEXT NOT NULL,
          to_station TEXT NOT NULL,
          distance_km INTEGER,
          second_class_price REAL,
          first_class_price REAL,
          business_price REAL,
          hard_sleeper_price REAL,
          soft_sleeper_price REAL,
          FOREIGN KEY (train_no) REFERENCES trains(train_no)
        )
      `, (err) => {
        if (err) console.error('创建train_fares表失败:', err);
      });

      // 座位状态表
      db.run(`
        CREATE TABLE IF NOT EXISTS seat_status (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          train_no TEXT NOT NULL,
          departure_date DATE NOT NULL,
          car_no INTEGER NOT NULL,
          seat_no TEXT NOT NULL,
          seat_type TEXT NOT NULL,
          from_station TEXT NOT NULL,
          to_station TEXT NOT NULL,
          status TEXT DEFAULT 'available',
          booked_by TEXT,
          booked_at DATETIME,
          FOREIGN KEY (train_no, departure_date) REFERENCES trains(train_no, departure_date)
        )
      `, (err) => {
        if (err) console.error('创建seat_status表失败:', err);
      });

      // 为seat_status表创建复合索引
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_seat_status_train_date ON seat_status(train_no, departure_date)
      `, (err) => {
        if (err) console.error('创建seat_status复合索引失败:', err);
      });

      // 为seat_status表创建日期索引
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_seat_status_date ON seat_status(departure_date)
      `, (err) => {
        if (err) console.error('创建seat_status日期索引失败:', err);
        resolve();
      });
    });
  });
}

/**
 * 提取所有唯一的站点名称
 */
function extractStations() {
  const stationsSet = new Set();
  
  trainsData.forEach(train => {
    stationsSet.add(train.route.origin);
    stationsSet.add(train.route.destination);
    
    train.stops.forEach(stop => {
      stationsSet.add(stop.station);
    });
  });
  
  return Array.from(stationsSet);
}

/**
 * 生成站点拼音
 * @param {string} stationName - 站点名称
 * @returns {object} { fullPinyin: 全拼, shortPinyin: 简拼 }
 */
function generatePinyin(stationName) {
  try {
    // 生成全拼（不带音调）
    const fullPinyinArray = pinyin(stationName, {
      style: pinyin.STYLE_NORMAL, // 普通风格，不带声调
      heteronym: false // 不考虑多音字
    });
    const fullPinyin = fullPinyinArray.map(item => item[0]).join('');
    
    // 生成简拼（每个汉字的首字母）
    const shortPinyinArray = pinyin(stationName, {
      style: pinyin.STYLE_FIRST_LETTER, // 首字母风格
      heteronym: false
    });
    const shortPinyin = shortPinyinArray.map(item => item[0]).join('');
    
    return { fullPinyin, shortPinyin };
  } catch (error) {
    console.error(`生成拼音失败 (${stationName}):`, error);
    // 降级处理
    return {
      fullPinyin: stationName,
      shortPinyin: stationName.substring(0, 1)
    };
  }
}

/**
 * 插入站点数据
 */
function insertStations() {
  return new Promise((resolve, reject) => {
    const stations = extractStations();
    
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO stations (name, code, pinyin, short_pinyin)
      VALUES (?, ?, ?, ?)
    `);
    
    stations.forEach(station => {
      // 生成站点代码（简化处理，取前两个汉字）
      const code = station.substring(0, 2);
      
      // 生成拼音
      const { fullPinyin, shortPinyin } = generatePinyin(station);
      
      stmt.run(station, code, fullPinyin, shortPinyin);
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else {
        console.log(`成功插入 ${stations.length} 个站点`);
        resolve();
      }
    });
  });
}

/**
 * 生成未来14天的日期列表（包括今天）
 */
function generateNext14Days() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * 插入车次基本信息
 * 为每个车次创建未来14天的记录
 */
function insertTrains() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO trains (
        train_no, departure_date, train_type, model, is_direct, has_air_conditioning,
        origin_station, destination_station, distance_km, planned_duration_min,
        departure_time, arrival_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const dates = generateNext14Days();
    let totalInserted = 0;
    
    trainsData.forEach(train => {
      // 为每个车次创建未来14天的记录
      dates.forEach(date => {
        stmt.run(
          train.train_no,
          date,
          train.train_type,
          train.model,
          train.direct ? 1 : 0,
          train.air_conditioning ? 1 : 0,
          train.route.origin,
          train.route.destination,
          train.route.distance_km,
          train.route.planned_duration_min,
          train.route.departure_time,
          train.route.arrival_time
        );
        totalInserted++;
      });
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else {
        console.log(`成功插入 ${totalInserted} 个车次记录 (${trainsData.length} 个车次 × 14 天)`);
        resolve();
      }
    });
  });
}

/**
 * 插入车次停靠站信息
 */
function insertTrainStops() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO train_stops (train_no, seq, station, arrive_time, depart_time, stop_min)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    let totalStops = 0;
    
    trainsData.forEach(train => {
      train.stops.forEach(stop => {
        stmt.run(
          train.train_no,
          stop.seq,
          stop.station,
          stop.arrive,
          stop.depart,
          stop.stop_min
        );
        totalStops++;
      });
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else {
        console.log(`成功插入 ${totalStops} 个停靠站记录`);
        resolve();
      }
    });
  });
}

/**
 * 插入车厢配置信息
 */
function insertTrainCars() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO train_cars (train_no, car_no, seat_type)
      VALUES (?, ?, ?)
    `);
    
    let totalCars = 0;
    
    trainsData.forEach(train => {
      train.cars.forEach(car => {
        stmt.run(train.train_no, car.car_no, car.type);
        totalCars++;
      });
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else {
        console.log(`成功插入 ${totalCars} 个车厢配置`);
        resolve();
      }
    });
  });
}

/**
 * 插入票价信息
 */
function insertTrainFares() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO train_fares (
        train_no, from_station, to_station, distance_km,
        second_class_price, first_class_price, business_price,
        hard_sleeper_price, soft_sleeper_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let totalFares = 0;
    
    trainsData.forEach(train => {
      if (train.fares && train.fares.segments) {
        train.fares.segments.forEach(segment => {
          stmt.run(
            train.train_no,
            segment.from,
            segment.to,
            segment.distance_km,
            segment.second_class || null,
            segment.first_class || null,
            segment.business || null,
            segment.hard_sleeper || null,
            segment.soft_sleeper || null
          );
          totalFares++;
        });
      }
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else {
        console.log(`成功插入 ${totalFares} 个票价记录`);
        resolve();
      }
    });
  });
}

/**
 * 初始化座位状态
 * 为每个车厢生成座位并设置初始状态为可用
 * 为每个日期的车次创建独立的座位状态记录
 */
function initializeSeatStatus() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO seat_status (train_no, departure_date, car_no, seat_no, seat_type, from_station, to_station, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
    `);
    
    let totalSeats = 0;
    const dates = generateNext14Days();
    
    trainsData.forEach(train => {
      // 为每个日期创建座位状态
      dates.forEach(date => {
        train.cars.forEach(car => {
          if (car.type !== '餐车') {
            // 为每个非餐车车厢生成座位
            const seatCount = getSeatCountByType(car.type);
            
            for (let i = 1; i <= seatCount; i++) {
              const seatNo = `${car.car_no}-${String(i).padStart(2, '0')}`;
              
              // 为车次的每个区间段初始化座位状态
              for (let j = 0; j < train.stops.length - 1; j++) {
                stmt.run(
                  train.train_no,
                  date,
                  car.car_no,
                  seatNo,
                  car.type,
                  train.stops[j].station,
                  train.stops[j + 1].station
                );
                totalSeats++;
              }
            }
          }
        });
      });
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else {
        console.log(`成功初始化 ${totalSeats} 个座位状态记录 (14天)`);
        resolve();
      }
    });
  });
}

/**
 * 根据席别类型获取座位数量
 */
function getSeatCountByType(seatType) {
  const seatCounts = {
    '商务座': 10,
    '一等座': 40,
    '二等座': 80,
    '软卧': 30,
    '硬卧': 60
  };
  
  return seatCounts[seatType] || 50;
}

/**
 * 主函数
 */
async function main() {
  console.log('开始初始化车次数据...');
  
  try {
    await createTables();
    console.log('数据库表创建完成');
    
    await insertStations();
    await insertTrains();
    await insertTrainStops();
    await insertTrainCars();
    await insertTrainFares();
    await initializeSeatStatus();
    
    console.log('车次数据初始化完成！');
  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    db.close();
  }
}

// 执行初始化
if (require.main === module) {
  main();
}

module.exports = { main };

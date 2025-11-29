const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

/**
 * 初始化测试数据库
 */
async function initTestDatabase(dbPath) {
  // 预先生成加密密码
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.serialize(() => {
      // 创建stations表
      db.run(`
        CREATE TABLE IF NOT EXISTS stations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          code TEXT,
          pinyin TEXT,
          short_pinyin TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 创建trains表（支持多日期）
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
      `);
      
      // 为trains表创建日期索引
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_trains_date ON trains(departure_date)
      `);
      
      // 为trains表创建车次号索引
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_trains_no ON trains(train_no)
      `);
      
      // 创建train_stops表
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
      `);
      
      // 创建train_cars表
      db.run(`
        CREATE TABLE IF NOT EXISTS train_cars (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          train_no TEXT NOT NULL,
          car_no INTEGER NOT NULL,
          seat_type TEXT NOT NULL,
          FOREIGN KEY (train_no) REFERENCES trains(train_no)
        )
      `);
      
      // 创建train_fares表
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
      `);
      
      // 创建seat_status表（支持多日期）
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
      `);
      
      // 为seat_status表创建索引
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_seat_status_train_date ON seat_status(train_no, departure_date)
      `);
      
      // 插入测试站点数据
      const stations = [
        ['北京南', 'BJS', 'beijingnan', 'bjn'],
        ['上海虹桥', 'SHH', 'shanghaihongqiao', 'shhq'],
        ['沧州西', 'CZX', 'cangzhouxi', 'czx'],
        ['济南西', 'JNX', 'jinanxi', 'jnx'],
        ['徐州东', 'XZD', 'xuzoudong', 'xzd'],
        ['宿州东', 'SZD', 'suzhoudong', 'szd'],
        ['蚌埠南', 'BBN', 'bangbunan', 'bbn'],
        ['南京南', 'NJN', 'nanjingnan', 'njn'],
        ['无锡东', 'WXD', 'wuxidong', 'wxd']
      ];
      
      const stmtStation = db.prepare('INSERT OR IGNORE INTO stations (name, code, pinyin, short_pinyin) VALUES (?, ?, ?, ?)');
      stations.forEach(station => {
        stmtStation.run(station);
      });
      stmtStation.finalize();
      
      // 插入测试车次数据（使用当前日期和未来日期）
      const trainDate = new Date();
      const todayStr = trainDate.toISOString().split('T')[0];
      const tomorrow = new Date(trainDate);
      tomorrow.setDate(trainDate.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      db.run(`
        INSERT OR REPLACE INTO trains (
          train_no, departure_date, train_type, model, is_direct, has_air_conditioning,
          origin_station, destination_station, distance_km, planned_duration_min,
          departure_time, arrival_time
        ) VALUES 
          ('G103', ?, '高速动车组', 'CR400AF-B', 1, 1, '北京南', '上海虹桥', 1318, 338, '06:20', '11:58'),
          ('G103', ?, '高速动车组', 'CR400AF-B', 1, 1, '北京南', '上海虹桥', 1318, 338, '06:20', '11:58'),
          ('G16', ?, '高速动车组', 'CR400AF-B', 1, 1, '上海虹桥', '北京南', 1318, 338, '06:20', '11:58')
      `, [todayStr, tomorrowStr, todayStr]);
      
      // 插入测试停靠站数据
      const stops = [
        ['G103', 1, '北京南', null, '06:20', 0],
        ['G103', 2, '沧州西', '07:13', '07:15', 2],
        ['G103', 3, '济南西', '08:01', '08:04', 3],
        ['G103', 4, '徐州东', '09:07', '09:09', 2],
        ['G103', 5, '宿州东', '09:28', '09:33', 5],
        ['G103', 6, '蚌埠南', '09:56', '09:58', 2],
        ['G103', 7, '南京南', '10:40', '10:43', 3],
        ['G103', 8, '无锡东', '11:27', '11:29', 2],
        ['G103', 9, '上海虹桥', '11:58', '11:58', 0]
      ];
      
      const stmtStop = db.prepare('INSERT INTO train_stops (train_no, seq, station, arrive_time, depart_time, stop_min) VALUES (?, ?, ?, ?, ?, ?)');
      stops.forEach(stop => {
        stmtStop.run(stop);
      });
      stmtStop.finalize();
      
      // 插入测试车厢配置
      const cars = [
        ['G103', 1, '商务座'],
        ['G103', 2, '一等座'],
        ['G103', 3, '一等座'],
        ['G103', 4, '二等座'],
        ['G103', 5, '二等座'],
        ['G103', 6, '二等座'],
        ['G103', 7, '二等座'],
        ['G103', 8, '二等座']
      ];
      
      const stmtCar = db.prepare('INSERT INTO train_cars (train_no, car_no, seat_type) VALUES (?, ?, ?)');
      cars.forEach(car => {
        stmtCar.run(car);
      });
      stmtCar.finalize();
      
      // 插入测试票价
      const fares = [
        ['G103', '北京南', '沧州西', 210, 116, 185, 404, null, null],
        ['G103', '沧州西', '济南西', 196, 107, 172, 378, null, null],
        ['G103', '济南西', '徐州东', 286, 147, 235, 513, null, null],
        ['G103', '徐州东', '宿州东', 68, 34, 54, 118, null, null],
        ['G103', '宿州东', '蚌埠南', 88, 43, 70, 152, null, null],
        ['G103', '蚌埠南', '南京南', 175, 86, 136, 299, null, null],
        ['G103', '南京南', '无锡东', 187, 82, 132, 288, null, null],
        ['G103', '无锡东', '上海虹桥', 108, 47, 76, 166, null, null]
      ];
      
      const stmtFare = db.prepare(`
        INSERT INTO train_fares (
          train_no, from_station, to_station, distance_km,
          second_class_price, first_class_price, business_price,
          hard_sleeper_price, soft_sleeper_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      fares.forEach(fare => {
        stmtFare.run(fare);
      });
      stmtFare.finalize();
      
      // 初始化座位状态（简化版，为今天和明天的G103车次创建座位）
      const seatTypes = [
        { type: '商务座', carNo: 1, count: 10 },
        { type: '一等座', carNo: 2, count: 40 },
        { type: '二等座', carNo: 4, count: 80 }
      ];
      
      const stmtSeat = db.prepare(`
        INSERT INTO seat_status (train_no, departure_date, car_no, seat_no, seat_type, from_station, to_station, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
      `);
      
      // 为今天和明天的G103车次创建座位状态
      [todayStr, tomorrowStr].forEach(departureDate => {
        seatTypes.forEach(({ type, carNo, count }) => {
          for (let i = 1; i <= count; i++) {
            const seatNo = `${carNo}-${String(i).padStart(2, '0')}`;
            // 为每个区间段初始化座位状态
            for (let j = 0; j < stops.length - 1; j++) {
              stmtSeat.run([
                'G103',
                departureDate,
                carNo,
                seatNo,
                type,
                stops[j][2],  // from_station
                stops[j + 1][2]  // to_station
              ]);
            }
          }
        });
      });
      
      stmtSeat.finalize();
      
      // 创建users表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          email TEXT,
          phone TEXT UNIQUE NOT NULL,
          id_card_type TEXT,
          id_card_number TEXT,
          discount_type TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `);
      
      // 插入测试用户（使用加密密码）
      db.run(`
        INSERT OR REPLACE INTO users (
          id, username, name, email, phone, id_card_type, id_card_number, discount_type, password
        ) VALUES 
          (1, 'test-user-123', '张三', 'test@example.com', '15888889968', '居民身份证', '310101199001011234', '成人', ?),
          (2, 'user-no-orders', '李四', '', '13800138000', '居民身份证', '310101199002022345', '成人', ?)
      `, [hashedPassword, hashedPassword]);
      
      // 创建passengers表
      db.run(`
        CREATE TABLE IF NOT EXISTS passengers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          id_card_type TEXT NOT NULL,
          id_card_number TEXT NOT NULL,
          phone TEXT,
          discount_type TEXT DEFAULT '成人',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      
      // 插入测试乘客
      db.run(`
        INSERT OR REPLACE INTO passengers (
          id, user_id, name, id_card_type, id_card_number, phone, discount_type, created_at
        ) VALUES 
          (1, 1, '张三', '居民身份证', '310101199001011234', '13800138000', '成人', '2025-01-01'),
          (2, 2, '王五', '居民身份证', '310101199005055678', '13900139000', '成人', '2025-01-01')
      `);
      
      // 创建orders表
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          train_number TEXT NOT NULL,
          departure_station TEXT NOT NULL,
          arrival_station TEXT NOT NULL,
          departure_date TEXT NOT NULL,
          departure_time TEXT,
          arrival_time TEXT,
          total_price REAL NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          payment_expires_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      
      // 创建订单明细表
      db.run(`
        CREATE TABLE IF NOT EXISTS order_details (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL,
          passenger_id TEXT NOT NULL,
          passenger_name TEXT NOT NULL,
          id_card_type TEXT NOT NULL,
          id_card_number TEXT NOT NULL,
          seat_type TEXT NOT NULL,
          ticket_type TEXT NOT NULL,
          price REAL NOT NULL,
          sequence_number INTEGER,
          car_number TEXT,
          seat_number TEXT,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (passenger_id) REFERENCES passengers(id)
        )
      `);
      
      // 插入测试订单（最近30天内的）
      const today = new Date();
      const recentDate = new Date(today);
      recentDate.setDate(today.getDate() - 5); // 5天前
      const recentDateStr = recentDate.toISOString().split('T')[0];
      
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 10); // 10天后
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      // 插入订单数据
      db.run(`
        INSERT OR REPLACE INTO orders (
          id, user_id, train_number, departure_station, arrival_station, 
          departure_date, departure_time, arrival_time, status, total_price, created_at
        ) VALUES 
          ('order-1', '1', 'G1234', '北京南', '上海虹桥', '${futureDateStr}', '09:00', '13:30', 'paid', 
           553.5, '${recentDateStr}'),
          ('order-2', '1', 'G5678', '上海虹桥', '北京南', '${futureDateStr}', '14:00', '18:30', 'paid', 
           553.5, '${recentDateStr}')
      `);
      
      // 插入订单明细数据
      db.run(`
        INSERT OR REPLACE INTO order_details (
          order_id, passenger_id, passenger_name, id_card_type, id_card_number,
          seat_type, ticket_type, price, sequence_number, car_number, seat_number
        ) VALUES 
          ('order-1', '1', '张三', '居民身份证', '310101199001011234',
           '二等座', '成人票', 553.5, 1, '06', '07D'),
          ('order-2', '1', '张三', '居民身份证', '310101199001011234',
           '二等座', '成人票', 553.5, 1, '08', '12A')
      `, () => {
        db.close();
        console.log('测试数据库初始化完成');
        resolve();
      });
    });
  });
}

module.exports = { initTestDatabase };


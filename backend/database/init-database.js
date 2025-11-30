const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'railway.db');

console.log('\n🚀 开始初始化数据库表结构...\n');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err);
    process.exit(1);
  } else {
    console.log('✅ 数据库连接成功');
    createAllTables();
  }
});

// 创建所有数据库表
function createAllTables() {
  console.log('\n📋 创建数据库表结构...');
  
  const tables = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS users (
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
      last_login DATETIME,
      UNIQUE(id_card_type, id_card_number)
    )`,
    
    // 短信验证码表
    `CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      sent_status TEXT DEFAULT 'sent',
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      purpose TEXT DEFAULT 'login'
    )`,
    
    // 邮箱验证码表
    `CREATE TABLE IF NOT EXISTS email_verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      sent_status TEXT DEFAULT 'sent',
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 会话表
    `CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      user_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )`,
    
    // 乘客表
    `CREATE TABLE IF NOT EXISTS passengers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      id_card_type TEXT NOT NULL,
      id_card_number TEXT NOT NULL,
      discount_type TEXT NOT NULL,
      phone TEXT,
      points INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    // 订单表
    `CREATE TABLE IF NOT EXISTS orders (
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
    )`,
    
    // 订单明细表
    `CREATE TABLE IF NOT EXISTS order_details (
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
    )`,
    
    // 订单取消记录表
    `CREATE TABLE IF NOT EXISTS order_cancellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      cancellation_date DATE NOT NULL,
      count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, cancellation_date)
    )`,
    
    // 车次表
    `CREATE TABLE IF NOT EXISTS trains (
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
      sale_starts_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(train_no, departure_date)
    )`,
    
    // 车次停靠站表
    `CREATE TABLE IF NOT EXISTS train_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_no TEXT NOT NULL,
      seq INTEGER NOT NULL,
      station TEXT NOT NULL,
      arrive_time TEXT,
      depart_time TEXT,
      stop_min INTEGER DEFAULT 0,
      FOREIGN KEY (train_no) REFERENCES trains(train_no)
    )`,
    
    // 车厢配置表
    `CREATE TABLE IF NOT EXISTS train_cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_no TEXT NOT NULL,
      car_no INTEGER NOT NULL,
      seat_type TEXT NOT NULL,
      FOREIGN KEY (train_no) REFERENCES trains(train_no)
    )`,
    
    // 票价表
    `CREATE TABLE IF NOT EXISTS train_fares (
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
    )`,
    
    // 座位状态表
    `CREATE TABLE IF NOT EXISTS seat_status (
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
    )`,
    
    // 座位锁定表
    `CREATE TABLE IF NOT EXISTS seat_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      train_no TEXT NOT NULL,
      departure_date DATE NOT NULL,
      car_no INTEGER NOT NULL,
      seat_no TEXT NOT NULL,
      from_station TEXT NOT NULL,
      to_station TEXT NOT NULL,
      locked_by TEXT NOT NULL,
      locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )`
  ];
  
  const indexes = [
    // Train-related indexes
    'CREATE INDEX IF NOT EXISTS idx_trains_date ON trains(departure_date)',
    'CREATE INDEX IF NOT EXISTS idx_trains_no ON trains(train_no)',
    'CREATE INDEX IF NOT EXISTS idx_seat_status_train_date ON seat_status(train_no, departure_date)',
    'CREATE INDEX IF NOT EXISTS idx_seat_status_date ON seat_status(departure_date)',
    
    // User and passenger indexes
    'CREATE INDEX IF NOT EXISTS idx_passengers_user_id ON passengers(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_passengers_id_card ON passengers(id_card_number)',
    
    // Order indexes
    'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_orders_payment_expires ON orders(payment_expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id)',
    
    // Cancellation indexes
    'CREATE INDEX IF NOT EXISTS idx_cancellations_user_date ON order_cancellations(user_id, cancellation_date)'
  ];
  
  let completed = 0;
  const total = tables.length + indexes.length;
  
  // 创建表
  db.serialize(() => {
    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`  ❌ 创建表失败: ${err.message}`);
        } else {
          completed++;
          process.stdout.write(`\r  创建表中... ${completed}/${total}`);
        }
      });
    });
    
    // 创建索引
    indexes.forEach((sql) => {
      db.run(sql, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.log(`\n  ⚠️  创建索引警告: ${err.message}`);
        }
        completed++;
        process.stdout.write(`\r  创建表和索引... ${completed}/${total}`);
      });
    });
    
    // 完成
    db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
      console.log('\n\n✅ 数据库表结构创建完成！');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 创建的表包括:');
      console.log('   - 用户管理: users, verification_codes, email_verification_codes, sessions');
      console.log('   - 乘客订单: passengers, orders, order_details, order_cancellations');
      console.log('   - 车次管理: trains, train_stops, train_cars, train_fares');
      console.log('   - 座位管理: seat_status, seat_locks');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      db.close((err) => {
        if (err) {
          console.error('关闭数据库失败:', err);
        } else {
          console.log('✅ 数据库连接已关闭\n');
          console.log('💡 提示：');
          console.log('   - 运行 node init-from-json.js 来初始化车次数据');
          console.log('   - 运行 node init-from-json-test.js 来快速初始化少量测试数据\n');
        }
      });
    });
  });
}


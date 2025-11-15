const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'railway.db');
const db = new sqlite3.Database(dbPath);

console.log('初始化乘客和订单表...');

db.serialize(() => {
  // 创建乘客表
  db.run(`
    CREATE TABLE IF NOT EXISTS passengers (
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
      FOREIGN KEY (user_id) REFERENCES users(userId)
    )
  `, (err) => {
    if (err) {
      console.error('创建passengers表失败:', err);
    } else {
      console.log('✓ passengers表创建成功');
    }
  });

  // 创建订单表
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
      FOREIGN KEY (user_id) REFERENCES users(userId),
      FOREIGN KEY (train_number) REFERENCES trains(trainNumber)
    )
  `, (err) => {
    if (err) {
      console.error('创建orders表失败:', err);
    } else {
      console.log('✓ orders表创建成功');
    }
  });

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
  `, (err) => {
    if (err) {
      console.error('创建order_details表失败:', err);
    } else {
      console.log('✓ order_details表创建成功');
    }
  });

  // 创建座位锁定表
  db.run(`
    CREATE TABLE IF NOT EXISTS seat_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      train_number TEXT NOT NULL,
      seat_type TEXT NOT NULL,
      car_number TEXT,
      seat_number TEXT,
      locked_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建seat_locks表失败:', err);
    } else {
      console.log('✓ seat_locks表创建成功');
    }
  });

  // 创建索引
  db.run('CREATE INDEX IF NOT EXISTS idx_passengers_user_id ON passengers(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_passengers_id_card ON passengers(id_card_number)');
  db.run('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id)');

  console.log('✓ 索引创建完成');
});

db.close((err) => {
  if (err) {
    console.error('关闭数据库失败:', err);
  } else {
    console.log('✓ 数据库初始化完成');
  }
});

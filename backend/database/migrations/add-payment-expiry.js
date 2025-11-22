const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 迁移脚本应该使用相对于脚本位置的数据库路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../railway.db');
console.log('数据库路径:', dbPath);
const db = new sqlite3.Database(dbPath);

console.log('开始迁移：添加支付相关字段...');

db.serialize(() => {
  // 添加 payment_expires_at 字段到 orders 表
  db.run(`
    ALTER TABLE orders 
    ADD COLUMN payment_expires_at DATETIME
  `, (err) => {
    if (err) {
      // 如果字段已存在，忽略错误
      if (err.message.includes('duplicate column')) {
        console.log('✓ payment_expires_at 字段已存在，跳过');
      } else {
        console.error('添加 payment_expires_at 字段失败:', err);
      }
    } else {
      console.log('✓ payment_expires_at 字段添加成功');
    }
  });

  // 创建订单取消记录表（用于跟踪每日取消次数）
  db.run(`
    CREATE TABLE IF NOT EXISTS order_cancellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      cancellation_date DATE NOT NULL,
      count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, cancellation_date)
    )
  `, (err) => {
    if (err) {
      console.error('创建 order_cancellations 表失败:', err);
    } else {
      console.log('✓ order_cancellations 表创建成功');
    }
  });

  // 创建索引
  db.run('CREATE INDEX IF NOT EXISTS idx_orders_payment_expires ON orders(payment_expires_at)', (err) => {
    if (err && !err.message.includes('already exists')) {
      console.error('创建索引失败:', err);
    } else {
      console.log('✓ 索引创建完成');
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_cancellations_user_date ON order_cancellations(user_id, cancellation_date)', (err) => {
    if (err && !err.message.includes('already exists')) {
      console.error('创建索引失败:', err);
    } else {
      console.log('✓ 取消记录索引创建完成');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('关闭数据库失败:', err);
  } else {
    console.log('✓ 数据库迁移完成');
  }
});


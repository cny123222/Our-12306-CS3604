const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../railway.db');
const db = new sqlite3.Database(dbPath);

console.log('开始更新 order_cancellations 表结构...');

db.serialize(() => {
  // Drop old table
  db.run('DROP TABLE IF EXISTS order_cancellations', (err) => {
    if (err) {
      console.error('❌ 删除旧表失败:', err);
    } else {
      console.log('✓ 旧表已删除');
    }
  });
  
  // Create new table with individual records
  db.run(`
    CREATE TABLE order_cancellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      order_id TEXT,
      cancellation_date DATE NOT NULL,
      cancelled_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ 创建 order_cancellations 表失败:', err);
    } else {
      console.log('✓ order_cancellations 表重建成功');
    }
  });
  
  // Create index
  db.run('CREATE INDEX IF NOT EXISTS idx_cancellations_user_date ON order_cancellations(user_id, cancellation_date)', (err) => {
    if (err) {
      console.error('❌ 创建索引失败:', err);
    } else {
      console.log('✓ 索引创建成功');
    }
    
    // Close database after all operations
    db.close((err) => {
      if (err) {
        console.error('❌ 关闭数据库失败:', err);
      } else {
        console.log('✓ 数据库迁移完成');
      }
    });
  });
});


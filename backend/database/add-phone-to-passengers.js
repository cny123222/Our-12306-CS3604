const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'railway.db');
const db = new sqlite3.Database(dbPath);

console.log('为 passengers 表添加 phone 字段...');

db.serialize(() => {
  // 检查 phone 字段是否已存在
  db.all("PRAGMA table_info(passengers)", (err, columns) => {
    if (err) {
      console.error('查询表结构失败:', err);
      db.close();
      return;
    }

    const hasPhone = columns.some(col => col.name === 'phone');
    
    if (hasPhone) {
      console.log('✓ phone 字段已存在');
      db.close();
      return;
    }

    // 添加 phone 字段
    db.run(`ALTER TABLE passengers ADD COLUMN phone TEXT`, (err) => {
      if (err) {
        console.error('添加 phone 字段失败:', err);
      } else {
        console.log('✓ 成功添加 phone 字段到 passengers 表');
      }
      
      db.close((err) => {
        if (err) {
          console.error('关闭数据库失败:', err);
        } else {
          console.log('✓ 数据库迁移完成');
        }
      });
    });
  });
});










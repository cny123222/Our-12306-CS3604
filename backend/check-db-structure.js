const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'railway.db');
const db = new sqlite3.Database(dbPath);

// 查看passengers表结构
db.all(`PRAGMA table_info(passengers)`, [], (err, columns) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  console.log('passengers 表结构:');
  columns.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
  
  // 查看一个示例数据
  db.all(`SELECT * FROM passengers LIMIT 1`, [], (err, rows) => {
    if (err) {
      console.error('查询数据失败:', err);
    } else if (rows.length > 0) {
      console.log('\n示例数据:');
      console.log(rows[0]);
    }
    
    db.close();
  });
});


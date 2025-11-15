/**
 * 删除测试用户的订单
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/railway.db');

console.log('删除测试订单...');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 无法连接数据库:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到数据库');
});

db.serialize(() => {
  // 1. 查找张三用户
  db.all(`
    SELECT id, username, name 
    FROM users 
    WHERE name = '张三' OR username LIKE '%test%'
  `, [], (err, users) => {
    if (err) {
      console.error('❌ 查询用户失败:', err.message);
    } else {
      console.log('\n📊 找到的测试用户:');
      users.forEach(user => {
        console.log(`  ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}`);
      });
      
      const testUserIds = users.map(u => u.id);
      
      if (testUserIds.length > 0) {
        // 2. 查看这些用户的订单数量
        db.all(`
          SELECT user_id, COUNT(*) as count
          FROM orders
          WHERE user_id IN (${testUserIds.map(() => '?').join(',')})
          GROUP BY user_id
        `, testUserIds, (err, counts) => {
          if (err) {
            console.error('❌ 统计失败:', err.message);
          } else {
            console.log('\n📊 这些用户的订单统计:');
            counts.forEach(c => {
              console.log(`  user_id: ${c.user_id}, 订单数: ${c.count}`);
            });
          }
        });
      }
    }
  });
  
  // 3. 删除user_id为"user-test-1"的订单
  setTimeout(() => {
    db.run(`DELETE FROM orders WHERE user_id = 'user-test-1'`, [], function(err) {
      if (err) {
        console.error('❌ 删除失败:', err.message);
      } else {
        console.log(`\n✅ 删除了 ${this.changes} 个user-test-1的订单`);
      }
      
      // 4. 显示剩余的订单
      db.all(`
        SELECT user_id, COUNT(*) as count
        FROM orders
        GROUP BY user_id
      `, [], (err, rows) => {
        if (err) {
          console.error('❌ 查询失败:', err.message);
        } else {
          console.log('\n📊 剩余订单分组:');
          rows.forEach(row => {
            console.log(`  user_id: ${row.user_id}, 订单数: ${row.count}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('\n✅ 完成');
          }
        });
      });
    });
  }, 1000);
});


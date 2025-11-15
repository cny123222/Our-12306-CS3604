/**
 * 检查刘嘉敏用户的订单情况
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/railway.db');

console.log('检查刘嘉敏用户的订单...');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 无法连接数据库:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到数据库');
});

db.serialize(() => {
  // 1. 查找用户名包含"刘嘉敏"或"od12322"的用户
  db.all(`
    SELECT id, username, name, phone, typeof(id) as id_type
    FROM users 
    WHERE username LIKE '%od12322%' OR name LIKE '%刘嘉敏%' OR username LIKE '%刘嘉敏%'
  `, [], (err, rows) => {
    if (err) {
      console.error('❌ 查询用户失败:', err.message);
    } else {
      console.log('\n📊 找到的用户:');
      if (rows.length === 0) {
        console.log('  未找到匹配的用户');
      } else {
        rows.forEach(row => {
          console.log(`  用户ID: ${row.id}, 用户名: ${row.username}, 姓名: ${row.name}, 电话: ${row.phone}, ID类型: ${row.id_type}`);
          
          // 2. 查找该用户的订单
          db.all(`
            SELECT 
              id as order_id,
              user_id,
              train_number,
              departure_station,
              arrival_station,
              departure_date,
              status,
              created_at,
              typeof(user_id) as user_id_type
            FROM orders 
            WHERE user_id = ? OR user_id = CAST(? AS TEXT)
            ORDER BY created_at DESC
          `, [row.id, row.id], (err, orders) => {
            if (err) {
              console.error(`  ❌ 查询订单失败:`, err.message);
            } else {
              console.log(`  \n  该用户的订单数量: ${orders.length}`);
              if (orders.length > 0) {
                console.log('  订单详情:');
                orders.forEach(order => {
                  console.log(`    - 订单ID: ${order.order_id}`);
                  console.log(`      user_id: ${order.user_id} (类型: ${order.user_id_type})`);
                  console.log(`      车次: ${order.train_number}`);
                  console.log(`      ${order.departure_station} → ${order.arrival_station}`);
                  console.log(`      出发日期: ${order.departure_date}`);
                  console.log(`      状态: ${order.status}`);
                  console.log(`      创建时间: ${order.created_at}`);
                });
              } else {
                console.log('  ⚠️  该用户暂无订单');
              }
            }
          });
        });
      }
    }
  });

  // 3. 查看所有订单的user_id值
  setTimeout(() => {
    db.all(`
      SELECT DISTINCT user_id, COUNT(*) as count, typeof(user_id) as type
      FROM orders
      GROUP BY user_id
    `, [], (err, rows) => {
      if (err) {
        console.error('❌ 查询订单user_id分组失败:', err.message);
      } else {
        console.log('\n📊 所有订单的user_id分组:');
        rows.forEach(row => {
          console.log(`  user_id: ${row.user_id}, 订单数: ${row.count}, 类型: ${row.type}`);
        });
      }
      
      // 关闭数据库
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库失败:', err.message);
        } else {
          console.log('\n✅ 检查完成');
        }
      });
    });
  }, 1000);
});


/**
 * 检查用户表和订单表的匹配情况
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/railway.db');

console.log('检查用户和订单匹配情况...');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 无法连接数据库:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到数据库');
});

db.serialize(() => {
  // 1. 查看用户表结构和数据
  db.all('SELECT id, username, typeof(id) as id_type FROM users LIMIT 10', [], (err, rows) => {
    if (err) {
      console.error('❌ 查询用户失败:', err.message);
    } else {
      console.log('\n📊 用户表样本:');
      rows.forEach(row => {
        console.log(`  用户ID: ${row.id}, 用户名: ${row.username}, ID类型: ${row.id_type}`);
      });
    }
  });

  // 2. 查看订单表中的user_id
  db.all('SELECT DISTINCT user_id, typeof(user_id) as user_id_type FROM orders', [], (err, rows) => {
    if (err) {
      console.error('❌ 查询订单user_id失败:', err.message);
    } else {
      console.log('\n📊 订单表中的唯一user_id:');
      rows.forEach(row => {
        console.log(`  user_id: ${row.user_id}, 类型: ${row.user_id_type}`);
      });
    }
  });

  // 3. 检查订单和用户的匹配情况
  db.all(`
    SELECT 
      o.id as order_id,
      o.user_id as order_user_id,
      u.id as user_id,
      u.username,
      CASE 
        WHEN u.id IS NULL THEN '❌ 用户不存在'
        WHEN CAST(u.id AS TEXT) = o.user_id THEN '✅ 匹配（转换后）'
        WHEN u.id = o.user_id THEN '✅ 匹配（直接）'
        ELSE '❌ 不匹配'
      END as match_status
    FROM orders o
    LEFT JOIN users u ON CAST(u.id AS TEXT) = o.user_id
    LIMIT 10
  `, [], (err, rows) => {
    if (err) {
      console.error('❌ 检查匹配失败:', err.message);
    } else {
      console.log('\n📊 订单与用户匹配情况:');
      rows.forEach(row => {
        console.log(`  订单: ${row.order_id}, order.user_id: ${row.order_user_id}, user.id: ${row.user_id}, 用户名: ${row.username}, 状态: ${row.match_status}`);
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
});


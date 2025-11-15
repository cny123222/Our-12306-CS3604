/**
 * 检查乘客所有权脚本
 * 用于诊断删除权限问题
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/railway.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查乘客数据和所有权 ===\n');

// 查询所有用户
db.all('SELECT id, username, name FROM users LIMIT 10', [], (err, users) => {
  if (err) {
    console.error('查询用户失败:', err);
    return;
  }
  
  console.log('用户列表:');
  users.forEach(user => {
    console.log(`  - ID: ${user.id} (类型: ${typeof user.id}), 用户名: ${user.username}, 姓名: ${user.name}`);
  });
  console.log('');
  
  // 查询所有乘客及其所属用户
  db.all(`
    SELECT 
      p.id as passenger_id,
      p.name as passenger_name,
      p.user_id,
      u.id as user_table_id,
      u.username,
      u.name as user_real_name,
      typeof(p.user_id) as user_id_type,
      typeof(u.id) as user_table_id_type
    FROM passengers p
    LEFT JOIN users u ON p.user_id = u.id OR CAST(p.user_id AS TEXT) = CAST(u.id AS TEXT)
    LIMIT 20
  `, [], (err, passengers) => {
    if (err) {
      console.error('查询乘客失败:', err);
      db.close();
      return;
    }
    
    console.log('乘客列表及所有权:');
    passengers.forEach(p => {
      console.log(`  - 乘客ID: ${p.passenger_id}`);
      console.log(`    乘客姓名: ${p.passenger_name}`);
      console.log(`    user_id: ${p.user_id} (类型: ${p.user_id_type})`);
      console.log(`    关联用户: ${p.username || '未找到'} (user.id: ${p.user_table_id}, 类型: ${p.user_table_id_type})`);
      console.log(`    user_id 字符串: "${String(p.user_id)}"`);
      console.log(`    user.id 字符串: "${String(p.user_table_id)}"`);
      console.log(`    字符串匹配: ${String(p.user_id) === String(p.user_table_id)}`);
      console.log('');
    });
    
    // 检查 passengers 表结构
    db.all("PRAGMA table_info(passengers)", [], (err, columns) => {
      if (err) {
        console.error('查询表结构失败:', err);
      } else {
        console.log('passengers 表结构:');
        columns.forEach(col => {
          console.log(`  - ${col.name}: ${col.type} (notnull: ${col.notnull})`);
        });
      }
      
      db.close();
      console.log('\n=== 检查完成 ===');
    });
  });
});


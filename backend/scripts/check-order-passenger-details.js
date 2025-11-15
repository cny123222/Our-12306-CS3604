/**
 * 检查订单和乘客详情
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/railway.db');

console.log('检查订单和乘客详情...');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 无法连接数据库:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到数据库');
});

db.serialize(() => {
  // 1. 查看刘嘉敏用户的信息
  db.get(`
    SELECT id, username, name, phone
    FROM users
    WHERE username = 'od12322'
  `, [], (err, user) => {
    if (err) {
      console.error('❌ 查询用户失败:', err.message);
      return;
    }
    
    if (!user) {
      console.log('❌ 未找到用户 od12322');
      return;
    }
    
    console.log('\n📊 刘嘉敏用户信息:');
    console.log(`  ID: ${user.id}`);
    console.log(`  用户名: ${user.username}`);
    console.log(`  姓名: ${user.name}`);
    console.log(`  电话: ${user.phone}`);
    
    // 2. 查看该用户的乘客信息
    db.all(`
      SELECT id, name, id_card_type, id_card_number, discount_type
      FROM passengers
      WHERE user_id = ? OR user_id = CAST(? AS TEXT)
    `, [user.id, user.id], (err, passengers) => {
      if (err) {
        console.error('❌ 查询乘客失败:', err.message);
      } else {
        console.log(`\n📊 该用户的乘客信息 (${passengers.length}个):`);
        passengers.forEach(p => {
          console.log(`  - ${p.name} (${p.id_card_type}: ${p.id_card_number}, ${p.discount_type})`);
        });
      }
    });
    
    // 3. 查看该用户最新的3个订单及其乘客信息
    db.all(`
      SELECT 
        o.id as order_id,
        o.train_number,
        o.departure_station,
        o.arrival_station,
        o.departure_date,
        o.status,
        o.created_at
      FROM orders o
      WHERE o.user_id = ? OR o.user_id = CAST(? AS TEXT)
      ORDER BY o.created_at DESC
      LIMIT 3
    `, [user.id, user.id], (err, orders) => {
      if (err) {
        console.error('❌ 查询订单失败:', err.message);
      } else {
        console.log(`\n📊 最新3个订单:`);
        
        let completed = 0;
        orders.forEach(order => {
          console.log(`\n  订单ID: ${order.order_id}`);
          console.log(`  车次: ${order.train_number}`);
          console.log(`  路线: ${order.departure_station} → ${order.arrival_station}`);
          console.log(`  日期: ${order.departure_date}`);
          console.log(`  状态: ${order.status}`);
          console.log(`  创建时间: ${order.created_at}`);
          
          // 查询该订单的乘客明细
          db.all(`
            SELECT passenger_name, seat_type, ticket_type, seat_number
            FROM order_details
            WHERE order_id = ?
          `, [order.order_id], (err, details) => {
            if (err) {
              console.error('  ❌ 查询订单明细失败:', err.message);
            } else {
              console.log(`  乘客信息:`);
              details.forEach(d => {
                console.log(`    - ${d.passenger_name}, ${d.seat_type}, ${d.ticket_type}, 座位: ${d.seat_number || '未分配'}`);
              });
            }
            
            completed++;
            if (completed === orders.length) {
              // 4. 检查是否有张三的乘客记录
              setTimeout(() => {
                db.all(`
                  SELECT DISTINCT passenger_name
                  FROM order_details
                  WHERE order_id IN (
                    SELECT id FROM orders WHERE user_id = ? OR user_id = CAST(? AS TEXT)
                  )
                `, [user.id, user.id], (err, names) => {
                  if (err) {
                    console.error('❌ 查询乘客姓名失败:', err.message);
                  } else {
                    console.log(`\n📊 该用户订单中出现的所有乘客姓名:`);
                    names.forEach(n => {
                      console.log(`  - ${n.passenger_name}`);
                    });
                    
                    const hasZhangSan = names.some(n => n.passenger_name === '张三');
                    if (hasZhangSan) {
                      console.log('\n⚠️  警告：该用户的订单中包含"张三"作为乘客！');
                    } else {
                      console.log('\n✅ 该用户的订单中没有"张三"');
                    }
                  }
                  
                  db.close();
                });
              }, 500);
            }
          });
        });
      }
    });
  });
});


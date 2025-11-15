/**
 * 修复数据库中已有订单的user_id字段
 * 将INTEGER类型的user_id转换为TEXT类型，确保与新订单一致
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/railway.db');

console.log('开始修复订单user_id字段...');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 无法连接数据库:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到数据库');
});

db.serialize(() => {
  // 1. 查看当前订单表中的user_id类型和数据
  db.all('SELECT id, user_id, typeof(user_id) as user_id_type FROM orders LIMIT 10', [], (err, rows) => {
    if (err) {
      console.error('❌ 查询订单失败:', err.message);
    } else {
      console.log('\n📊 当前订单user_id样本:');
      rows.forEach(row => {
        console.log(`  订单ID: ${row.id}, user_id: ${row.user_id}, 类型: ${row.user_id_type}`);
      });
    }
  });

  // 2. 统计需要修复的订单数量
  db.get(
    `SELECT COUNT(*) as count 
     FROM orders 
     WHERE typeof(user_id) = 'integer'`,
    [],
    (err, row) => {
      if (err) {
        console.error('❌ 统计失败:', err.message);
      } else {
        console.log(`\n📈 需要修复的订单数量: ${row.count}`);
        
        if (row.count > 0) {
          // 3. 更新所有INTEGER类型的user_id为TEXT类型
          db.run(
            `UPDATE orders 
             SET user_id = CAST(user_id AS TEXT) 
             WHERE typeof(user_id) = 'integer'`,
            [],
            function(err) {
              if (err) {
                console.error('❌ 更新失败:', err.message);
              } else {
                console.log(`✅ 成功更新 ${this.changes} 条订单记录`);
                
                // 4. 验证修复结果
                db.all(
                  `SELECT id, user_id, typeof(user_id) as user_id_type 
                   FROM orders 
                   WHERE typeof(user_id) = 'integer'`,
                  [],
                  (err, rows) => {
                    if (err) {
                      console.error('❌ 验证失败:', err.message);
                    } else if (rows.length > 0) {
                      console.log('⚠️  仍有INTEGER类型的user_id:');
                      rows.forEach(row => {
                        console.log(`  订单ID: ${row.id}, user_id: ${row.user_id}`);
                      });
                    } else {
                      console.log('✅ 所有订单的user_id已转换为TEXT类型');
                    }
                    
                    // 5. 显示修复后的样本
                    db.all('SELECT id, user_id, typeof(user_id) as user_id_type FROM orders LIMIT 10', [], (err, rows) => {
                      if (!err) {
                        console.log('\n📊 修复后的订单user_id样本:');
                        rows.forEach(row => {
                          console.log(`  订单ID: ${row.id}, user_id: ${row.user_id}, 类型: ${row.user_id_type}`);
                        });
                      }
                      
                      // 关闭数据库连接
                      db.close((err) => {
                        if (err) {
                          console.error('❌ 关闭数据库失败:', err.message);
                        } else {
                          console.log('\n✅ 修复完成，数据库已关闭');
                        }
                      });
                    });
                  }
                );
              }
            }
          );
        } else {
          console.log('✅ 无需修复，所有订单的user_id已是正确类型');
          db.close();
        }
      }
    }
  );
});


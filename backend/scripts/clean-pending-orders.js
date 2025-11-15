// 清理所有pending状态的订单
// 这个脚本会删除所有状态为pending的订单及其关联的order_details记录

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/railway.db');

console.log('开始清理pending订单...');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('成功连接到数据库');
});

// 使用事务确保数据一致性
db.serialize(() => {
  // 开始事务
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('开始事务失败:', err.message);
      db.close();
      process.exit(1);
    }
  });

  // 首先查询有多少pending订单
  db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'", (err, row) => {
    if (err) {
      console.error('查询pending订单数量失败:', err.message);
      db.run('ROLLBACK');
      db.close();
      process.exit(1);
    }

    const pendingCount = row.count;
    console.log(`找到 ${pendingCount} 个pending订单`);

    if (pendingCount === 0) {
      console.log('没有需要清理的pending订单');
      db.run('COMMIT');
      db.close();
      process.exit(0);
    }

    // 删除pending订单相关的order_details记录
    db.run(
      `DELETE FROM order_details 
       WHERE order_id IN (SELECT id FROM orders WHERE status = 'pending')`,
      function(err) {
        if (err) {
          console.error('删除order_details失败:', err.message);
          db.run('ROLLBACK');
          db.close();
          process.exit(1);
        }

        const detailsDeleted = this.changes;
        console.log(`删除了 ${detailsDeleted} 条order_details记录`);

        // 删除pending订单
        db.run(
          "DELETE FROM orders WHERE status = 'pending'",
          function(err) {
            if (err) {
              console.error('删除订单失败:', err.message);
              db.run('ROLLBACK');
              db.close();
              process.exit(1);
            }

            const ordersDeleted = this.changes;
            console.log(`删除了 ${ordersDeleted} 个pending订单`);

            // 提交事务
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('提交事务失败:', err.message);
                db.run('ROLLBACK');
                db.close();
                process.exit(1);
              }

              console.log('✅ 清理完成！');
              console.log(`总计删除: ${ordersDeleted} 个订单, ${detailsDeleted} 条订单明细`);

              // 验证结果
              db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'", (err, row) => {
                if (err) {
                  console.error('验证失败:', err.message);
                } else {
                  console.log(`验证: 剩余pending订单数量: ${row.count}`);
                }

                db.close((err) => {
                  if (err) {
                    console.error('关闭数据库失败:', err.message);
                  } else {
                    console.log('数据库已关闭');
                  }
                  process.exit(0);
                });
              });
            });
          }
        );
      }
    );
  });
});


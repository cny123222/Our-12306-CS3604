const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Pending订单超时清理服务
 * 定期检查并删除超过10分钟的pending订单
 */

// 创建数据库连接
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
    : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
  
  return new sqlite3.Database(dbPath);
}

/**
 * 清理超过10分钟的pending订单
 * @returns {Promise<{ordersDeleted: number, detailsDeleted: number}>}
 */
async function cleanupExpiredPendingOrders() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.serialize(() => {
      // 开始事务
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('[订单清理] 开始事务失败:', err.message);
          db.close();
          return reject(err);
        }
      });
      
      // 查询超过10分钟的pending订单数量
      db.get(
        `SELECT COUNT(*) as count FROM orders 
         WHERE status = 'pending' 
         AND created_at < datetime('now', '-10 minutes')`,
        (err, row) => {
          if (err) {
            console.error('[订单清理] 查询超时订单数量失败:', err.message);
            db.run('ROLLBACK');
            db.close();
            return reject(err);
          }
          
          const expiredCount = row.count;
          
          // 如果没有超时订单，直接提交事务并返回
          if (expiredCount === 0) {
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('[订单清理] 提交事务失败:', err.message);
              }
              db.close();
              resolve({ ordersDeleted: 0, detailsDeleted: 0 });
            });
            return;
          }
          
          console.log(`[订单清理] 发现 ${expiredCount} 个超时pending订单，开始清理...`);
          
          // 删除超时订单的order_details记录
          db.run(
            `DELETE FROM order_details 
             WHERE order_id IN (
               SELECT id FROM orders 
               WHERE status = 'pending' 
               AND created_at < datetime('now', '-10 minutes')
             )`,
            function(err) {
              if (err) {
                console.error('[订单清理] 删除order_details失败:', err.message);
                db.run('ROLLBACK');
                db.close();
                return reject(err);
              }
              
              const detailsDeleted = this.changes;
              console.log(`[订单清理] 删除了 ${detailsDeleted} 条order_details记录`);
              
              // 删除超时的pending订单
              db.run(
                `DELETE FROM orders 
                 WHERE status = 'pending' 
                 AND created_at < datetime('now', '-10 minutes')`,
                function(err) {
                  if (err) {
                    console.error('[订单清理] 删除订单失败:', err.message);
                    db.run('ROLLBACK');
                    db.close();
                    return reject(err);
                  }
                  
                  const ordersDeleted = this.changes;
                  console.log(`[订单清理] 删除了 ${ordersDeleted} 个超时pending订单`);
                  
                  // 提交事务
                  db.run('COMMIT', (err) => {
                    if (err) {
                      console.error('[订单清理] 提交事务失败:', err.message);
                      db.run('ROLLBACK');
                      db.close();
                      return reject(err);
                    }
                    
                    console.log(`[订单清理] ✅ 清理完成！总计删除: ${ordersDeleted} 个订单, ${detailsDeleted} 条订单明细`);
                    
                    db.close((err) => {
                      if (err) {
                        console.error('[订单清理] 关闭数据库失败:', err.message);
                      }
                      
                      resolve({ ordersDeleted, detailsDeleted });
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
}

/**
 * 启动定时清理任务
 * 每分钟检查一次，并在启动时立即执行一次清理
 */
function startCleanupScheduler() {
  console.log('[订单清理] 启动pending订单超时清理服务...');
  console.log('[订单清理] 清理规则: 超过10分钟的pending订单将被自动删除');
  console.log('[订单清理] 检查频率: 每60秒检查一次');
  
  // 立即执行一次清理
  cleanupExpiredPendingOrders()
    .then(result => {
      if (result.ordersDeleted > 0) {
        console.log(`[订单清理] 初始清理完成，删除了 ${result.ordersDeleted} 个超时订单`);
      } else {
        console.log('[订单清理] 初始清理完成，无超时订单');
      }
    })
    .catch(err => {
      console.error('[订单清理] 初始清理失败:', err.message);
    });
  
  // 设置定时任务，每分钟执行一次
  const intervalId = setInterval(() => {
    cleanupExpiredPendingOrders()
      .then(result => {
        if (result.ordersDeleted > 0) {
          console.log(`[订单清理] 定时清理完成，删除了 ${result.ordersDeleted} 个超时订单`);
        }
        // 如果没有删除订单，则不输出日志，避免日志过多
      })
      .catch(err => {
        console.error('[订单清理] 定时清理失败:', err.message);
      });
  }, 60000); // 每60秒执行一次
  
  console.log('[订单清理] ✅ 清理服务已启动');
  
  // 返回清理函数，用于优雅关闭
  return () => {
    clearInterval(intervalId);
    console.log('[订单清理] 清理服务已停止');
  };
}

module.exports = {
  cleanupExpiredPendingOrders,
  startCleanupScheduler
};


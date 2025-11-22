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
 * 先释放座位，再删除订单
 * @returns {Promise<{ordersDeleted: number, detailsDeleted: number}>}
 */
async function cleanupExpiredPendingOrders() {
  return new Promise(async (resolve, reject) => {
    const db = getDatabase();
    const orderService = require('./orderService');
    
    try {
      // 查询过期的pending订单
      const expiredOrders = await new Promise((resolve, reject) => {
        db.all(
          `SELECT id FROM orders 
         WHERE status = 'pending' 
         AND created_at < datetime('now', '-10 minutes')`,
          (err, orders) => {
            if (err) return reject(err);
            resolve(orders || []);
          }
        );
      });
      
            db.close();
      
      if (expiredOrders.length === 0) {
        return resolve({ ordersDeleted: 0, detailsDeleted: 0 });
          }
          
      console.log(`[订单清理] 发现 ${expiredOrders.length} 个超时pending订单，开始清理...`);
          
      let detailsDeleted = 0;
      let ordersDeleted = 0;
      
      // 逐个处理过期订单（不使用事务，避免数据库锁定冲突）
      for (const order of expiredOrders) {
        try {
          // 尝试释放座位锁定（releaseSeatLocks内部会打开自己的数据库连接）
          // 对于pending订单，如果有座位信息（虽然正常情况下不应该有），也会被释放
          await orderService.releaseSeatLocks(order.id);
          
          // 为每个删除操作创建新的数据库连接
          const deleteDb = getDatabase();
          
          // 删除订单明细
          const detailsResult = await new Promise((resolve, reject) => {
            deleteDb.run(
              'DELETE FROM order_details WHERE order_id = ?',
              [order.id],
              function(err) {
                if (err) return reject(err);
                resolve(this.changes);
              }
            );
          });
          detailsDeleted += detailsResult;
          
          // 删除订单
          const ordersResult = await new Promise((resolve, reject) => {
            deleteDb.run(
              'DELETE FROM orders WHERE id = ?',
              [order.id],
            function(err) {
                if (err) return reject(err);
                resolve(this.changes);
              }
            );
          });
          ordersDeleted += ordersResult;
          
          deleteDb.close();
        } catch (error) {
          console.error(`[订单清理] 清理订单 ${order.id} 失败:`, error.message);
          // 继续处理其他订单
                    }
      }
                    
                    if (ordersDeleted > 0) {
                      console.log(`[订单清理] ✅ 清理完成，删除了 ${ordersDeleted} 个订单，${detailsDeleted} 条订单明细`);
                    }
                    
                    resolve({ ordersDeleted, detailsDeleted });
    } catch (error) {
      console.error('[订单清理] 清理过程出错:', error);
      reject(error);
        }
  });
}

/**
 * 清理过期的已确认未支付订单
 * 释放座位并删除订单
 * @returns {Promise<{ordersDeleted: number, detailsDeleted: number}>}
 */
async function cleanupExpiredUnpaidOrders() {
  return new Promise(async (resolve, reject) => {
    const db = getDatabase();
    const orderService = require('./orderService');
    
    try {
      // 查询过期的已确认未支付订单
      const expiredOrders = await new Promise((resolve, reject) => {
        db.all(
          `SELECT id FROM orders 
           WHERE status = 'confirmed_unpaid' 
           AND payment_expires_at IS NOT NULL
           AND payment_expires_at < datetime('now')`,
          (err, orders) => {
            if (err) return reject(err);
            resolve(orders || []);
          }
        );
      });
      
      db.close();
      
      if (expiredOrders.length === 0) {
        return resolve({ ordersDeleted: 0, detailsDeleted: 0 });
      }
      
      console.log(`[支付清理] 发现 ${expiredOrders.length} 个过期未支付订单，开始清理...`);
      
      let detailsDeleted = 0;
      let ordersDeleted = 0;
      
      // 逐个处理过期订单（不使用事务，避免数据库锁定冲突）
      for (const order of expiredOrders) {
        try {
          // 释放座位锁定（releaseSeatLocks内部会打开自己的数据库连接）
          await orderService.releaseSeatLocks(order.id);
          
          // 为每个删除操作创建新的数据库连接
          const deleteDb = getDatabase();
          
          // 删除订单明细
          const detailsResult = await new Promise((resolve, reject) => {
            deleteDb.run(
              'DELETE FROM order_details WHERE order_id = ?',
              [order.id],
              function(err) {
                if (err) return reject(err);
                resolve(this.changes);
              }
            );
          });
          detailsDeleted += detailsResult;
          
          // 删除订单
          const ordersResult = await new Promise((resolve, reject) => {
            deleteDb.run(
              'DELETE FROM orders WHERE id = ?',
              [order.id],
              function(err) {
                if (err) return reject(err);
                resolve(this.changes);
              }
            );
          });
          ordersDeleted += ordersResult;
          
          deleteDb.close();
        } catch (error) {
          console.error(`[支付清理] 处理订单 ${order.id} 失败:`, error.message);
        }
      }
      
      if (ordersDeleted > 0) {
        console.log(`[支付清理] ✅ 清理完成，删除了 ${ordersDeleted} 个订单，${detailsDeleted} 条订单明细`);
      }
      
      resolve({ ordersDeleted, detailsDeleted });
    } catch (error) {
      db.close();
      console.error('[支付清理] 清理过程出错:', error.message);
      reject(error);
    }
  });
}

/**
 * 启动订单超时清理调度器
 * 每60秒执行一次清理
 * @returns {Function} 停止清理服务的函数
 */
function startCleanupScheduler() {
  console.log('[订单清理] 启动订单超时清理服务...');
  console.log('[订单清理] 清理规则: 超过10分钟的pending订单和过期的已确认未支付订单将被自动删除');
  console.log('[订单清理] 检查频率: 每60秒检查一次');
  
  // 立即执行一次清理
  Promise.all([
    cleanupExpiredPendingOrders(),
    cleanupExpiredUnpaidOrders()
  ])
    .then(([pendingResult, unpaidResult]) => {
      const totalDeleted = pendingResult.ordersDeleted + unpaidResult.ordersDeleted;
      if (totalDeleted > 0) {
        console.log(`[订单清理] 初始清理完成，删除了 ${totalDeleted} 个超时订单`);
      } else {
        console.log('[订单清理] 初始清理完成，无超时订单');
      }
    })
    .catch(err => {
      console.error('[订单清理] 初始清理失败:', err.message);
    });
  
  // 设置定时任务，每分钟执行一次
  const intervalId = setInterval(() => {
    Promise.all([
      cleanupExpiredPendingOrders(),
      cleanupExpiredUnpaidOrders()
    ])
      .then(([pendingResult, unpaidResult]) => {
        const totalDeleted = pendingResult.ordersDeleted + unpaidResult.ordersDeleted;
        if (totalDeleted > 0) {
          console.log(`[订单清理] 定时清理完成，删除了 ${totalDeleted} 个超时订单`);
        }
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
  cleanupExpiredUnpaidOrders,
  startCleanupScheduler
};

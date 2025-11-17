/**
 * 车次清理服务
 * 
 * 功能：
 * 1. 清理已过期的车次记录（departure_date < 今天）
 * 2. 清理对应的座位状态记录
 * 3. 每天凌晨自动执行
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * 获取数据库连接
 */
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
    : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
  
  return new sqlite3.Database(dbPath);
}

/**
 * 清理过期的车次记录
 * 删除 departure_date < 今天 的记录
 */
async function cleanupExpiredTrains() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`开始清理过期车次记录 (日期 < ${today})...`);
    
    db.serialize(() => {
      // 1. 先获取要删除的车次信息（用于日志）
      db.all(
        'SELECT train_no, departure_date FROM trains WHERE departure_date < ?',
        [today],
        (err, expiredTrains) => {
          if (err) {
            console.error('查询过期车次失败:', err);
            db.close();
            return reject(err);
          }
          
          if (!expiredTrains || expiredTrains.length === 0) {
            console.log('没有需要清理的过期车次');
            db.close();
            return resolve({ deletedTrains: 0, deletedSeats: 0 });
          }
          
          console.log(`找到 ${expiredTrains.length} 条过期车次记录`);
          
          // 2. 删除过期的座位状态记录
          db.run(
            'DELETE FROM seat_status WHERE departure_date < ?',
            [today],
            function(err) {
              if (err) {
                console.error('删除过期座位状态失败:', err);
                db.close();
                return reject(err);
              }
              
              const deletedSeats = this.changes;
              console.log(`删除了 ${deletedSeats} 条座位状态记录`);
              
              // 3. 删除过期的车次记录
              db.run(
                'DELETE FROM trains WHERE departure_date < ?',
                [today],
                function(err) {
                  db.close();
                  
                  if (err) {
                    console.error('删除过期车次失败:', err);
                    return reject(err);
                  }
                  
                  const deletedTrains = this.changes;
                  console.log(`删除了 ${deletedTrains} 条车次记录`);
                  console.log('清理完成！');
                  
                  resolve({
                    deletedTrains: deletedTrains,
                    deletedSeats: deletedSeats,
                    expiredDates: expiredTrains.map(t => t.departure_date).filter((v, i, a) => a.indexOf(v) === i)
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
 * 清理特定日期之前的车次记录
 * @param {string} beforeDate - YYYY-MM-DD 格式的日期
 */
async function cleanupTrainsBefore(beforeDate) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    console.log(`开始清理 ${beforeDate} 之前的车次记录...`);
    
    db.serialize(() => {
      // 1. 删除座位状态记录
      db.run(
        'DELETE FROM seat_status WHERE departure_date < ?',
        [beforeDate],
        function(err) {
          if (err) {
            console.error('删除座位状态失败:', err);
            db.close();
            return reject(err);
          }
          
          const deletedSeats = this.changes;
          
          // 2. 删除车次记录
          db.run(
            'DELETE FROM trains WHERE departure_date < ?',
            [beforeDate],
            function(err) {
              db.close();
              
              if (err) {
                console.error('删除车次失败:', err);
                return reject(err);
              }
              
              const deletedTrains = this.changes;
              console.log(`清理完成：删除了 ${deletedTrains} 条车次，${deletedSeats} 条座位状态`);
              
              resolve({
                deletedTrains: deletedTrains,
                deletedSeats: deletedSeats
              });
            }
          );
        }
      );
    });
  });
}

/**
 * 获取过期车次的统计信息
 */
async function getExpiredTrainsStats() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    db.all(
      `SELECT 
        COUNT(*) as total_trains,
        COUNT(DISTINCT departure_date) as unique_dates
       FROM trains 
       WHERE departure_date < ?`,
      [today],
      (err, rows) => {
        db.close();
        
        if (err) {
          console.error('查询过期车次统计失败:', err);
          return reject(err);
        }
        
        const stats = rows[0] || { total_trains: 0, unique_dates: 0 };
        resolve(stats);
      }
    );
  });
}

module.exports = {
  cleanupExpiredTrains,
  cleanupTrainsBefore,
  getExpiredTrainsStats
};










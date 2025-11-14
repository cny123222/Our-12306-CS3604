const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 创建数据库连接
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
    : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
  
  return new sqlite3.Database(dbPath);
}

/**
 * 车票服务
 */

/**
 * 预订车票
 */
async function reserveTicket(trainNo, departureStation, arrivalStation, departureDate, seatType, passengerId, userId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 首先检查是否有余票
    db.all(
      `SELECT DISTINCT seat_no 
       FROM seat_status 
       WHERE train_no = ? 
       AND seat_type = ?`,
      [trainNo, seatType],
      async (err, seats) => {
        if (err) {
return reject(err);
        }
        
        // 获取途经站点
        db.all(
          'SELECT station FROM train_stops WHERE train_no = ? AND station IN (?, ?) ORDER BY seq',
          [trainNo, departureStation, arrivalStation],
          (err, stops) => {
            if (err || stops.length < 2) {
return reject(new Error('站点信息错误'));
            }
            
            // 查找全程空闲的座位
            let availableSeat = null;
            let checked = 0;
            
            for (const { seat_no } of seats) {
              db.all(
                `SELECT status 
                 FROM seat_status 
                 WHERE train_no = ? 
                 AND seat_type = ? 
                 AND seat_no = ? 
                 AND from_station = ? 
                 AND to_station = ?`,
                [trainNo, seatType, seat_no, departureStation, arrivalStation],
                (err, statuses) => {
                  if (!err && statuses.length > 0 && statuses.every(s => s.status === 'available')) {
                    if (!availableSeat) {
                      availableSeat = seat_no;
                    }
                  }
                  
                  checked++;
                  
                  if (checked === seats.length) {
                    if (!availableSeat) {
return resolve({ success: false, error: '手慢了，该车次车票已售罄！' });
                    }
                    
                    // 创建订单
                    const orderId = uuidv4();
                    
                    // 更新座位状态
                    db.run(
                      `UPDATE seat_status 
                       SET status = 'booked', booked_by = ?, booked_at = datetime('now')
                       WHERE train_no = ? 
                       AND seat_type = ? 
                       AND seat_no = ? 
                       AND from_station = ? 
                       AND to_station = ?`,
                      [userId || passengerId, trainNo, seatType, availableSeat, departureStation, arrivalStation],
                      (err) => {
if (err) {
                          return reject(err);
                        }
                        
                        resolve({ 
                          success: true, 
                          orderId: orderId,
                          seatNo: availableSeat
                        });
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    );
  });
}

/**
 * 检查距离发车时间
 */
function checkDepartureTime(departureDate, departureTime) {
  try {
    const now = new Date();
    const [hours, minutes] = departureTime.split(':');
    const departureDateTime = new Date(departureDate);
    departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const timeDiff = departureDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 3 && hoursDiff > 0) {
      return {
        isNearDeparture: true,
        message: '您选择的列车距开车时间很近了，进站约需20分钟，请确保有足够的时间办理安全检查、实名制验证及检票等手续，以免耽误您的旅行。'
      };
    }
    
    return { isNearDeparture: false, message: '' };
  } catch (error) {
    console.error('检查发车时间失败:', error);
    return { isNearDeparture: false, message: '' };
  }
}

/**
 * 检查查询过期
 */
function checkQueryExpired(queryTimestamp) {
  try {
    const now = Date.now();
    const queryTime = new Date(queryTimestamp).getTime();
    const diff = now - queryTime;
    
    // 5分钟 = 5 * 60 * 1000 毫秒
    return diff > 5 * 60 * 1000;
  } catch (error) {
    console.error('检查查询过期失败:', error);
    return false;
  }
}

module.exports = {
  reserveTicket,
  checkDepartureTime,
  checkQueryExpired
};

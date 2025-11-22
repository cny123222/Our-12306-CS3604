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
 * 支持跨区间座位预订，正确处理日期过滤
 */
async function reserveTicket(trainNo, departureStation, arrivalStation, departureDate, seatType, passengerId, userId) {
  return new Promise(async (resolve, reject) => {
    const db = getDatabase();
    
    try {
      // 步骤1: 获取出发站和到达站之间的所有途经站点
      const stops = await new Promise((resolve, reject) => {
        db.all(
          `SELECT station FROM train_stops 
           WHERE train_no = ? 
           AND seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
           AND seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
           ORDER BY seq`,
          [trainNo, trainNo, departureStation, trainNo, arrivalStation],
          (err, stops) => {
            if (err) return reject(err);
            resolve(stops);
          }
        );
      });
      
      if (!stops || stops.length < 2) {
        db.close();
        return reject(new Error('站点信息错误'));
      }
      
      // 步骤2: 构建所有区间段
      const segments = [];
      for (let i = 0; i < stops.length - 1; i++) {
        segments.push({
          from: stops[i].station,
          to: stops[i + 1].station
        });
      }
      
      // 步骤3: 获取该席别的所有座位（包含日期过滤）
      const allSeats = await new Promise((resolve, reject) => {
        db.all(
          `SELECT DISTINCT seat_no 
           FROM seat_status 
           WHERE train_no = ? 
           AND departure_date = ?
           AND seat_type = ?`,
          [trainNo, departureDate, seatType],
          (err, seats) => {
            if (err) return reject(err);
            resolve(seats);
          }
        );
      });
      
      if (!allSeats || allSeats.length === 0) {
        db.close();
        return resolve({ success: false, error: '手慢了，该车次车票已售罄！' });
      }
      
      // 步骤4: 找到第一个在所有区间都是available的座位
      let selectedSeatNo = null;
      
      for (const seat of allSeats) {
        // 检查该座位在所有区间是否都是available
        const segmentConditions = segments.map(() => 
          '(from_station = ? AND to_station = ?)'
        ).join(' OR ');
        
        const segmentParams = segments.flatMap(s => [s.from, s.to]);
        
        const seatStatuses = await new Promise((resolve, reject) => {
          db.all(
            `SELECT status 
             FROM seat_status 
             WHERE train_no = ? 
             AND departure_date = ?
             AND seat_type = ? 
             AND seat_no = ? 
             AND (${segmentConditions})`,
            [trainNo, departureDate, seatType, seat.seat_no, ...segmentParams],
            (err, statuses) => {
              if (err) return reject(err);
              resolve(statuses);
            }
          );
        });
        
        // 检查是否所有区间都是available
        if (seatStatuses.length === segments.length) {
          const allAvailable = seatStatuses.every(s => s.status === 'available');
          if (allAvailable) {
            selectedSeatNo = seat.seat_no;
            break;
          }
        }
      }
      
      if (!selectedSeatNo) {
        db.close();
        return resolve({ success: false, error: '手慢了，该车次车票已售罄！' });
      }
      
      // 步骤5: 更新所有区间的座位状态为已预定
      const orderId = uuidv4();
      
      for (const segment of segments) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE seat_status 
             SET status = 'booked', booked_by = ?, booked_at = datetime('now')
             WHERE train_no = ? 
             AND departure_date = ?
             AND seat_type = ? 
             AND seat_no = ? 
             AND from_station = ? 
             AND to_station = ?`,
            [userId || passengerId, trainNo, departureDate, seatType, selectedSeatNo, segment.from, segment.to],
            (err) => {
              if (err) return reject(err);
              resolve(true);
            }
          );
        });
      }
      
      db.close();
      resolve({ 
        success: true, 
        orderId: orderId,
        seatNo: selectedSeatNo
      });
      
    } catch (error) {
      db.close();
      reject(error);
    }
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

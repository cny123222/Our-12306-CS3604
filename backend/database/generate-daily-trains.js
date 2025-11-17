/**
 * 每日车次数据生成脚本
 * 
 * 功能：为所有车次生成第15天（从今天算起第14天之后）的记录
 * 用于定时任务，确保始终有未来14天的车次数据可供查询
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'railway.db');

/**
 * 获取第15天的日期（14天后的日期）
 */
function getDay15Date() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
}

/**
 * 根据席别类型获取座位数量
 */
function getSeatCountByType(seatType) {
  const seatCounts = {
    '商务座': 10,
    '一等座': 40,
    '二等座': 80,
    '软卧': 30,
    '硬卧': 60
  };
  
  return seatCounts[seatType] || 50;
}

/**
 * 为所有车次生成第15天的数据
 */
function generateDay15Trains(db) {
  return new Promise((resolve, reject) => {
    const targetDate = getDay15Date();
    console.log(`正在为日期 ${targetDate} 生成车次数据...`);
    
    // 1. 获取所有唯一的车次（从任意一天的数据中获取模板）
    db.all(`
      SELECT DISTINCT 
        train_no, train_type, model, is_direct, has_air_conditioning,
        origin_station, destination_station, distance_km, planned_duration_min,
        departure_time, arrival_time
      FROM trains
      WHERE departure_date = (SELECT MIN(departure_date) FROM trains)
    `, [], (err, trains) => {
      if (err) {
        console.error('查询车次模板失败:', err);
        return reject(err);
      }
      
      console.log(`找到 ${trains.length} 个车次需要生成`);
      
      // 2. 检查目标日期是否已有数据
      db.get(
        'SELECT COUNT(*) as count FROM trains WHERE departure_date = ?',
        [targetDate],
        (err, row) => {
          if (err) {
            console.error('检查现有数据失败:', err);
            return reject(err);
          }
          
          if (row.count > 0) {
            console.log(`日期 ${targetDate} 已有 ${row.count} 条车次记录，跳过生成`);
            return resolve({ skipped: true, date: targetDate });
          }
          
          // 3. 插入新的车次记录
          const stmtTrain = db.prepare(`
            INSERT INTO trains (
              train_no, departure_date, train_type, model, is_direct, has_air_conditioning,
              origin_station, destination_station, distance_km, planned_duration_min,
              departure_time, arrival_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          trains.forEach(train => {
            stmtTrain.run(
              train.train_no,
              targetDate,
              train.train_type,
              train.model,
              train.is_direct,
              train.has_air_conditioning,
              train.origin_station,
              train.destination_station,
              train.distance_km,
              train.planned_duration_min,
              train.departure_time,
              train.arrival_time
            );
          });
          
          stmtTrain.finalize((err) => {
            if (err) {
              console.error('插入车次记录失败:', err);
              return reject(err);
            }
            
            console.log(`成功插入 ${trains.length} 条车次记录`);
            
            // 4. 为每个车次生成座位状态
            generateDay15SeatStatus(db, trains, targetDate)
              .then(() => {
                resolve({ 
                  success: true, 
                  date: targetDate, 
                  trainsCount: trains.length 
                });
              })
              .catch(reject);
          });
        }
      );
    });
  });
}

/**
 * 为第15天生成座位状态数据
 */
function generateDay15SeatStatus(db, trains, targetDate) {
  return new Promise((resolve, reject) => {
    console.log(`正在为日期 ${targetDate} 生成座位状态...`);
    
    const stmtSeat = db.prepare(`
      INSERT INTO seat_status (
        train_no, departure_date, car_no, seat_no, seat_type, 
        from_station, to_station, status
      ) 
      SELECT 
        ?, ?, car_no, seat_no, seat_type, from_station, to_station, 'available'
      FROM seat_status
      WHERE train_no = ? AND departure_date = (SELECT MIN(departure_date) FROM trains WHERE train_no = ?)
    `);
    
    let completed = 0;
    let totalSeats = 0;
    
    trains.forEach(train => {
      stmtSeat.run(
        train.train_no, 
        targetDate, 
        train.train_no,
        train.train_no,
        function(err) {
          if (err) {
            console.error(`为车次 ${train.train_no} 生成座位状态失败:`, err);
          } else {
            totalSeats += this.changes;
          }
          
          completed++;
          
          if (completed === trains.length) {
            stmtSeat.finalize((err) => {
              if (err) {
                console.error('完成座位状态生成失败:', err);
                return reject(err);
              }
              
              console.log(`成功生成 ${totalSeats} 条座位状态记录`);
              resolve();
            });
          }
        }
      );
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('=' .repeat(60));
  console.log('每日车次数据生成脚本');
  console.log('=' .repeat(60));
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    const result = await generateDay15Trains(db);
    
    console.log('\n' + '='.repeat(60));
    if (result.skipped) {
      console.log(`日期 ${result.date} 的数据已存在，无需生成`);
    } else {
      console.log('生成完成！');
      console.log(`日期: ${result.date}`);
      console.log(`车次数量: ${result.trainsCount}`);
    }
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n生成失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 执行生成
if (require.main === module) {
  main();
}

module.exports = { main, generateDay15Trains, getDay15Date };










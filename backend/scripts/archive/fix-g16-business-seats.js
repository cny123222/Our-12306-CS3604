/**
 * 修复 11-23 G16 商务座座位状态
 * 将 test04 账号预定的 9 张票释放 1 张，使余票数回到 1 张
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/railway.db');
const db = new sqlite3.Database(dbPath);

// 目标配置
const TARGET = {
  trainNo: 'G16',
  departureDate: '2025-11-23',
  seatType: '商务座',
  bookedBy: 'test04',
  targetAvailable: 1  // 目标余票数
};

console.log('========================================');
console.log('🔧 修复 G16 商务座座位状态');
console.log('========================================');
console.log(`车次: ${TARGET.trainNo}`);
console.log(`日期: ${TARGET.departureDate}`);
console.log(`席别: ${TARGET.seatType}`);
console.log(`目标: 释放座位使余票数达到 ${TARGET.targetAvailable} 张`);
console.log();

// 查询当前状态
db.all(
  `SELECT 
     seat_no,
     from_station,
     to_station,
     status,
     booked_by
   FROM seat_status
   WHERE train_no = ?
   AND departure_date = ?
   AND seat_type = ?
   ORDER BY seat_no, from_station`,
  [TARGET.trainNo, TARGET.departureDate, TARGET.seatType],
  (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err.message);
      db.close();
      process.exit(1);
    }
    
    // 按座位号分组
    const seatGroups = {};
    rows.forEach(row => {
      if (!seatGroups[row.seat_no]) {
        seatGroups[row.seat_no] = [];
      }
      seatGroups[row.seat_no].push(row);
    });
    
    console.log(`📊 当前状态:`);
    console.log(`   总座位数: ${Object.keys(seatGroups).length} 个`);
    
    // 统计每个座位的状态
    let fullyAvailable = 0;
    let fullyBooked = 0;
    let bookedByTest04 = 0;
    
    for (const [seatNo, segments] of Object.entries(seatGroups)) {
      const allAvailable = segments.every(s => s.status === 'available');
      const allBooked = segments.every(s => s.status === 'booked');
      const bookedByTest04Seat = segments.every(s => s.booked_by === TARGET.bookedBy);
      
      if (allAvailable) fullyAvailable++;
      if (allBooked) fullyBooked++;
      if (bookedByTest04Seat) bookedByTest04++;
    }
    
    console.log(`   完全可用: ${fullyAvailable} 个`);
    console.log(`   完全已预定: ${fullyBooked} 个`);
    console.log(`   ${TARGET.bookedBy} 预定: ${bookedByTest04} 个`);
    console.log();
    
    // 计算需要释放的座位数
    const needToRelease = fullyAvailable < TARGET.targetAvailable 
      ? TARGET.targetAvailable - fullyAvailable 
      : 0;
    
    if (needToRelease === 0) {
      console.log('✅ 当前余票数已达到目标，无需修复');
      db.close();
      process.exit(0);
    }
    
    console.log(`🔄 需要释放 ${needToRelease} 个座位`);
    console.log();
    
    // 找到由 test04 预定的座位
    const test04Seats = [];
    for (const [seatNo, segments] of Object.entries(seatGroups)) {
      const bookedByTest04Seat = segments.every(s => s.booked_by === TARGET.bookedBy);
      if (bookedByTest04Seat) {
        test04Seats.push(seatNo);
      }
    }
    
    if (test04Seats.length === 0) {
      console.log('⚠️  未找到由 test04 预定的座位，将释放任意已预定座位');
      
      // 找到任意已预定的座位
      for (const [seatNo, segments] of Object.entries(seatGroups)) {
        const allBooked = segments.every(s => s.status === 'booked');
        if (allBooked) {
          test04Seats.push(seatNo);
        }
      }
    }
    
    if (test04Seats.length === 0) {
      console.log('❌ 未找到任何已预定的座位，无法释放');
      db.close();
      process.exit(1);
    }
    
    // 选择要释放的座位（取前 needToRelease 个）
    const seatsToRelease = test04Seats.slice(0, needToRelease);
    
    console.log(`🎫 将释放以下座位:`);
    seatsToRelease.forEach(seatNo => {
      console.log(`   - ${seatNo}`);
    });
    console.log();
    
    // 开始释放座位
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('❌ 开始事务失败:', err.message);
          db.close();
          process.exit(1);
        }
      });
      
      let released = 0;
      let totalSegments = 0;
      
      seatsToRelease.forEach((seatNo, index) => {
        const segments = seatGroups[seatNo];
        totalSegments += segments.length;
        
        segments.forEach(segment => {
          db.run(
            `UPDATE seat_status
             SET status = 'available', booked_by = NULL, booked_at = NULL
             WHERE train_no = ?
             AND departure_date = ?
             AND seat_type = ?
             AND seat_no = ?
             AND from_station = ?
             AND to_station = ?`,
            [TARGET.trainNo, TARGET.departureDate, TARGET.seatType, 
             seatNo, segment.from_station, segment.to_station],
            (err) => {
              if (err) {
                console.error(`❌ 释放座位 ${seatNo} 区间 ${segment.from_station}-${segment.to_station} 失败:`, err.message);
                db.run('ROLLBACK');
                db.close();
                process.exit(1);
              }
              
              released++;
              
              // 所有更新完成后提交事务
              if (released === totalSegments) {
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('❌ 提交事务失败:', err.message);
                    db.run('ROLLBACK');
                    db.close();
                    process.exit(1);
                  }
                  
                  console.log('✅ 座位释放成功！');
                  console.log(`   已释放 ${seatsToRelease.length} 个座位`);
                  console.log(`   更新了 ${released} 条座位状态记录`);
                  console.log();
                  
                  // 验证结果
                  db.all(
                    `SELECT seat_no, status, booked_by
                     FROM seat_status
                     WHERE train_no = ?
                     AND departure_date = ?
                     AND seat_type = ?
                     GROUP BY seat_no
                     HAVING COUNT(DISTINCT status) = 1 AND status = 'available'`,
                    [TARGET.trainNo, TARGET.departureDate, TARGET.seatType],
                    (err, availableSeats) => {
                      db.close();
                      
                      if (err) {
                        console.error('❌ 验证失败:', err.message);
                        process.exit(1);
                      }
                      
                      console.log('📊 修复后状态:');
                      console.log(`   可用座位数: ${availableSeats.length} 个`);
                      
                      if (availableSeats.length >= TARGET.targetAvailable) {
                        console.log();
                        console.log('========================================');
                        console.log('🎉 修复完成！');
                        console.log('========================================');
                        process.exit(0);
                      } else {
                        console.log();
                        console.log('⚠️  可用座位数仍未达到目标，可能需要手动检查');
                        process.exit(1);
                      }
                    }
                  );
                });
              }
            }
          );
        });
      });
    });
  }
);


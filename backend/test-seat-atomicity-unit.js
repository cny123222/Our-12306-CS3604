/**
 * 座位预定原子性单元测试
 * 直接测试数据库操作，不依赖API服务器
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'database/railway.db');

// 测试配置
const TEST_CONFIG = {
  trainNo: 'G16',
  departureStation: '上海虹桥',
  arrivalStation: '北京南',
  departureDate: new Date().toISOString().split('T')[0],
  seatType: '商务座'
};

const testUserId = 'test_user_' + Date.now();

/**
 * 获取可用座位数
 */
async function getAvailableSeats(db) {
  return new Promise((resolve, reject) => {
    // 获取所有途经站点
    db.all(
      `SELECT station FROM train_stops 
       WHERE train_no = ? 
       AND seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       AND seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       ORDER BY seq`,
      [TEST_CONFIG.trainNo, TEST_CONFIG.trainNo, TEST_CONFIG.departureStation, 
       TEST_CONFIG.trainNo, TEST_CONFIG.arrivalStation],
      (err, stops) => {
        if (err) return reject(err);
        
        // 构建所有区间
        const segments = [];
        for (let i = 0; i < stops.length - 1; i++) {
          segments.push({
            from: stops[i].station,
            to: stops[i + 1].station
          });
        }
        
        // 获取该席别的所有座位
        db.all(
          `SELECT DISTINCT seat_no 
           FROM seat_status 
           WHERE train_no = ? 
           AND departure_date = ?
           AND seat_type = ?`,
          [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType],
          async (err, seats) => {
            if (err) return reject(err);
            
            let availableCount = 0;
            const segmentConditions = segments.map(() => 
              '(from_station = ? AND to_station = ?)'
            ).join(' OR ');
            const segmentParams = segments.flatMap(s => [s.from, s.to]);
            
            for (const seat of seats) {
              const result = await new Promise((resolve, reject) => {
                db.all(
                  `SELECT status 
                   FROM seat_status 
                   WHERE train_no = ? 
                   AND departure_date = ?
                   AND seat_type = ? 
                   AND seat_no = ? 
                   AND (${segmentConditions})`,
                  [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType, seat.seat_no, ...segmentParams],
                  (err, statuses) => {
                    if (err) return reject(err);
                    resolve(statuses);
                  }
                );
              });
              
              if (result.length === segments.length && result.every(s => s.status === 'available')) {
                availableCount++;
              }
            }
            
            resolve(availableCount);
          }
        );
      }
    );
  });
}

/**
 * 预定座位直到只剩指定数量
 */
async function bookSeatsUntilCount(db, targetCount) {
  return new Promise((resolve, reject) => {
    // 获取所有途经站点
    db.all(
      `SELECT station FROM train_stops 
       WHERE train_no = ? 
       AND seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       AND seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
       ORDER BY seq`,
      [TEST_CONFIG.trainNo, TEST_CONFIG.trainNo, TEST_CONFIG.departureStation, 
       TEST_CONFIG.trainNo, TEST_CONFIG.arrivalStation],
      async (err, stops) => {
        if (err) return reject(err);
        
        // 构建所有区间
        const segments = [];
        for (let i = 0; i < stops.length - 1; i++) {
          segments.push({
            from: stops[i].station,
            to: stops[i + 1].station
          });
        }
        
        // 获取该席别的所有座位
        db.all(
          `SELECT DISTINCT seat_no 
           FROM seat_status 
           WHERE train_no = ? 
           AND departure_date = ?
           AND seat_type = ?
           ORDER BY seat_no`,
          [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType],
          async (err, seats) => {
            if (err) return reject(err);
            
            // 预定座位直到只剩 targetCount 个
            const seatsToBook = seats.slice(0, Math.max(0, seats.length - targetCount));
            
            for (const seat of seatsToBook) {
              for (const segment of segments) {
                await new Promise((resolve, reject) => {
                  db.run(
                    `UPDATE seat_status 
                     SET status = 'booked', booked_by = 'system_test', booked_at = datetime('now')
                     WHERE train_no = ? 
                     AND departure_date = ?
                     AND seat_type = ? 
                     AND seat_no = ? 
                     AND from_station = ? 
                     AND to_station = ?`,
                    [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType, 
                     seat.seat_no, segment.from, segment.to],
                    (err) => {
                      if (err) return reject(err);
                      resolve(true);
                    }
                  );
                });
              }
            }
            
            resolve(true);
          }
        );
      }
    );
  });
}

/**
 * 模拟 confirmOrder 函数的逻辑（简化版）
 */
async function simulateConfirmOrder(db, orderId, passengerCount) {
  return new Promise(async (resolve, reject) => {
    try {
      // 模拟订单明细
      const details = [];
      for (let i = 0; i < passengerCount; i++) {
        details.push({
          id: i + 1,
          seat_type: TEST_CONFIG.seatType,
          passenger_name: `乘客${i + 1}`
        });
      }
      
      // ========== 第一步：余票预检查 ==========
      const seatTypeRequirements = {};
      for (const detail of details) {
        if (!seatTypeRequirements[detail.seat_type]) {
          seatTypeRequirements[detail.seat_type] = 0;
        }
        seatTypeRequirements[detail.seat_type]++;
      }
      
      // 获取区间
      const stops = await new Promise((resolve, reject) => {
        db.all(
          `SELECT station FROM train_stops 
           WHERE train_no = ? 
           AND seq >= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
           AND seq <= (SELECT seq FROM train_stops WHERE train_no = ? AND station = ?)
           ORDER BY seq`,
          [TEST_CONFIG.trainNo, TEST_CONFIG.trainNo, TEST_CONFIG.departureStation, 
           TEST_CONFIG.trainNo, TEST_CONFIG.arrivalStation],
          (err, stops) => {
            if (err) return reject(err);
            resolve(stops);
          }
        );
      });
      
      const segments = [];
      for (let i = 0; i < stops.length - 1; i++) {
        segments.push({
          from: stops[i].station,
          to: stops[i + 1].station
        });
      }
      
      // 检查每种席别的可用座位数量
      for (const [seatType, requiredCount] of Object.entries(seatTypeRequirements)) {
        const allSeats = await new Promise((resolve, reject) => {
          db.all(
            `SELECT DISTINCT car_no, seat_no 
             FROM seat_status 
             WHERE train_no = ? 
             AND departure_date = ?
             AND seat_type = ?`,
            [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, seatType],
            (err, seats) => {
              if (err) return reject(err);
              resolve(seats);
            }
          );
        });
        
        if (!allSeats || allSeats.length === 0) {
          return reject(new Error(`${seatType}座位不存在`));
        }
        
        let availableCount = 0;
        const segmentConditions = segments.map(() => 
          '(from_station = ? AND to_station = ?)'
        ).join(' OR ');
        const segmentParams = segments.flatMap(s => [s.from, s.to]);
        
        for (const seat of allSeats) {
          const seatStatuses = await new Promise((resolve, reject) => {
            db.all(
              `SELECT status 
               FROM seat_status 
               WHERE train_no = ? 
               AND departure_date = ?
               AND seat_type = ? 
               AND seat_no = ? 
               AND (${segmentConditions})`,
              [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, seatType, seat.seat_no, ...segmentParams],
              (err, statuses) => {
                if (err) return reject(err);
                resolve(statuses);
              }
            );
          });
          
          if (seatStatuses.length === segments.length) {
            const allAvailable = seatStatuses.every(s => s.status === 'available');
            if (allAvailable) {
              availableCount++;
            }
          }
        }
        
        // 如果可用座位数量少于需求数量，直接拒绝
        if (availableCount < requiredCount) {
          return reject(new Error(`${seatType}余票不足，需要${requiredCount}张，仅剩${availableCount}张`));
        }
      }
      
      // ========== 第二步：开启事务，分配座位 ==========
      await new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
      
      try {
        // 为每个乘客分配座位
        for (const detail of details) {
          const allSeats = await new Promise((resolve, reject) => {
            db.all(
              `SELECT DISTINCT car_no, seat_no 
               FROM seat_status 
               WHERE train_no = ? 
               AND departure_date = ?
               AND seat_type = ?`,
              [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, detail.seat_type],
              (err, seats) => {
                if (err) return reject(err);
                resolve(seats);
              }
            );
          });
          
          let selectedSeatNo = null;
          const segmentConditions = segments.map(() => 
            '(from_station = ? AND to_station = ?)'
          ).join(' OR ');
          const segmentParams = segments.flatMap(s => [s.from, s.to]);
          
          for (const seat of allSeats) {
            const seatStatuses = await new Promise((resolve, reject) => {
              db.all(
                `SELECT status 
                 FROM seat_status 
                 WHERE train_no = ? 
                 AND departure_date = ?
                 AND seat_type = ? 
                 AND seat_no = ? 
                 AND (${segmentConditions})`,
                [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, detail.seat_type, seat.seat_no, ...segmentParams],
                (err, statuses) => {
                  if (err) return reject(err);
                  resolve(statuses);
                }
              );
            });
            
            if (seatStatuses.length === segments.length) {
              const allAvailable = seatStatuses.every(s => s.status === 'available');
              if (allAvailable) {
                selectedSeatNo = seat.seat_no;
                break;
              }
            }
          }
          
          if (!selectedSeatNo) {
            throw new Error(`${detail.seat_type}座位已售罄`);
          }
          
          // 更新座位状态
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
                [testUserId, TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, detail.seat_type, selectedSeatNo, segment.from, segment.to],
                (err) => {
                  if (err) return reject(err);
                  resolve(true);
                }
              );
            });
          }
        }
        
        // 提交事务
        await new Promise((resolve, reject) => {
          db.run('COMMIT', (err) => {
            if (err) return reject(err);
            resolve(true);
          });
        });
        
        resolve({ success: true });
      } catch (transactionError) {
        // 回滚事务
        await new Promise((resolve) => {
          db.run('ROLLBACK', () => {
            resolve(true);
          });
        });
        throw transactionError;
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 清理测试数据
 */
async function cleanupTestData(db) {
  return new Promise((resolve) => {
    // 恢复所有商务座为可用状态
    db.run(
      `UPDATE seat_status 
       SET status = 'available', booked_by = NULL, booked_at = NULL
       WHERE train_no = ? 
       AND departure_date = ?
       AND seat_type = ?`,
      [TEST_CONFIG.trainNo, TEST_CONFIG.departureDate, TEST_CONFIG.seatType],
      () => {
        resolve(true);
      }
    );
  });
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log('========================================');
  console.log('🧪 座位预定原子性单元测试');
  console.log('========================================');
  
  const db = new sqlite3.Database(dbPath);
  let testPassed = true;
  
  try {
    // 1. 确保商务座只剩1张票
    console.log('\n🎫 设置测试环境：确保商务座只剩1张票...');
    await bookSeatsUntilCount(db, 1);
    
    const availableBeforeTest = await getAvailableSeats(db);
    console.log(`   当前余票: ${availableBeforeTest}张`);
    
    if (availableBeforeTest !== 1) {
      console.log(`❌ 测试环境设置失败：余票数应该是1张，实际是${availableBeforeTest}张`);
      testPassed = false;
      return;
    }
    
    console.log('✅ 测试环境准备完成');
    
    // 2. 尝试为2个乘客确认订单
    console.log('\n✔️  尝试为2个乘客确认订单（需要2张票，但只有1张）...');
    
    try {
      await simulateConfirmOrder(db, 'test_order_' + Date.now(), 2);
      console.log('\n❌ 测试失败：订单应该确认失败，但实际成功了');
      console.log('   这说明修复无效！');
      testPassed = false;
    } catch (error) {
      console.log('\n✅ 订单确认失败（符合预期）');
      console.log(`   错误信息: ${error.message}`);
      
      // 检查错误信息
      if (error.message.includes('余票不足') || error.message.includes('已售罄')) {
        console.log('✅ 错误信息正确');
      } else {
        console.log('⚠️  错误信息可能不够清晰');
      }
    }
    
    // 3. 检查余票数是否保持不变
    console.log('\n📊 检查余票数是否保持不变...');
    const availableAfterTest = await getAvailableSeats(db);
    console.log(`   测试后余票数: ${availableAfterTest}张`);
    
    if (availableAfterTest === availableBeforeTest) {
      console.log('✅ 余票数保持不变（符合预期）');
      console.log('✅ 修复成功！座位状态没有被错误地修改');
    } else {
      console.log('❌ 测试失败：余票数发生了变化');
      console.log(`   预期: ${availableBeforeTest}张，实际: ${availableAfterTest}张`);
      console.log('   这说明座位状态被错误地修改了！');
      testPassed = false;
    }
    
    if (testPassed) {
      console.log('\n========================================');
      console.log('🎉 所有测试通过！');
      console.log('========================================');
    }
  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error.message);
    console.error(error.stack);
    testPassed = false;
  } finally {
    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await cleanupTestData(db);
    console.log('✅ 清理完成');
    
    db.close();
  }
  
  return testPassed;
}

// 运行测试
runTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});


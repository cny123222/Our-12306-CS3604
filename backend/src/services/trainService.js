const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const stationService = require('./stationService');

// 创建数据库连接
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
    : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
  
  return new sqlite3.Database(dbPath);
}

/**
 * 车次服务
 */

/**
 * 搜索车次
 * 支持按车次类型筛选，只返回直达车次
 */
async function searchTrains(departureStation, arrivalStation, departureDate, trainTypes = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    let sql = `
      SELECT t.*, 
        (SELECT arrive_time FROM train_stops WHERE train_no = t.train_no AND station = ? ORDER BY seq DESC LIMIT 1) as dep_time,
        (SELECT arrive_time FROM train_stops WHERE train_no = t.train_no AND station = ? ORDER BY seq DESC LIMIT 1) as arr_time,
        (SELECT seq FROM train_stops WHERE train_no = t.train_no AND station = ? ORDER BY seq DESC LIMIT 1) as dep_seq,
        (SELECT seq FROM train_stops WHERE train_no = t.train_no AND station = ? ORDER BY seq DESC LIMIT 1) as arr_seq
      FROM trains t
      WHERE EXISTS (
        SELECT 1 FROM train_stops WHERE train_no = t.train_no AND station = ?
      )
      AND EXISTS (
        SELECT 1 FROM train_stops WHERE train_no = t.train_no AND station = ?
      )
      AND is_direct = 1
    `;
    
    const params = [
      departureStation, arrivalStation, 
      departureStation, arrivalStation,
      departureStation, arrivalStation
    ];
    
    // 如果提供了车次类型筛选
    if (trainTypes && trainTypes.length > 0) {
      const typePlaceholders = trainTypes.map(() => '?').join(',');
      sql += ` AND SUBSTR(train_no, 1, 1) IN (${typePlaceholders})`;
      params.push(...trainTypes);
    }
    
    sql += ' ORDER BY departure_time';
    
    db.all(sql, params, async (err, rows) => {
      if (err) {
        db.close();
        console.error('搜索车次失败:', err);
        return reject(err);
      }
      
      // 过滤出发站在到达站之前的车次
      const validTrains = rows.filter(train => {
        return train.dep_seq && train.arr_seq && train.dep_seq < train.arr_seq;
      });
      
      // 获取每个车次的详细停靠信息和余票信息
      const trainsWithDetails = [];
      let completed = 0;
      
      if (validTrains.length === 0) {
        db.close();
        return resolve([]);
      }
      
      for (const train of validTrains) {
        // 获取出发时间和到达时间
        db.all(
          'SELECT * FROM train_stops WHERE train_no = ? AND (station = ? OR station = ?) ORDER BY seq',
          [train.train_no, departureStation, arrivalStation],
          async (err, stops) => {
            if (!err && stops.length >= 2) {
              const depStop = stops.find(s => s.station === departureStation);
              const arrStop = stops.find(s => s.station === arrivalStation);
              
              if (depStop && arrStop) {
                // 计算余票
                const availableSeats = await calculateAvailableSeats(train.train_no, departureStation, arrivalStation);
                
                trainsWithDetails.push({
                  trainNo: train.train_no,
                  trainType: train.train_type,
                  model: train.model,
                  departureStation: departureStation,
                  arrivalStation: arrivalStation,
                  departureTime: depStop.depart_time,
                  arrivalTime: arrStop.arrive_time,
                  duration: calculateDuration(depStop.depart_time, arrStop.arrive_time),
                  departureDate: departureDate, // 添加出发日期
                  availableSeats: availableSeats
                });
              }
            }
            
            completed++;
            if (completed === validTrains.length) {
              db.close();
              resolve(trainsWithDetails);
            }
          }
        );
      }
    });
  });
}

/**
 * 获取车次详情
 */
async function getTrainDetails(trainNo) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.get('SELECT * FROM trains WHERE train_no = ?', [trainNo], (err, train) => {
      if (err) {
        db.close();
        console.error('获取车次详情失败:', err);
        return reject(err);
      }
      
      if (!train) {
        db.close();
        return resolve(null);
      }
      
      // 获取停靠站信息
      db.all(
        'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
        [trainNo],
        (err, stops) => {
          if (err) {
            db.close();
            return reject(err);
          }
          
          // 获取车厢配置
          db.all(
            'SELECT * FROM train_cars WHERE train_no = ? ORDER BY car_no',
            [trainNo],
            (err, cars) => {
              if (err) {
                db.close();
                return reject(err);
              }
              
              // 获取票价信息
              db.all(
                'SELECT * FROM train_fares WHERE train_no = ?',
                [trainNo],
                async (err, fares) => {
                  db.close();
                  
                  if (err) {
                    return reject(err);
                  }
                  
                  // 计算余票
                  const availableSeats = await calculateAvailableSeats(
                    trainNo, 
                    train.origin_station, 
                    train.destination_station
                  );
                  
                  resolve({
                    trainNo: train.train_no,
                    trainType: train.train_type,
                    model: train.model,
                    route: {
                      origin: train.origin_station,
                      destination: train.destination_station,
                      distanceKm: train.distance_km,
                      plannedDurationMin: train.planned_duration_min,
                      departureTime: train.departure_time,
                      arrivalTime: train.arrival_time
                    },
                    stops: stops,
                    cars: cars,
                    fares: fares,
                    availableSeats: availableSeats
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
 * 计算余票数
 * 对于非相邻两站，只计算全程空闲的座位
 */
async function calculateAvailableSeats(trainNo, departureStation, arrivalStation) {
  console.log('calculateAvailableSeats called with:', { trainNo, departureStation, arrivalStation });
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 获取出发站和到达站的序号
    db.all(
      'SELECT seq, station FROM train_stops WHERE train_no = ? AND (station = ? OR station = ?) ORDER BY seq',
      [trainNo, departureStation, arrivalStation],
      (err, stops) => {
        if (err || stops.length < 2) {
          db.close();
          return resolve({});
        }
        
        const depStop = stops.find(s => s.station === departureStation);
        const arrStop = stops.find(s => s.station === arrivalStation);
        
        console.log('depStop:', depStop, 'arrStop:', arrStop);
        
        if (!depStop || !arrStop || depStop.seq >= arrStop.seq) {
          console.log('Invalid stops configuration');
          db.close();
          return resolve({});
        }
        
        // 获取所有途经站点
        console.log('Fetching intermediate stops between seq', depStop.seq, 'and', arrStop.seq);
        db.all(
          'SELECT station FROM train_stops WHERE train_no = ? AND seq >= ? AND seq <= ? ORDER BY seq',
          [trainNo, depStop.seq, arrStop.seq],
          (err, intermediateStops) => {
            console.log('intermediateStops:', intermediateStops);
            if (err) {
              db.close();
              return reject(err);
            }
            
            // 获取所有席别类型
            db.all(
              'SELECT DISTINCT seat_type FROM train_cars WHERE train_no = ? AND seat_type != ?',
              [trainNo, '餐车'],
              (err, seatTypes) => {
                if (err) {
                  console.error('Error fetching seat types:', err);
                  db.close();
                  return reject(err);
                }
                
                console.log('Found seat types:', seatTypes.map(st => st.seat_type));
                
                const result = {};
                let completed = 0;
                
                if (seatTypes.length === 0) {
                  console.log('No seat types found');
                  db.close();
                  return resolve({});
                }
                
                // 对每个席别计算余票
                seatTypes.forEach(({ seat_type }) => {
                  // 获取该席别所有座位的状态
                  // 需要查询所有区间段，只有全程都是available的座位才计入余票
                  
                  if (intermediateStops.length <= 2) {
                    // 相邻两站，直接统计该区间内available的座位数
                    const query = `SELECT COUNT(DISTINCT seat_no) as count 
                       FROM seat_status 
                       WHERE train_no = ? 
                       AND seat_type = ? 
                       AND from_station = ? 
                       AND to_station = ? 
                       AND status = 'available'`;
                    console.log('Query for adjacent stations:', { trainNo, seat_type, departureStation, arrivalStation });
                    db.get(
                      query,
                      [trainNo, seat_type, departureStation, arrivalStation],
                      (err, row) => {
                        if (err) {
                          console.error('Query error:', err);
                        }
                        console.log(`Seats for ${seat_type}:`, row ? row.count : 0);
                        result[seat_type] = row ? row.count : 0;
                        completed++;
                        
                        if (completed === seatTypes.length) {
                          console.log('Final result:', result);
                          db.close();
                          resolve(result);
                        }
                      }
                    );
                  } else {
                    // 非相邻两站，需要找出所有区间都是available的座位
                    console.log(`Processing cross-interval for ${seat_type}, ${intermediateStops.length} stops`);
                    
                    // 优化后的查询：使用GROUP BY和HAVING一次性找出所有区间都available的座位
                    const segments = [];
                    for (let i = 0; i < intermediateStops.length - 1; i++) {
                      segments.push({
                        from: intermediateStops[i].station,
                        to: intermediateStops[i + 1].station
                      });
                    }
                    
                    // 构建查询条件
                    const segmentConditions = segments.map(() => 
                      '(from_station = ? AND to_station = ?)'
                    ).join(' OR ');
                    
                    const segmentParams = segments.flatMap(s => [s.from, s.to]);
                    
                    // 使用一个查询找出所有区间都available的座位
                    // 策略：找出在所有区间段都有available记录的座位
                    db.get(
                      `SELECT COUNT(*) as count
                       FROM (
                         SELECT seat_no
                         FROM seat_status
                         WHERE train_no = ?
                         AND seat_type = ?
                         AND (${segmentConditions})
                         AND status = 'available'
                         GROUP BY seat_no
                         HAVING COUNT(*) = ?
                       )`,
                      [
                        trainNo, seat_type, ...segmentParams,
                        segments.length
                      ],
                      (err, row) => {
                        if (err) {
                          console.error(`Query error for ${seat_type}:`, err);
                          result[seat_type] = 0;
                        } else {
                          console.log(`Available seats for ${seat_type}:`, row ? row.count : 0);
                          result[seat_type] = row ? row.count : 0;
                        }
                        
                        completed++;
                        
                        if (completed === seatTypes.length) {
                          console.log('Final result:', result);
                          db.close();
                          resolve(result);
                        }
                      }
                    );
                  }
                });
              }
            );
          }
        );
      }
    );
  });
}

/**
 * 获取筛选选项
 */
async function getFilterOptions(departureStation, arrivalStation, departureDate) {
  return new Promise(async (resolve, reject) => {
    try {
      // 先搜索符合条件的车次
      const trains = await searchTrains(departureStation, arrivalStation, departureDate);
      
      const db = getDatabase();
      
      // 获取这些车次途经的所有出发站和到达站
      const trainNos = trains.map(t => t.trainNo);
      
      if (trainNos.length === 0) {
        db.close();
        return resolve({
          departureStations: [],
          arrivalStations: [],
          seatTypes: []
        });
      }
      
      const placeholders = trainNos.map(() => '?').join(',');
      
      // 获取所有出发站
      db.all(
        `SELECT DISTINCT station FROM train_stops 
         WHERE train_no IN (${placeholders}) 
         ORDER BY station`,
        trainNos,
        (err, depStations) => {
          if (err) {
            db.close();
            return reject(err);
          }
          
          // 获取所有到达站
          db.all(
            `SELECT DISTINCT station FROM train_stops 
             WHERE train_no IN (${placeholders}) 
             ORDER BY station`,
            trainNos,
            (err, arrStations) => {
              if (err) {
                db.close();
                return reject(err);
              }
              
              // 获取所有席别类型
              db.all(
                `SELECT DISTINCT seat_type FROM train_cars 
                 WHERE train_no IN (${placeholders}) 
                 AND seat_type != '餐车'
                 ORDER BY seat_type`,
                trainNos,
                (err, seatTypes) => {
                  db.close();
                  
                  if (err) {
                    return reject(err);
                  }
                  
                  resolve({
                    departureStations: depStations.map(s => s.station),
                    arrivalStations: arrStations.map(s => s.station),
                    seatTypes: seatTypes.map(s => s.seat_type)
                  });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 获取可选日期
 */
async function getAvailableDates() {
  // 返回从后天开始的15天日期，避免时区问题
  const dates = [];
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 15; i++) {
    const date = new Date(dayAfterTomorrow);
    date.setDate(dayAfterTomorrow.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * 计算历时（分钟）
 */
function calculateDuration(departureTime, arrivalTime) {
  const [depHour, depMin] = departureTime.split(':').map(Number);
  const [arrHour, arrMin] = arrivalTime.split(':').map(Number);
  
  let duration = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
  
  // 处理跨天情况
  if (duration < 0) {
    duration += 24 * 60;
  }
  
  return duration;
}

module.exports = {
  searchTrains,
  getTrainDetails,
  calculateAvailableSeats,
  getFilterOptions,
  getAvailableDates
};

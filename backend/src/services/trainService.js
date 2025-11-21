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
 * 添加日期过滤，只返回指定日期的车次，且过滤已过期的车次
 * 支持城市级搜索：当传入城市名时，查询该城市所有车站的车次
 */
async function searchTrains(departureCityOrStation, arrivalCityOrStation, departureDate, trainTypes = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = getDatabase();
      
      // 确保departureDate是有效的日期
      if (!departureDate) {
        departureDate = new Date().toISOString().split('T')[0];
      }
      
      console.log('trainService.searchTrains 调用:', { 
        departureCityOrStation, 
        arrivalCityOrStation, 
        departureDate, 
        trainTypes 
      });
      
      // 获取出发站点列表（优先判断为城市）
      let departureStations = [];
      // 先尝试作为城市名获取车站列表
      departureStations = await stationService.getStationsByCity(departureCityOrStation);
      if (departureStations.length === 0) {
        // 不是城市名，尝试作为车站名
        const depCity = await stationService.getCityByStation(departureCityOrStation);
        if (depCity) {
          // 是车站名，获取该车站所在城市的所有车站
          departureStations = await stationService.getStationsByCity(depCity);
        } else {
          // 既不是城市也不是车站，返回空结果
          console.log('无效的出发地:', departureCityOrStation);
          db.close();
          return resolve([]);
        }
      }
      
      // 获取到达站点列表（优先判断为城市）
      let arrivalStations = [];
      // 先尝试作为城市名获取车站列表
      arrivalStations = await stationService.getStationsByCity(arrivalCityOrStation);
      if (arrivalStations.length === 0) {
        // 不是城市名，尝试作为车站名
        const arrCity = await stationService.getCityByStation(arrivalCityOrStation);
        if (arrCity) {
          // 是车站名，获取该车站所在城市的所有车站
          arrivalStations = await stationService.getStationsByCity(arrCity);
        } else {
          // 既不是城市也不是车站，返回空结果
          console.log('无效的到达地:', arrivalCityOrStation);
          db.close();
          return resolve([]);
        }
      }
      
      console.log('出发站点列表:', departureStations);
      console.log('到达站点列表:', arrivalStations);
      
      // 构建SQL查询，使用IN子句匹配多个车站
      const depPlaceholders = departureStations.map(() => '?').join(',');
      const arrPlaceholders = arrivalStations.map(() => '?').join(',');
      
      let sql = `
        SELECT DISTINCT t.* 
        FROM trains t
        WHERE EXISTS (
          SELECT 1 FROM train_stops WHERE train_no = t.train_no AND station IN (${depPlaceholders})
        )
        AND EXISTS (
          SELECT 1 FROM train_stops WHERE train_no = t.train_no AND station IN (${arrPlaceholders})
        )
        AND is_direct = 1
        AND t.departure_date = ?
        AND t.departure_date >= DATE('now', 'localtime')
      `;
      
      const params = [
        ...departureStations,
        ...arrivalStations,
        departureDate
      ];
      
      // 如果提供了车次类型筛选
      if (trainTypes && trainTypes.length > 0) {
        const typePlaceholders = trainTypes.map(() => '?').join(',');
        sql += ` AND SUBSTR(t.train_no, 1, 1) IN (${typePlaceholders})`;
        params.push(...trainTypes);
      }
      
      sql += ' ORDER BY t.departure_time';
      
      console.log('执行SQL查询:', { sql: sql.substring(0, 200) + '...', params });
      
      db.all(sql, params, async (err, rows) => {
      if (err) {
        db.close();
        console.error('搜索车次SQL执行失败:', {
          error: err.message,
          sql: sql.substring(0, 200) + '...',
          params
        });
        return reject(err);
      }
      
      console.log(`SQL查询返回 ${rows.length} 条原始记录`);
      
      // 获取每个车次的详细停靠信息和余票信息
      const trainsWithDetails = [];
      let completed = 0;
      
      if (rows.length === 0) {
        console.log('没有找到符合条件的车次');
        db.close();
        return resolve([]);
      }
      
      const validTrains = rows;
      
      // 使用Promise.all来并行处理所有车次
      const trainPromises = validTrains.map(train => {
        return new Promise((resolveStation) => {
          // 获取该车次所有停靠站
          db.all(
            'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
            [train.train_no],
            async (err, stops) => {
              if (err || !stops || stops.length < 2) {
                console.log(`跳过车次 ${train.train_no}: 停靠站信息不完整`);
                return resolveStation(null);
              }
              
              // 找到匹配的出发站和到达站
              const depStop = stops.find(s => departureStations.includes(s.station));
              const arrStop = stops.find(s => arrivalStations.includes(s.station));
              
              if (!depStop || !arrStop || depStop.seq >= arrStop.seq) {
                console.log(`跳过车次 ${train.train_no}: 出发站/到达站不匹配或顺序错误`);
                return resolveStation(null);
              }
              
              // 如果是今天的车次，检查是否已过发车时间
              const today = new Date().toISOString().split('T')[0];
              if (departureDate === today) {
                const now = new Date();
                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                
                if (depStop.depart_time < currentTime) {
                  console.log(`跳过车次 ${train.train_no}: 发车时间${depStop.depart_time}已过当前时间${currentTime}`);
                  return resolveStation(null);
                }
              }
              
              try {
                // 计算余票
                const availableSeats = await calculateAvailableSeats(
                  train.train_no, 
                  depStop.station, 
                  arrStop.station, 
                  departureDate
                );
                
                resolveStation({
                  trainNo: train.train_no,
                  trainType: train.train_type,
                  model: train.model,
                  departureStation: depStop.station,  // 使用实际的车站名
                  arrivalStation: arrStop.station,    // 使用实际的车站名
                  departureTime: depStop.depart_time,
                  arrivalTime: arrStop.arrive_time,
                  duration: calculateDuration(depStop.depart_time, arrStop.arrive_time),
                  departureDate: departureDate,
                  availableSeats: availableSeats
                });
              } catch (error) {
                console.error(`处理车次 ${train.train_no} 时出错:`, error);
                resolveStation(null);
              }
            }
          );
        });
      });
      
      Promise.all(trainPromises).then(results => {
        db.close();
        // 过滤掉null值
        const trainsWithDetails = results.filter(train => train !== null);
        console.log(`最终返回 ${trainsWithDetails.length} 个车次`);
        resolve(trainsWithDetails);
      }).catch(error => {
        db.close();
        console.error('处理车次列表时出错:', error);
        reject(error);
      });
    });
    } catch (error) {
      console.error('searchTrains error:', error);
      reject(error);
    }
  });
}

/**
 * 获取车次详情
 * 添加日期参数
 */
async function getTrainDetails(trainNo, departureDate) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 确保departureDate是有效的日期
    if (!departureDate) {
      departureDate = new Date().toISOString().split('T')[0];
    }
    
    db.get('SELECT * FROM trains WHERE train_no = ? AND departure_date = ?', [trainNo, departureDate], (err, train) => {
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
                    train.destination_station,
                    departureDate
                  );
                  
                  resolve({
                    trainNo: train.train_no,
                    trainType: train.train_type,
                    model: train.model,
                    departureDate: train.departure_date,
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
 * 添加日期参数
 */
async function calculateAvailableSeats(trainNo, departureStation, arrivalStation, departureDate) {
  console.log('calculateAvailableSeats called with:', { trainNo, departureStation, arrivalStation, departureDate });
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 确保departureDate是有效的日期
    if (!departureDate) {
      departureDate = new Date().toISOString().split('T')[0];
    }
    
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
                       AND departure_date = ?
                       AND seat_type = ? 
                       AND from_station = ? 
                       AND to_station = ? 
                       AND status = 'available'`;
                    console.log('Query for adjacent stations:', { trainNo, departureDate, seat_type, departureStation, arrivalStation });
                    db.get(
                      query,
                      [trainNo, departureDate, seat_type, departureStation, arrivalStation],
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
                         AND departure_date = ?
                         AND seat_type = ?
                         AND (${segmentConditions})
                         AND status = 'available'
                         GROUP BY seat_no
                         HAVING COUNT(*) = ?
                       )`,
                      [
                        trainNo, departureDate, seat_type, ...segmentParams,
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
 * 返回出发城市和到达城市的所有车站（不只是有车的）
 */
async function getFilterOptions(departureCityOrStation, arrivalCityOrStation, departureDate) {
  return new Promise(async (resolve, reject) => {
    try {
      // 获取出发站点列表
      let departureStations = [];
      const depCity = await stationService.getCityByStation(departureCityOrStation);
      if (depCity) {
        // 输入的是车站名，获取该车站所在城市的所有车站
        departureStations = await stationService.getStationsByCity(depCity);
      } else {
        // 输入的是城市名，获取该城市所有车站
        departureStations = await stationService.getStationsByCity(departureCityOrStation);
      }
      
      // 获取到达站点列表
      let arrivalStations = [];
      const arrCity = await stationService.getCityByStation(arrivalCityOrStation);
      if (arrCity) {
        // 输入的是车站名，获取该车站所在城市的所有车站
        arrivalStations = await stationService.getStationsByCity(arrCity);
      } else {
        // 输入的是城市名，获取该城市所有车站
        arrivalStations = await stationService.getStationsByCity(arrivalCityOrStation);
      }
      
      // 先搜索符合条件的车次，用于获取席别类型
      const trains = await searchTrains(departureCityOrStation, arrivalCityOrStation, departureDate);
      
      // 从车次列表中提取席别类型
      const seatTypesSet = new Set();
      trains.forEach(train => {
        if (train.availableSeats) {
          Object.keys(train.availableSeats).forEach(seatType => {
            seatTypesSet.add(seatType);
          });
        }
      });
      
      resolve({
        departureStations: departureStations,
        arrivalStations: arrivalStations,
        seatTypes: Array.from(seatTypesSet)
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 获取可选日期
 * 返回从今天开始的14天日期（包括今天）
 */
async function getAvailableDates() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
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

/**
 * 获取车次在特定站点的时间信息
 */
async function getTrainTimeDetails(trainNo, departureStation, arrivalStation) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 查询车次停靠站信息
    db.all(
      'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
      [trainNo],
      (err, stops) => {
        db.close();
        
        if (err) {
          console.error('查询车次停靠站失败:', err);
          return reject(err);
        }
        
        if (!stops || stops.length === 0) {
          return resolve(null);
        }
        
        // 找到出发站和到达站
        const depStop = stops.find(s => s.station === departureStation);
        const arrStop = stops.find(s => s.station === arrivalStation);
        
        if (!depStop || !arrStop) {
          return resolve(null);
        }
        
        resolve({
          departureTime: depStop.depart_time,
          arrivalTime: arrStop.arrive_time
        });
      }
    );
  });
}

module.exports = {
  searchTrains,
  getTrainDetails,
  calculateAvailableSeats,
  getFilterOptions,
  getAvailableDates,
  getTrainTimeDetails
};

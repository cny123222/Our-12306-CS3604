/**
 * 车次数据完整性测试
 * 
 * 验证目标：
 * 1. 车次信息.json 中的所有车次都已正确导入数据库
 * 2. 每个车次的停靠站、车厢配置、票价、座位状态完整
 * 3. 数据结构符合业务规范
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 在describe外部读取数据
const trainsJsonPath = path.join(__dirname, '../../../requirements/03-车次列表页/车次信息.json');
let trainsJsonData = [];
try {
  trainsJsonData = JSON.parse(fs.readFileSync(trainsJsonPath, 'utf8'));
} catch (err) {
  console.error('无法读取车次信息JSON:', err);
}

describe('车次数据完整性测试', () => {
  let db;

  beforeAll(() => {
    // 连接数据库
    const dbPath = process.env.TEST_DB_PATH || path.join(__dirname, '../../database/railway.db');
    db = new sqlite3.Database(dbPath);
  });

  afterAll((done) => {
    db.close(done);
  });

  describe('车次基本信息完整性', () => {
    test('数据库应包含JSON中的所有车次', (done) => {
      db.all('SELECT train_no FROM trains ORDER BY train_no', [], (err, rows) => {
        expect(err).toBeNull();
        
        const dbTrainNos = rows.map(r => r.train_no);
        const jsonTrainNos = trainsJsonData.map(t => t.train_no).sort();
        
        expect(dbTrainNos).toEqual(jsonTrainNos);
        done();
      });
    });

    test.each(trainsJsonData.map(t => t.train_no))(
      '车次 %s 的基本信息应与JSON一致',
      (trainNo, done) => {
        const jsonTrain = trainsJsonData.find(t => t.train_no === trainNo);
        
        db.get('SELECT * FROM trains WHERE train_no = ?', [trainNo], (err, dbTrain) => {
          expect(err).toBeNull();
          expect(dbTrain).toBeDefined();
          
          expect(dbTrain.train_no).toBe(jsonTrain.train_no);
          expect(dbTrain.train_type).toBe(jsonTrain.train_type);
          expect(dbTrain.model).toBe(jsonTrain.model);
          expect(dbTrain.origin_station).toBe(jsonTrain.route.origin);
          expect(dbTrain.destination_station).toBe(jsonTrain.route.destination);
          expect(dbTrain.distance_km).toBe(jsonTrain.route.distance_km);
          expect(dbTrain.planned_duration_min).toBe(jsonTrain.route.planned_duration_min);
          expect(dbTrain.departure_time).toBe(jsonTrain.route.departure_time);
          expect(dbTrain.arrival_time).toBe(jsonTrain.route.arrival_time);
          
          done();
        });
      }
    );
  });

  describe('停靠站信息完整性', () => {
    test.each(trainsJsonData.map(t => t.train_no))(
      '车次 %s 的停靠站数量应与JSON一致',
      (trainNo, done) => {
        const jsonTrain = trainsJsonData.find(t => t.train_no === trainNo);
        
        db.all(
          'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
          [trainNo],
          (err, stops) => {
            expect(err).toBeNull();
            expect(stops.length).toBe(jsonTrain.stops.length);
            
            // 验证每个停靠站的详细信息
            stops.forEach((stop, index) => {
              const jsonStop = jsonTrain.stops[index];
              expect(stop.seq).toBe(jsonStop.seq);
              expect(stop.station).toBe(jsonStop.station);
              expect(stop.arrive_time).toBe(jsonStop.arrive);
              expect(stop.depart_time).toBe(jsonStop.depart);
              expect(stop.stop_min).toBe(jsonStop.stop_min);
            });
            
            done();
          }
        );
      }
    );
  });

  describe('车厢配置完整性', () => {
    test.each(trainsJsonData.map(t => t.train_no))(
      '车次 %s 的车厢数量应与JSON一致',
      (trainNo, done) => {
        const jsonTrain = trainsJsonData.find(t => t.train_no === trainNo);
        
        db.all(
          'SELECT * FROM train_cars WHERE train_no = ? ORDER BY car_no',
          [trainNo],
          (err, cars) => {
            expect(err).toBeNull();
            expect(cars.length).toBe(jsonTrain.cars.length);
            
            // 验证每节车厢的席别
            cars.forEach((car, index) => {
              const jsonCar = jsonTrain.cars[index];
              expect(car.car_no).toBe(jsonCar.car_no);
              expect(car.seat_type).toBe(jsonCar.type);
            });
            
            done();
          }
        );
      }
    );

    test('应有正确的席别类型统计', (done) => {
      db.all(
        `SELECT train_no, seat_type, COUNT(*) as car_count 
         FROM train_cars 
         GROUP BY train_no, seat_type 
         ORDER BY train_no, seat_type`,
        [],
        (err, stats) => {
          expect(err).toBeNull();
          
          // 验证G103的席别统计
          const g103Stats = stats.filter(s => s.train_no === 'G103');
          expect(g103Stats.find(s => s.seat_type === '商务座').car_count).toBe(1);
          expect(g103Stats.find(s => s.seat_type === '一等座').car_count).toBe(2);
          expect(g103Stats.find(s => s.seat_type === '二等座').car_count).toBe(12);
          expect(g103Stats.find(s => s.seat_type === '餐车').car_count).toBe(1);
          
          done();
        }
      );
    });
  });

  describe('票价信息完整性', () => {
    test.each(trainsJsonData.map(t => t.train_no))(
      '车次 %s 的票价段数应与JSON一致',
      (trainNo, done) => {
        const jsonTrain = trainsJsonData.find(t => t.train_no === trainNo);
        
        db.all(
          'SELECT * FROM train_fares WHERE train_no = ? ORDER BY id',
          [trainNo],
          (err, fares) => {
            expect(err).toBeNull();
            expect(fares.length).toBe(jsonTrain.fares.segments.length);
            
            // 验证每段票价
            fares.forEach((fare, index) => {
              const jsonSegment = jsonTrain.fares.segments[index];
              expect(fare.from_station).toBe(jsonSegment.from);
              expect(fare.to_station).toBe(jsonSegment.to);
              expect(fare.distance_km).toBe(jsonSegment.distance_km);
              
              // 根据车次类型验证票价字段
              if (jsonSegment.second_class !== undefined) {
                expect(fare.second_class_price).toBe(jsonSegment.second_class);
              }
              if (jsonSegment.first_class !== undefined) {
                expect(fare.first_class_price).toBe(jsonSegment.first_class);
              }
              if (jsonSegment.business !== undefined) {
                expect(fare.business_price).toBe(jsonSegment.business);
              }
              if (jsonSegment.hard_sleeper !== undefined) {
                expect(fare.hard_sleeper_price).toBe(jsonSegment.hard_sleeper);
              }
              if (jsonSegment.soft_sleeper !== undefined) {
                expect(fare.soft_sleeper_price).toBe(jsonSegment.soft_sleeper);
              }
            });
            
            done();
          }
        );
      }
    );
  });

  describe('座位状态初始化完整性', () => {
    test('所有非餐车车厢都应有座位状态记录', (done) => {
      db.all(
        `SELECT tc.train_no, tc.car_no, tc.seat_type, COUNT(DISTINCT ss.seat_no) as seat_count
         FROM train_cars tc
         LEFT JOIN seat_status ss ON tc.train_no = ss.train_no AND tc.car_no = ss.car_no
         WHERE tc.seat_type != '餐车'
         GROUP BY tc.train_no, tc.car_no, tc.seat_type
         ORDER BY tc.train_no, tc.car_no`,
        [],
        (err, rows) => {
          expect(err).toBeNull();
          
          rows.forEach(row => {
            // 验证座位数量符合规范
            const expectedSeats = {
              '商务座': 10,
              '一等座': 40,
              '二等座': 80,
              '软卧': 30,
              '硬卧': 60
            };
            
            expect(row.seat_count).toBe(expectedSeats[row.seat_type]);
          });
          
          done();
        }
      );
    });

    test('每个座位应为每个区间段都有状态记录', (done) => {
      // 以G103为例，应该有 10(商务座) + 80(一等座) + 960(二等座) = 1050个座位
      // 每个座位在8个区间段都有记录，共 1050 * 8 = 8400 条记录
      
      db.get(
        `SELECT COUNT(*) as total 
         FROM seat_status 
         WHERE train_no = 'G103'`,
        [],
        (err, result) => {
          expect(err).toBeNull();
          expect(result.total).toBe(1050 * 8);
          done();
        }
      );
    });

    test('所有初始座位状态应为available', (done) => {
      db.get(
        `SELECT COUNT(*) as booked_count 
         FROM seat_status 
         WHERE status != 'available'`,
        [],
        (err, result) => {
          expect(err).toBeNull();
          expect(result.booked_count).toBe(0);
          done();
        }
      );
    });
  });

  describe('站点数据完整性', () => {
    test('应包含所有车次途经的站点', (done) => {
      // 提取JSON中所有唯一站点
      const allStations = new Set();
      trainsJsonData.forEach(train => {
        train.stops.forEach(stop => {
          allStations.add(stop.station);
        });
      });

      db.all('SELECT name FROM stations ORDER BY name', [], (err, rows) => {
        expect(err).toBeNull();
        
        const dbStations = new Set(rows.map(r => r.name));
        
        // 验证JSON中的所有站点都在数据库中
        allStations.forEach(station => {
          expect(dbStations.has(station)).toBe(true);
        });
        
        done();
      });
    });
  });

  describe('数据约束验证', () => {
    test('车次号应唯一', (done) => {
      db.all(
        'SELECT train_no, COUNT(*) as count FROM trains GROUP BY train_no HAVING count > 1',
        [],
        (err, duplicates) => {
          expect(err).toBeNull();
          expect(duplicates.length).toBe(0);
          done();
        }
      );
    });

    test('停靠站序号应连续且唯一', (done) => {
      const promises = trainsJsonData.map(train => {
        return new Promise((resolve) => {
          db.all(
            'SELECT seq FROM train_stops WHERE train_no = ? ORDER BY seq',
            [train.train_no],
            (err, rows) => {
              expect(err).toBeNull();
              
              // 验证序号从1开始且连续
              rows.forEach((row, index) => {
                expect(row.seq).toBe(index + 1);
              });
              
              resolve();
            }
          );
        });
      });

      Promise.all(promises).then(() => done());
    });

    test('车厢号应连续', (done) => {
      const promises = trainsJsonData.map(train => {
        return new Promise((resolve) => {
          db.all(
            'SELECT car_no FROM train_cars WHERE train_no = ? ORDER BY car_no',
            [train.train_no],
            (err, rows) => {
              expect(err).toBeNull();
              
              // 验证车厢号从1开始且连续
              rows.forEach((row, index) => {
                expect(row.car_no).toBe(index + 1);
              });
              
              resolve();
            }
          );
        });
      });

      Promise.all(promises).then(() => done());
    });
  });
});


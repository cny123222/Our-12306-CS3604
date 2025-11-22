/**
 * 查询每种车次、每种席位、每个车厢的座位数量统计
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/railway.db');
const db = new sqlite3.Database(dbPath);

console.log('正在查询每种车次、每种席位、每个车厢的座位数量...\n');

// 查询每种车次、每种席位、每个车厢的座位数
const query = `
  SELECT 
    train_no,
    departure_date,
    car_no,
    seat_type,
    COUNT(DISTINCT seat_no) as seat_count
  FROM seat_status
  WHERE seat_type != '餐车'
  GROUP BY train_no, departure_date, car_no, seat_type
  ORDER BY train_no, departure_date, car_no, seat_type
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('未找到座位数据');
    db.close();
    return;
  }

  // 按车次和日期分组显示
  const groupedByTrain = {};
  rows.forEach(row => {
    const key = `${row.train_no}_${row.departure_date}`;
    if (!groupedByTrain[key]) {
      groupedByTrain[key] = {
        train_no: row.train_no,
        departure_date: row.departure_date,
        cars: []
      };
    }
    groupedByTrain[key].cars.push({
      car_no: row.car_no,
      seat_type: row.seat_type,
      seat_count: row.seat_count
    });
  });

  // 显示详细结果
  console.log('='.repeat(90));
  console.log('每种车次、每种席位、每个车厢的座位数量统计（按日期）');
  console.log('='.repeat(90));
  console.log();

  Object.values(groupedByTrain).forEach(train => {
    console.log(`车次: ${train.train_no} | 日期: ${train.departure_date}`);
    console.log('-'.repeat(90));
    
    // 按车厢号排序
    train.cars.sort((a, b) => a.car_no - b.car_no);
    
    train.cars.forEach(car => {
      console.log(`  车厢 ${car.car_no.toString().padStart(2, ' ')} | ${car.seat_type.padEnd(6, ' ')} | 座位数: ${car.seat_count.toString().padStart(3, ' ')}`);
    });
    
    const totalSeats = train.cars.reduce((sum, car) => sum + car.seat_count, 0);
    console.log(`  总计: ${totalSeats} 个座位`);
    console.log();
  });

  // 统计摘要（不区分日期）
  console.log('='.repeat(90));
  console.log('统计摘要（不区分日期）');
  console.log('='.repeat(90));
  
  const summaryQuery = `
    SELECT 
      train_no,
      car_no,
      seat_type,
      COUNT(DISTINCT seat_no) as seat_count
    FROM seat_status
    WHERE seat_type != '餐车'
    GROUP BY train_no, car_no, seat_type
    ORDER BY train_no, car_no, seat_type
  `;

  db.all(summaryQuery, [], (err, summaryRows) => {
    if (err) {
      console.error('统计摘要查询失败:', err);
      db.close();
      return;
    }

    const summaryByTrain = {};
    summaryRows.forEach(row => {
      if (!summaryByTrain[row.train_no]) {
        summaryByTrain[row.train_no] = [];
      }
      summaryByTrain[row.train_no].push({
        car_no: row.car_no,
        seat_type: row.seat_type,
        seat_count: row.seat_count
      });
    });

    // 按车次排序显示
    Object.keys(summaryByTrain).sort().forEach(trainNo => {
      const cars = summaryByTrain[trainNo];
      // 按车厢号排序
      cars.sort((a, b) => a.car_no - b.car_no);
      
      console.log(`\n车次 ${trainNo}:`);
      console.log('-'.repeat(90));
      
      cars.forEach(car => {
        console.log(`  车厢 ${car.car_no.toString().padStart(2, ' ')} | ${car.seat_type.padEnd(6, ' ')} | ${car.seat_count.toString().padStart(3, ' ')} 个座位`);
      });
      
      const totalSeats = cars.reduce((sum, car) => sum + car.seat_count, 0);
      console.log(`  总计: ${totalSeats} 个座位`);
    });

    // 按席位类型汇总
    console.log('\n' + '='.repeat(90));
    console.log('按席位类型汇总（所有车次）');
    console.log('='.repeat(90));
    
    const seatTypeSummary = {};
    summaryRows.forEach(row => {
      if (!seatTypeSummary[row.seat_type]) {
        seatTypeSummary[row.seat_type] = {
          totalSeats: 0,
          totalCars: 0,
          trains: new Set()
        };
      }
      seatTypeSummary[row.seat_type].totalSeats += row.seat_count;
      seatTypeSummary[row.seat_type].totalCars += 1;
      seatTypeSummary[row.seat_type].trains.add(row.train_no);
    });

    Object.keys(seatTypeSummary).sort().forEach(seatType => {
      const summary = seatTypeSummary[seatType];
      console.log(`${seatType.padEnd(6, ' ')}: ${summary.totalSeats.toString().padStart(4, ' ')} 个座位 | ${summary.totalCars.toString().padStart(3, ' ')} 个车厢 | ${summary.trains.size} 个车次`);
    });

    console.log('\n查询完成！');
    db.close();
  });
});


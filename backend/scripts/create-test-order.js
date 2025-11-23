/**
 * 创建测试订单
 * 11月26日 G16 上海虹桥→济南西 商务座 9张
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../database/railway.db');
const db = new sqlite3.Database(dbPath);

// 订单信息
const orderInfo = {
  trainNo: 'G16',
  departureDate: '2025-11-27',
  departureStation: '上海虹桥',
  arrivalStation: '南京南',
  seatType: '商务座',
  quantity: 10,
  departureTime: '06:20',
  arrivalTime: '07:35'
};

async function getOrCreateTestUser() {
  return new Promise((resolve, reject) => {
    // 查找或创建测试用户
    db.get('SELECT id, username FROM users WHERE username = ?', ['testuser'], (err, user) => {
      if (err) {
        reject(err);
      } else if (user) {
        console.log(`✓ 使用现有测试用户: ${user.username} (ID: ${user.id})`);
        resolve(user.id);
      } else {
        // 创建新测试用户
        const sql = `INSERT INTO users (username, email, phone, password, name, id_card_type, id_card_number) 
                     VALUES ('testuser', 'test@example.com', '13800138000', 'testpass123', '测试用户', '二代身份证', '110101199001011234')`;
        db.run(sql, function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✓ 创建测试用户: testuser (ID: ${this.lastID})`);
            resolve(this.lastID);
          }
        });
      }
    });
  });
}

async function createPassengers(userId) {
  const passengers = [];
  
  for (let i = 1; i <= orderInfo.quantity; i++) {
    const passenger = {
      id: uuidv4(),
      userId: userId,
      name: `测试乘客${i}`,
      idType: '二代身份证',
      idNumber: `11010119900101${String(i).padStart(4, '0')}`,
      phone: `1380013800${i}`,
      discountType: '成人'
    };
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO passengers (id, user_id, name, id_card_type, id_card_number, phone, discount_type, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [passenger.id, passenger.userId, passenger.name, passenger.idType, passenger.idNumber, passenger.phone, passenger.discountType],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    passengers.push(passenger);
  }
  
  console.log(`✓ 创建/确认 ${passengers.length} 个乘车人`);
  return passengers;
}

async function getSegments() {
  // 获取从出发站到到达站之间的所有区间
  const stops = await new Promise((resolve, reject) => {
    db.all(
      `SELECT seq, station FROM train_stops WHERE train_no = ? ORDER BY seq`,
      [orderInfo.trainNo],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
  
  const startSeq = stops.find(s => s.station === orderInfo.departureStation)?.seq;
  const endSeq = stops.find(s => s.station === orderInfo.arrivalStation)?.seq;
  
  if (!startSeq || !endSeq) {
    throw new Error(`找不到站点序号：${orderInfo.departureStation} 或 ${orderInfo.arrivalStation}`);
  }
  
  const segments = [];
  for (let i = startSeq; i < endSeq; i++) {
    segments.push({
      from: stops[i - 1].station,
      to: stops[i].station
    });
  }
  
  console.log(`✓ 路径包含 ${segments.length} 个区间:`, segments.map(s => `${s.from}→${s.to}`).join(', '));
  return segments;
}

async function allocateSeats(passengers) {
  const segments = await getSegments();
  
  // 找到在所有区间都可用的座位
  const availableSeats = await new Promise((resolve, reject) => {
    // 先获取第一个区间的可用座位
    db.all(
      `SELECT DISTINCT car_no, seat_no FROM seat_status 
       WHERE train_no = ? AND departure_date = ? AND seat_type = ? 
       AND from_station = ? AND to_station = ? AND status = 'available'`,
      [orderInfo.trainNo, orderInfo.departureDate, orderInfo.seatType, 
       segments[0].from, segments[0].to],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
  
  // 筛选在所有区间都可用的座位
  const validSeats = [];
  for (const seat of availableSeats) {
    let isAvailableInAllSegments = true;
    
    for (const segment of segments) {
      const count = await new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(*) as cnt FROM seat_status 
           WHERE train_no = ? AND departure_date = ? AND seat_type = ?
           AND car_no = ? AND seat_no = ?
           AND from_station = ? AND to_station = ? AND status = 'available'`,
          [orderInfo.trainNo, orderInfo.departureDate, orderInfo.seatType,
           seat.car_no, seat.seat_no, segment.from, segment.to],
          (err, row) => {
            if (err) reject(err);
            else resolve(row.cnt);
          }
        );
      });
      
      if (count === 0) {
        isAvailableInAllSegments = false;
        break;
      }
    }
    
    if (isAvailableInAllSegments) {
      validSeats.push(seat);
      if (validSeats.length >= orderInfo.quantity) break;
    }
  }
  
  if (validSeats.length < orderInfo.quantity) {
    throw new Error(`可用座位不足！需要${orderInfo.quantity}个连续可用座位，只找到${validSeats.length}个`);
  }
  
  const seats = passengers.map((passenger, i) => ({
    passengerId: passenger.id,
    passengerName: passenger.name,
    carNo: validSeats[i].car_no,
    seatNo: validSeats[i].seat_no,
    segments: segments
  }));
  
  console.log(`✓ 分配 ${seats.length} 个座位 (每个座位跨 ${segments.length} 个区间)`);
  return seats;
}

async function createOrder(userId, passengers, seats) {
  const orderId = uuidv4();
  
  // 计算票价 (商务座单程票价)
  const pricePerSeat = await new Promise((resolve, reject) => {
    db.get(
      `SELECT business_price FROM train_fares 
       WHERE train_no = ? AND from_station = ? AND to_station = ?`,
      [orderInfo.trainNo, orderInfo.departureStation, orderInfo.arrivalStation],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.business_price : 500); // 默认500元
      }
    );
  });
  
  const totalPrice = pricePerSeat * orderInfo.quantity;
  
  // 创建订单
  await new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO orders (
        id, user_id, train_number, departure_date, departure_station, arrival_station,
        departure_time, arrival_time, status, total_price, created_at, payment_expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+30 minutes'))
    `;
    
    db.run(sql, [
      orderId, userId, orderInfo.trainNo, orderInfo.departureDate,
      orderInfo.departureStation, orderInfo.arrivalStation,
      orderInfo.departureTime, orderInfo.arrivalTime,
      'confirmed_unpaid', totalPrice
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  // 创建订单详情
  for (let i = 0; i < passengers.length; i++) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO order_details (
          order_id, passenger_id, passenger_name, id_card_type, id_card_number,
          seat_type, ticket_type, car_number, seat_number, price, sequence_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, seats[i].passengerId, seats[i].passengerName,
          passengers[i].idType, passengers[i].idNumber,
          orderInfo.seatType, '成人票', seats[i].carNo, seats[i].seatNo, pricePerSeat, i + 1
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // 更新所有区间的座位状态为已预订
    for (const segment of seats[i].segments) {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE seat_status SET status = 'booked', booked_by = ?, booked_at = datetime('now')
           WHERE train_no = ? AND departure_date = ? AND car_no = ? AND seat_no = ?
           AND from_station = ? AND to_station = ?`,
          [orderId, orderInfo.trainNo, orderInfo.departureDate, seats[i].carNo, seats[i].seatNo,
           segment.from, segment.to],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
  }
  
  console.log(`✓ 创建订单: ${orderId}`);
  console.log(`  总价: ¥${totalPrice} (${pricePerSeat}元/张 × ${orderInfo.quantity}张)`);
  
  return { orderId, totalPrice, pricePerSeat };
}

async function main() {
  console.log('🎫 开始创建测试订单...\n');
  console.log(`订单信息:`);
  console.log(`  车次: ${orderInfo.trainNo}`);
  console.log(`  日期: ${orderInfo.departureDate}`);
  console.log(`  区间: ${orderInfo.departureStation} → ${orderInfo.arrivalStation}`);
  console.log(`  座位类型: ${orderInfo.seatType}`);
  console.log(`  数量: ${orderInfo.quantity}张\n`);
  
  try {
    // 1. 获取或创建测试用户
    const userId = await getOrCreateTestUser();
    
    // 2. 创建乘车人
    const passengers = await createPassengers(userId);
    
    // 3. 分配座位
    const seats = await allocateSeats(passengers);
    
    // 4. 创建订单
    const order = await createOrder(userId, passengers, seats);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 测试订单创建成功！');
    console.log(`📋 订单ID: ${order.orderId}`);
    console.log(`💰 订单总价: ¥${order.totalPrice}`);
    console.log(`👥 乘车人数: ${orderInfo.quantity}人`);
    console.log(`📅 出发日期: ${orderInfo.departureDate}`);
    console.log(`🚄 车次区间: ${orderInfo.trainNo} ${orderInfo.departureStation}→${orderInfo.arrivalStation}`);
    console.log(`💺 座位类型: ${orderInfo.seatType}`);
    console.log(`⏰ 订单状态: 待支付 (30分钟内需完成支付)`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 创建失败:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


/**
 * 跨区间座位分配简化集成测试
 * 使用 fetch API 测试座位分配是否正常工作
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = null;
let userId = null;

// 工具函数：注册用户
async function register() {
  console.log('\n📋 步骤 0.1: 注册测试用户...');
  
  const timestamp = Date.now();
  const username = `testuser_${timestamp}`;
  const email = `test_${timestamp}@example.com`;
  
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      email,
      password: 'password123',
      phone: '13800138000'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error('注册失败: ' + error);
  }
  
  const data = await response.json();
  authToken = data.token;
  userId = data.userId;
  
  console.log('✅ 注册成功, userId:', userId, 'username:', username);
  return { username, password: 'password123' };
}

// 工具函数：登录
async function login(username, password) {
  console.log('\n📋 步骤 0.2: 登录测试用户...');
  
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier: username,
      password: password
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error('登录失败: ' + error);
  }
  
  const data = await response.json();
  authToken = data.token;
  userId = data.userId;
  
  console.log('✅ 登录成功, userId:', userId);
}

// 工具函数：添加乘客
async function addPassenger() {
  console.log('\n📋 添加测试乘客...');
  
  const response = await fetch(`${API_BASE_URL}/passengers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      name: '测试乘客',
      idCardType: '身份证',
      idCardNumber: '310101199001011234',
      phoneNumber: '13800138000',
      passengerType: '成人'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error('添加乘客失败: ' + error);
  }
  
  const data = await response.json();
  console.log('✅ 乘客添加成功, passengerId:', data.passengerId);
  return data.passengerId;
}

// 工具函数：获取乘客列表
async function getPassengers() {
  const response = await fetch(`${API_BASE_URL}/passengers`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error('获取乘客列表失败');
  }
  
  const data = await response.json();
  return data.passengers;
}

// 工具函数：查询车次并获取余票信息
async function searchTrains(departureStation, arrivalStation, departureDate) {
  const response = await fetch(
    `${API_BASE_URL}/trains/search?departureStation=${encodeURIComponent(departureStation)}&arrivalStation=${encodeURIComponent(arrivalStation)}&departureDate=${departureDate}`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('查询车次失败');
  }
  
  const data = await response.json();
  return data.trains;
}

// 工具函数：创建订单并确认
async function createAndConfirmOrder(trainNo, departureStation, arrivalStation, departureDate, seatType) {
  // 获取乘客列表
  const passengers = await getPassengers();
  if (passengers.length === 0) {
    throw new Error('没有可用的乘客');
  }
  
  const passenger = passengers[0];
  
  // 创建订单
  console.log(`\n📋 创建订单: ${trainNo} ${departureStation}→${arrivalStation}, 席别: ${seatType}`);
  
  const createResponse = await fetch(`${API_BASE_URL}/orders/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      trainNo,
      departureStation,
      arrivalStation,
      departureDate,
      passengers: [
        {
          passengerId: passenger.id,
          seatType,
          ticketType: '成人票'
        }
      ]
    })
  });
  
  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`创建订单失败: ${error.error || error.message}`);
  }
  
  const orderData = await createResponse.json();
  const orderId = orderData.orderId;
  console.log('✅ 订单创建成功, orderId:', orderId);
  
  // 确认订单
  console.log(`📋 确认订单: ${orderId}`);
  
  const confirmResponse = await fetch(`${API_BASE_URL}/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!confirmResponse.ok) {
    const error = await confirmResponse.json();
    throw new Error(`确认订单失败: ${error.error || error.message}`);
  }
  
  const confirmData = await confirmResponse.json();
  console.log('✅ 订单确认成功, 座位号:', confirmData.tickets.map(t => t.seatNo).join(', '));
  
  return confirmData;
}

// 主测试流程
async function runTests() {
  try {
    console.log('🚀 开始跨区间座位分配集成测试');
    console.log('=' .repeat(80));
    
    // 注册新用户
    await register();
    
    // 添加乘客
    await addPassenger();
    
    // 测试 1: 全程订单（上海→北京）
    console.log('\n' + '='.repeat(80));
    console.log('📝 测试 1: 全程订单（上海→北京）');
    console.log('='.repeat(80));
    
    let trains = await searchTrains('上海', '北京', '2025-11-15');
    let d6Train = trains.find(t => t.trainNo === 'D6');
    if (!d6Train) {
      throw new Error('未找到 D6 车次');
    }
    
    const beforeFullTrip = d6Train.availableSeats['二等座'];
    console.log('预订前余票:', d6Train.availableSeats);
    
    await createAndConfirmOrder('D6', '上海', '北京', '2025-11-15', '二等座');
    
    trains = await searchTrains('上海', '北京', '2025-11-15');
    d6Train = trains.find(t => t.trainNo === 'D6');
    const afterFullTrip = d6Train.availableSeats['二等座'];
    console.log('预订后余票:', d6Train.availableSeats);
    
    if (afterFullTrip === beforeFullTrip - 1) {
      console.log('✅ 测试 1 通过: 全程订单余票数正确减少 1');
    } else {
      console.log('❌ 测试 1 失败: 余票数变化不正确');
      console.log(`   期望: ${beforeFullTrip - 1}, 实际: ${afterFullTrip}`);
    }
    
    // 测试 2: 部分区间订单（无锡→南京）
    console.log('\n' + '='.repeat(80));
    console.log('📝 测试 2: 部分区间订单（无锡→南京）');
    console.log('='.repeat(80));
    
    trains = await searchTrains('无锡', '南京', '2025-11-15');
    d6Train = trains.find(t => t.trainNo === 'D6');
    if (!d6Train) {
      throw new Error('未找到 D6 车次（无锡→南京）');
    }
    
    const beforePartialTrip = d6Train.availableSeats['二等座'];
    console.log('预订前余票:', d6Train.availableSeats);
    
    await createAndConfirmOrder('D6', '无锡', '南京', '2025-11-15', '二等座');
    
    trains = await searchTrains('无锡', '南京', '2025-11-15');
    d6Train = trains.find(t => t.trainNo === 'D6');
    const afterPartialTrip = d6Train.availableSeats['二等座'];
    console.log('预订后余票:', d6Train.availableSeats);
    
    if (afterPartialTrip === beforePartialTrip - 1) {
      console.log('✅ 测试 2 通过: 部分区间订单余票数正确减少 1');
      console.log('🎉 关键测试通过！之前失败的场景现在已修复！');
    } else {
      console.log('❌ 测试 2 失败: 余票数变化不正确');
      console.log(`   期望: ${beforePartialTrip - 1}, 实际: ${afterPartialTrip}`);
      console.log('⚠️  这是之前失败的场景，修复可能未生效');
    }
    
    // 测试 3: 另一个部分区间订单（徐州→济南）
    console.log('\n' + '='.repeat(80));
    console.log('📝 测试 3: 部分区间订单（徐州→济南）');
    console.log('='.repeat(80));
    
    trains = await searchTrains('徐州', '济南', '2025-11-15');
    d6Train = trains.find(t => t.trainNo === 'D6');
    if (!d6Train) {
      throw new Error('未找到 D6 车次（徐州→济南）');
    }
    
    const beforePartialTrip2 = d6Train.availableSeats['二等座'];
    console.log('预订前余票:', d6Train.availableSeats);
    
    await createAndConfirmOrder('D6', '徐州', '济南', '2025-11-15', '二等座');
    
    trains = await searchTrains('徐州', '济南', '2025-11-15');
    d6Train = trains.find(t => t.trainNo === 'D6');
    const afterPartialTrip2 = d6Train.availableSeats['二等座'];
    console.log('预订后余票:', d6Train.availableSeats);
    
    if (afterPartialTrip2 === beforePartialTrip2 - 1) {
      console.log('✅ 测试 3 通过: 部分区间订单余票数正确减少 1');
    } else {
      console.log('❌ 测试 3 失败: 余票数变化不正确');
      console.log(`   期望: ${beforePartialTrip2 - 1}, 实际: ${afterPartialTrip2}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 测试完成！');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('测试执行失败:', err);
    process.exit(1);
  });


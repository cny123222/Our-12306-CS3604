#!/usr/bin/env node

/**
 * 端到端完整业务流程测试
 * 测试从首页查询到订单提交的完整用户旅程
 */

const axios = require('axios');

// 配置
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// 测试数据
let testData = {
  stations: [],
  selectedDeparture: '北京南',
  selectedArrival: '沧州西',  // 使用有完整票价数据的相邻站点
  selectedDate: '2025-11-15',
  selectedTrain: null,
  passengers: [],
  order: null
};

// 工具函数
function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
}

function logStep(stepNumber, description) {
  console.log(`\n${colors.blue}步骤 ${stepNumber}: ${description}${colors.reset}`);
  testResults.total++;
}

function logSuccess(message) {
  console.log(`${colors.green}  ✓ ${message}${colors.reset}`);
  testResults.passed++;
}

function logError(message, error = null) {
  console.log(`${colors.red}  ✗ ${message}${colors.reset}`);
  if (error) {
    console.log(`${colors.red}    错误: ${error.message || error}${colors.reset}`);
  }
  testResults.failed++;
  testResults.errors.push({ message, error: error?.message || error });
}

function logInfo(message) {
  console.log(`${colors.gray}  ℹ ${message}${colors.reset}`);
}

// 端到端测试流程
async function runE2ETest() {
  logSection('12306系统端到端完整业务流程测试');
  console.log(`${colors.gray}后端服务: ${BACKEND_URL}${colors.reset}`);
  console.log(`${colors.gray}前端服务: ${FRONTEND_URL}${colors.reset}`);

  try {
    // 步骤1: 用户访问首页
    await testStep1_AccessHomePage();

    // 步骤2: 用户查看站点列表
    await testStep2_GetStations();

    // 步骤3: 用户选择出发地和到达地
    await testStep3_SelectStations();

    // 步骤4: 用户查询车次
    await testStep4_SearchTrains();

    // 步骤5: 用户选择车次
    await testStep5_SelectTrain();

    // 步骤6: 用户查看订单填写页
    await testStep6_ViewOrderPage();

    // 步骤7: 用户选择乘客
    await testStep7_SelectPassengers();

    // 步骤8: 用户选择席别
    await testStep8_SelectSeatType();

    // 步骤9: 用户提交订单
    await testStep9_SubmitOrder();

    // 步骤10: 用户核对订单信息
    await testStep10_ReviewOrder();

    // 步骤11: 用户确认订单
    await testStep11_ConfirmOrder();

    // 测试总结
    printSummary();

  } catch (error) {
    console.error(`${colors.red}测试执行出错: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// 步骤1: 访问首页
async function testStep1_AccessHomePage() {
  logStep(1, '用户访问12306首页');

  try {
    const response = await axios.get(`${FRONTEND_URL}/`, { timeout: 5000 });
    if (response.status === 200) {
      logSuccess('首页加载成功');
    } else {
      logError('首页加载失败');
    }
  } catch (error) {
    logError('无法访问首页', error);
  }
}

// 步骤2: 获取站点列表
async function testStep2_GetStations() {
  logStep(2, '获取所有可用站点列表');

  try {
    const response = await axios.get(`${BACKEND_URL}/api/stations`);
    if (response.status === 200 && response.data.stations) {
      testData.stations = response.data.stations;
      logSuccess(`成功获取 ${testData.stations.length} 个站点`);
      logInfo(`站点包括: ${testData.stations.slice(0, 5).map(s => s.name).join(', ')}...`);
    } else {
      logError('获取站点列表失败');
    }
  } catch (error) {
    logError('获取站点列表失败', error);
  }
}

// 步骤3: 选择出发地和到达地
async function testStep3_SelectStations() {
  logStep(3, '选择出发地和到达地');

  try {
    // 验证出发地
    const departureResponse = await axios.post(`${BACKEND_URL}/api/stations/validate`, {
      stationName: testData.selectedDeparture
    });

    if (departureResponse.status === 200 && departureResponse.data.valid) {
      logSuccess(`出发地 "${testData.selectedDeparture}" 验证通过`);
    } else {
      logError('出发地验证失败');
      return;
    }

    // 验证到达地
    const arrivalResponse = await axios.post(`${BACKEND_URL}/api/stations/validate`, {
      stationName: testData.selectedArrival
    });

    if (arrivalResponse.status === 200 && arrivalResponse.data.valid) {
      logSuccess(`到达地 "${testData.selectedArrival}" 验证通过`);
    } else {
      logError('到达地验证失败');
    }
  } catch (error) {
    logError('站点验证失败', error);
  }
}

// 步骤4: 查询车次
async function testStep4_SearchTrains() {
  logStep(4, '查询符合条件的车次列表');

  try {
    const startTime = Date.now();
    const response = await axios.post(`${BACKEND_URL}/api/trains/search`, {
      departureStation: testData.selectedDeparture,
      arrivalStation: testData.selectedArrival,
      departureDate: testData.selectedDate
    });

    const responseTime = Date.now() - startTime;

    if (response.status === 200 && response.data.trains) {
      logSuccess(`查询成功，找到 ${response.data.trains.length} 个车次`);
      logInfo(`响应时间: ${responseTime}ms`);
      
      if (response.data.trains.length > 0) {
        testData.selectedTrain = response.data.trains[0];
        logInfo(`选择车次: ${testData.selectedTrain.trainNo}`);
      } else {
        logError('没有找到可用车次');
      }
    } else {
      logError('车次查询失败');
    }
  } catch (error) {
    logError('车次查询失败', error);
  }
}

// 步骤5: 选择车次
async function testStep5_SelectTrain() {
  logStep(5, '查看选中车次的详细信息');

  if (!testData.selectedTrain) {
    logError('没有可用的车次');
    return;
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/api/trains/${testData.selectedTrain.trainNo}`);
    
    if (response.status === 200 && response.data.trainNo) {
      logSuccess(`获取车次 ${testData.selectedTrain.trainNo} 详情成功`);
      logInfo(`车次类型: ${response.data.trainType || 'N/A'}`);
      logInfo(`停靠站数: ${response.data.stops?.length || 'N/A'}`);
    } else {
      logError('获取车次详情失败');
    }
  } catch (error) {
    logError('获取车次详情失败', error);
  }
}

// 步骤6: 查看订单填写页
async function testStep6_ViewOrderPage() {
  logStep(6, '进入订单填写页面');

  if (!testData.selectedTrain) {
    logError('没有可用的车次');
    return;
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/api/orders/new`, {
      params: {
        trainNo: testData.selectedTrain.trainNo,
        departureStation: testData.selectedDeparture,
        arrivalStation: testData.selectedArrival,
        departureDate: testData.selectedDate
      },
      headers: {
        Authorization: 'Bearer test-token'
      }
    });

    if (response.status === 200) {
      logSuccess('订单填写页面加载成功');
      logInfo(`车次信息: ${response.data.trainInfo?.trainNo || 'N/A'}`);
      logInfo(`默认席别: ${response.data.defaultSeatType || 'N/A'}`);
    } else {
      logError('订单填写页面加载失败');
    }
  } catch (error) {
    logError('订单填写页面加载失败', error);
  }
}

// 步骤7: 选择乘客
async function testStep7_SelectPassengers() {
  logStep(7, '获取并选择乘客');

  try {
    const response = await axios.get(`${BACKEND_URL}/api/passengers`, {
      headers: {
        Authorization: 'Bearer test-token'
      }
    });

    if (response.status === 200 && response.data.passengers) {
      testData.passengers = response.data.passengers;
      logSuccess(`获取乘客列表成功，共 ${testData.passengers.length} 名乘客`);
      
      if (testData.passengers.length > 0) {
        logInfo(`选择乘客: ${testData.passengers[0].name}`);
      } else {
        logError('没有可用的乘客');
      }
    } else {
      logError('获取乘客列表失败');
    }
  } catch (error) {
    logError('获取乘客列表失败', error);
  }
}

// 步骤8: 选择席别
async function testStep8_SelectSeatType() {
  logStep(8, '查看可选席别');

  if (!testData.selectedTrain) {
    logError('没有可用的车次');
    return;
  }

  try {
    const response = await axios.get(`${BACKEND_URL}/api/orders/available-seat-types`, {
      params: {
        trainNo: testData.selectedTrain.trainNo,
        departureStation: testData.selectedDeparture,
        arrivalStation: testData.selectedArrival,
        departureDate: testData.selectedDate
      },
      headers: {
        Authorization: 'Bearer test-token'
      }
    });

    if (response.status === 200 && response.data.seatTypes) {
      logSuccess(`获取有票席别成功，共 ${response.data.seatTypes.length} 种席别`);
      logInfo(`可选席别: ${response.data.seatTypes.map(s => s.type).join(', ')}`);
    } else {
      logError('获取席别信息失败');
    }
  } catch (error) {
    logError('获取席别信息失败', error);
  }
}

// 步骤9: 提交订单
async function testStep9_SubmitOrder() {
  logStep(9, '提交订单');

  if (!testData.selectedTrain || testData.passengers.length === 0) {
    logError('缺少必要的订单信息');
    return;
  }

  try {
    const response = await axios.post(`${BACKEND_URL}/api/orders/submit`, {
      trainNo: testData.selectedTrain.trainNo,
      departureStation: testData.selectedDeparture,
      arrivalStation: testData.selectedArrival,
      departureDate: testData.selectedDate,
      passengers: [
        {
          passengerId: testData.passengers[0].id,
          ticketType: '成人票',
          seatType: '二等座'
        }
      ]
    }, {
      headers: {
        Authorization: 'Bearer test-token'
      }
    });

    if (response.status === 200 && response.data.orderId) {
      testData.order = response.data;
      logSuccess('订单提交成功');
      logInfo(`订单ID: ${testData.order.orderId}`);
    } else {
      logError('订单提交失败');
    }
  } catch (error) {
    logError('订单提交失败', error);
  }
}

// 步骤10: 核对订单信息
async function testStep10_ReviewOrder() {
  logStep(10, '查看订单核对信息');

  if (!testData.order) {
    logError('没有可用的订单');
    return;
  }

  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/orders/${testData.order.orderId}/confirmation`,
      {
        headers: {
          Authorization: 'Bearer test-token'
        }
      }
    );

    if (response.status === 200) {
      logSuccess('获取订单核对信息成功');
      logInfo(`车次: ${response.data.trainInfo?.trainNo || 'N/A'}`);
      logInfo(`乘客数: ${response.data.passengers?.length || 0}`);
      logInfo(`总价: ¥${response.data.totalPrice || 'N/A'}`);
    } else {
      logError('获取订单核对信息失败');
    }
  } catch (error) {
    logError('获取订单核对信息失败', error);
  }
}

// 步骤11: 确认订单
async function testStep11_ConfirmOrder() {
  logStep(11, '确认订单');

  if (!testData.order) {
    logError('没有可用的订单');
    return;
  }

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/orders/${testData.order.orderId}/confirm`,
      {},
      {
        headers: {
          Authorization: 'Bearer test-token'
        }
      }
    );

    if (response.status === 200) {
      logSuccess('订单确认成功');
      logInfo(`订单状态: ${response.data.status || 'N/A'}`);
      logInfo(`提示信息: ${response.data.message || 'N/A'}`);
    } else {
      logError('订单确认失败');
    }
  } catch (error) {
    logError('订单确认失败', error);
  }
}

// 打印测试总结
function printSummary() {
  logSection('端到端测试总结');

  console.log(`${colors.gray}总步骤数: ${testResults.total}${colors.reset}`);
  console.log(`${colors.green}成功: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);

  const successRate = testResults.total > 0 
    ? Math.round((testResults.passed / testResults.total) * 100) 
    : 0;
  console.log(`${colors.cyan}成功率: ${successRate}%${colors.reset}`);

  if (testResults.failed > 0) {
    console.log(`\n${colors.red}失败的步骤:${colors.reset}`);
    testResults.errors.forEach((err, index) => {
      console.log(`${colors.red}${index + 1}. ${err.message}${colors.reset}`);
      if (err.error) {
        console.log(`${colors.gray}   ${err.error}${colors.reset}`);
      }
    });
  }

  if (testResults.failed === 0) {
    console.log(`\n${colors.green}🎉 所有端到端测试通过！用户旅程完整且流畅！${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ 部分测试失败，请检查上述错误${colors.reset}`);
    process.exit(1);
  }
}

// 运行测试
runE2ETest().catch(error => {
  console.error(`${colors.red}测试执行异常: ${error.message}${colors.reset}`);
  process.exit(1);
});


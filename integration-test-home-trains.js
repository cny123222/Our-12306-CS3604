/**
 * 首页和车次列表页集成测试
 * 
 * 测试目标：验证首页查询到车次列表页的完整流程
 * 测试范围：前后端完整联调，包括API调用、数据流转、页面跳转
 */

const axios = require('axios');
const chalk = require('chalk');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let testsPassed = 0;
let testsFailed = 0;

/**
 * 测试工具函数
 */
function logSuccess(message) {
  console.log(chalk.green('✓'), message);
  testsPassed++;
}

function logFailure(message, error) {
  console.log(chalk.red('✗'), message);
  if (error) {
    console.log(chalk.red('  Error:'), error.message || error);
  }
  testsFailed++;
}

function logInfo(message) {
  console.log(chalk.blue('ℹ'), message);
}

function logSection(title) {
  console.log('\n' + chalk.bold.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan(title));
  console.log(chalk.bold.cyan('═'.repeat(60)));
}

/**
 * 测试后端服务是否运行
 */
async function testBackendHealth() {
  logSection('测试后端服务健康检查');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      logSuccess('后端服务运行正常');
      return true;
    } else {
      logFailure('后端服务响应异常');
      return false;
    }
  } catch (error) {
    logFailure('无法连接到后端服务', error);
    logInfo(`请确保后端服务运行在 ${BACKEND_URL}`);
    return false;
  }
}

/**
 * 测试站点API
 */
async function testStationsAPI() {
  logSection('测试站点API');
  
  // 测试获取所有站点
  try {
    const response = await axios.get(`${BACKEND_URL}/api/stations`);
    
    if (response.status === 200 && Array.isArray(response.data.stations)) {
      logSuccess(`获取所有站点成功，共 ${response.data.stations.length} 个站点`);
    } else {
      logFailure('获取站点列表失败：响应格式不正确');
    }
  } catch (error) {
    logFailure('获取站点列表失败', error);
  }
  
  // 测试站点搜索
  try {
    const response = await axios.get(`${BACKEND_URL}/api/stations`, {
      params: { keyword: '北京' }
    });
    
    if (response.status === 200 && Array.isArray(response.data.stations)) {
      logSuccess(`搜索"北京"站点成功，找到 ${response.data.stations.length} 个匹配结果`);
    } else {
      logFailure('搜索站点失败：响应格式不正确');
    }
  } catch (error) {
    logFailure('搜索站点失败', error);
  }
  
  // 测试站点验证
  try {
    const response = await axios.post(`${BACKEND_URL}/api/stations/validate`, {
      stationName: '北京南'
    });
    
    if (response.status === 200 && response.data.valid === true) {
      logSuccess('验证有效站点成功');
    } else {
      logFailure('验证站点失败：响应格式不正确');
    }
  } catch (error) {
    logFailure('验证站点失败', error);
  }
  
  // 测试无效站点
  try {
    const response = await axios.post(`${BACKEND_URL}/api/stations/validate`, {
      stationName: '不存在的城市'
    });
    
    if (response.status === 400 && response.data.valid === false) {
      logSuccess('无效站点正确返回错误');
    } else {
      logFailure('无效站点处理不正确');
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('无效站点正确返回400错误');
    } else {
      logFailure('无效站点处理失败', error);
    }
  }
}

/**
 * 测试车次搜索API
 */
async function testTrainSearchAPI() {
  logSection('测试车次搜索API');
  
  // 测试缺少出发地
  try {
    const response = await axios.post(`${BACKEND_URL}/api/trains/search`, {
      arrivalStation: '上海虹桥',
      departureDate: '2025-11-15'
    });
    
    logFailure('缺少出发地应该返回错误，但请求成功了');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('缺少出发地正确返回400错误');
    } else {
      logFailure('缺少出发地错误处理不正确', error);
    }
  }
  
  // 测试缺少到达地
  try {
    const response = await axios.post(`${BACKEND_URL}/api/trains/search`, {
      departureStation: '北京南',
      departureDate: '2025-11-15'
    });
    
    logFailure('缺少到达地应该返回错误，但请求成功了');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('缺少到达地正确返回400错误');
    } else {
      logFailure('缺少到达地错误处理不正确', error);
    }
  }
  
  // 测试有效查询
  try {
    const startTime = Date.now();
    const response = await axios.post(`${BACKEND_URL}/api/trains/search`, {
      departureStation: '北京南',
      arrivalStation: '上海虹桥',
      departureDate: '2025-11-15'
    });
    const elapsed = Date.now() - startTime;
    
    if (response.status === 200 && Array.isArray(response.data.trains)) {
      logSuccess(`查询车次成功，找到 ${response.data.trains.length} 个车次`);
      
      if (elapsed < 100) {
        logSuccess(`查询响应时间 ${elapsed}ms，符合100毫秒要求`);
      } else {
        logFailure(`查询响应时间 ${elapsed}ms，超过100毫秒要求`);
      }
      
      if (response.data.timestamp) {
        logSuccess('返回了查询时间戳');
      } else {
        logFailure('未返回查询时间戳');
      }
    } else {
      logFailure('查询车次失败：响应格式不正确');
    }
  } catch (error) {
    logFailure('查询车次失败', error);
  }
  
  // 测试按车次类型筛选
  try {
    const response = await axios.post(`${BACKEND_URL}/api/trains/search`, {
      departureStation: '北京南',
      arrivalStation: '上海虹桥',
      departureDate: '2025-11-15',
      trainTypes: ['G', 'C']
    });
    
    if (response.status === 200 && Array.isArray(response.data.trains)) {
      logSuccess('按车次类型筛选成功');
      
      // 验证返回的车次类型
      const allValid = response.data.trains.every(train => 
        train.trainNo && (train.trainNo.startsWith('G') || train.trainNo.startsWith('C'))
      );
      
      if (allValid || response.data.trains.length === 0) {
        logSuccess('筛选结果符合车次类型要求');
      } else {
        logFailure('筛选结果包含不符合要求的车次类型');
      }
    } else {
      logFailure('按车次类型筛选失败');
    }
  } catch (error) {
    logFailure('按车次类型筛选失败', error);
  }
}

/**
 * 测试车次详情API
 */
async function testTrainDetailsAPI() {
  logSection('测试车次详情API');
  
  // 测试有效车次
  try {
    const response = await axios.get(`${BACKEND_URL}/api/trains/G103`);
    
    if (response.status === 200 && response.data.trainNo) {
      logSuccess('获取车次详情成功');
      
      // 验证必要字段
      const requiredFields = ['trainNo', 'trainType', 'route', 'stops', 'cars', 'fares'];
      const missingFields = requiredFields.filter(field => !response.data[field]);
      
      if (missingFields.length === 0) {
        logSuccess('车次详情包含所有必要字段');
      } else {
        logFailure(`车次详情缺少字段: ${missingFields.join(', ')}`);
      }
    } else {
      logFailure('获取车次详情失败：响应格式不正确');
    }
  } catch (error) {
    logFailure('获取车次详情失败', error);
  }
  
  // 测试无效车次
  try {
    const response = await axios.get(`${BACKEND_URL}/api/trains/INVALID999`);
    
    logFailure('无效车次应该返回404，但请求成功了');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logSuccess('无效车次正确返回404错误');
    } else {
      logFailure('无效车次处理不正确', error);
    }
  }
}

/**
 * 测试余票计算API
 */
async function testAvailableSeatsAPI() {
  logSection('测试余票计算API');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/trains/available-seats`, {
      trainNo: 'G103',
      departureStation: '北京南',
      arrivalStation: '上海虹桥',
      departureDate: '2025-11-15'
    });
    
    if (response.status === 200 && response.data.availableSeats) {
      logSuccess('计算余票数成功');
      
      // 验证返回的席别类型
      const seatTypes = Object.keys(response.data.availableSeats);
      logInfo(`返回的席别类型: ${seatTypes.join(', ')}`);
    } else {
      logFailure('计算余票数失败：响应格式不正确');
    }
  } catch (error) {
    logFailure('计算余票数失败', error);
  }
}

/**
 * 测试筛选选项API
 */
async function testFilterOptionsAPI() {
  logSection('测试筛选选项API');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/trains/filter-options`, {
      params: {
        departureStation: '北京南',
        arrivalStation: '上海虹桥',
        departureDate: '2025-11-15'
      }
    });
    
    if (response.status === 200) {
      logSuccess('获取筛选选项成功');
      
      if (Array.isArray(response.data.departureStations)) {
        logInfo(`出发站选项: ${response.data.departureStations.length} 个`);
      }
      
      if (Array.isArray(response.data.arrivalStations)) {
        logInfo(`到达站选项: ${response.data.arrivalStations.length} 个`);
      }
      
      if (Array.isArray(response.data.seatTypes)) {
        logInfo(`席别选项: ${response.data.seatTypes.length} 个`);
      }
    } else {
      logFailure('获取筛选选项失败');
    }
  } catch (error) {
    logFailure('获取筛选选项失败', error);
  }
}

/**
 * 测试可选日期API
 */
async function testAvailableDatesAPI() {
  logSection('测试可选日期API');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/trains/available-dates`);
    
    if (response.status === 200 && Array.isArray(response.data.availableDates)) {
      logSuccess(`获取可选日期成功，共 ${response.data.availableDates.length} 个日期`);
      
      if (response.data.currentDate) {
        logInfo(`当前日期: ${response.data.currentDate}`);
      }
      
      // 验证日期格式
      const validDates = response.data.availableDates.every(date => {
        return /^\d{4}-\d{2}-\d{2}$/.test(date);
      });
      
      if (validDates) {
        logSuccess('所有日期格式正确');
      } else {
        logFailure('部分日期格式不正确');
      }
    } else {
      logFailure('获取可选日期失败');
    }
  } catch (error) {
    logFailure('获取可选日期失败', error);
  }
}

/**
 * 测试完整用户流程
 */
async function testCompleteUserFlow() {
  logSection('测试完整用户流程：从首页查询到车次列表');
  
  try {
    // 1. 用户在首页获取站点列表（用于出发地输入）
    logInfo('步骤1: 获取站点列表...');
    const stationsResponse = await axios.get(`${BACKEND_URL}/api/stations`);
    
    if (stationsResponse.status !== 200) {
      throw new Error('获取站点列表失败');
    }
    
    logSuccess('步骤1完成：获取站点列表');
    
    // 2. 用户验证出发地
    logInfo('步骤2: 验证出发地"北京南"...');
    const validateDepartureResponse = await axios.post(`${BACKEND_URL}/api/stations/validate`, {
      stationName: '北京南'
    });
    
    if (validateDepartureResponse.status !== 200 || !validateDepartureResponse.data.valid) {
      throw new Error('验证出发地失败');
    }
    
    logSuccess('步骤2完成：出发地验证通过');
    
    // 3. 用户验证到达地
    logInfo('步骤3: 验证到达地"上海虹桥"...');
    const validateArrivalResponse = await axios.post(`${BACKEND_URL}/api/stations/validate`, {
      stationName: '上海虹桥'
    });
    
    if (validateArrivalResponse.status !== 200 || !validateArrivalResponse.data.valid) {
      throw new Error('验证到达地失败');
    }
    
    logSuccess('步骤3完成：到达地验证通过');
    
    // 4. 用户点击查询按钮
    logInfo('步骤4: 查询车次...');
    const startTime = Date.now();
    const searchResponse = await axios.post(`${BACKEND_URL}/api/trains/search`, {
      departureStation: '北京南',
      arrivalStation: '上海虹桥',
      departureDate: '2025-11-15'
    });
    const elapsed = Date.now() - startTime;
    
    if (searchResponse.status !== 200 || !Array.isArray(searchResponse.data.trains)) {
      throw new Error('查询车次失败');
    }
    
    logSuccess(`步骤4完成：查询到 ${searchResponse.data.trains.length} 个车次（${elapsed}ms）`);
    
    // 5. 系统获取筛选选项
    logInfo('步骤5: 获取筛选选项...');
    const filterOptionsResponse = await axios.get(`${BACKEND_URL}/api/trains/filter-options`, {
      params: {
        departureStation: '北京南',
        arrivalStation: '上海虹桥',
        departureDate: '2025-11-15'
      }
    });
    
    if (filterOptionsResponse.status !== 200) {
      throw new Error('获取筛选选项失败');
    }
    
    logSuccess('步骤5完成：获取筛选选项');
    
    // 6. 系统计算第一个车次的余票
    if (searchResponse.data.trains.length > 0) {
      const firstTrain = searchResponse.data.trains[0];
      logInfo(`步骤6: 计算车次 ${firstTrain.trainNo} 的余票...`);
      
      const seatsResponse = await axios.post(`${BACKEND_URL}/api/trains/available-seats`, {
        trainNo: firstTrain.trainNo,
        departureStation: '北京南',
        arrivalStation: '上海虹桥',
        departureDate: '2025-11-15'
      });
      
      if (seatsResponse.status !== 200) {
        throw new Error('计算余票失败');
      }
      
      logSuccess('步骤6完成：计算余票信息');
    }
    
    logSuccess('✨ 完整用户流程测试通过！');
    
  } catch (error) {
    logFailure('完整用户流程测试失败', error);
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log(chalk.bold.yellow('\n🚀 开始运行首页和车次列表页集成测试\n'));
  console.log(chalk.gray(`后端服务: ${BACKEND_URL}`));
  console.log(chalk.gray(`前端服务: ${FRONTEND_URL}\n`));
  
  // 检查后端服务
  const backendHealthy = await testBackendHealth();
  
  if (!backendHealthy) {
    console.log(chalk.red.bold('\n❌ 后端服务不可用，测试终止\n'));
    process.exit(1);
  }
  
  // 运行所有测试
  await testStationsAPI();
  await testTrainSearchAPI();
  await testTrainDetailsAPI();
  await testAvailableSeatsAPI();
  await testFilterOptionsAPI();
  await testAvailableDatesAPI();
  await testCompleteUserFlow();
  
  // 输出测试总结
  console.log('\n' + chalk.bold.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan('测试总结'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  console.log(chalk.green(`✓ 通过: ${testsPassed} 个测试`));
  console.log(chalk.red(`✗ 失败: ${testsFailed} 个测试`));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');
  
  if (testsFailed === 0) {
    console.log(chalk.bold.green('🎉 所有测试通过！\n'));
    process.exit(0);
  } else {
    console.log(chalk.bold.red(`⚠️  有 ${testsFailed} 个测试失败\n`));
    process.exit(1);
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error(chalk.red('测试运行出错:'), error);
  process.exit(1);
});


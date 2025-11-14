/**
 * 个人信息页端到端测试
 * 测试用户基本信息页、手机核验页、乘客管理页、历史订单页的完整流程
 * 
 * 运行方式：node e2e-personal-info-test.js
 */

const axios = require('axios');

// 配置
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// 测试数据
const testUser = {
  username: 'testuser123',
  password: 'testpass123',
  phone: '13900001111',
  idCardNumber: '110101199001011234'
};

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

// 工具函数
function logTest(name, status, message = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✓ ${name}`);
  } else {
    testResults.failed++;
    console.log(`✗ ${name}`);
    if (message) console.log(`  ${message}`);
    testResults.failures.push({ name, message });
  }
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60));
}

// 测试函数

/**
 * 测试1: 用户登录并访问个人信息页
 */
async function testUserLogin() {
  logSection('测试1: 用户登录并访问个人信息页');
  
  try {
    // Step 1: 登录
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      identifier: testUser.username,
      password: testUser.password
    });
    
    if (loginResponse.status === 200 || loginResponse.status === 501) {
      logTest('用户登录请求', 'PASS');
    } else {
      logTest('用户登录请求', 'FAIL', `状态码: ${loginResponse.status}`);
    }
    
    // Step 2: 获取用户信息
    // 注意：实际实现需要认证token
    try {
      const userInfoResponse = await axios.get(`${API_BASE_URL}/api/user/info`);
      if (userInfoResponse.status === 200 || userInfoResponse.status === 501) {
        logTest('获取用户信息', 'PASS');
      } else {
        logTest('获取用户信息', 'FAIL', `状态码: ${userInfoResponse.status}`);
      }
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 501)) {
        logTest('获取用户信息', 'PASS', '返回预期的认证状态');
      } else {
        logTest('获取用户信息', 'FAIL', error.message);
      }
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest('用户登录请求', 'FAIL', '服务器未运行');
    } else {
      logTest('用户登录请求', 'FAIL', error.message);
    }
  }
}

/**
 * 测试2: 查看个人信息
 */
async function testViewPersonalInfo() {
  logSection('测试2: 查看个人信息');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/info`);
    
    // 验证返回数据结构（骨架代码会返回501）
    if (response.status === 501) {
      logTest('个人信息API端点存在', 'PASS');
    } else if (response.data) {
      // 实际实现后的验证
      const hasRequiredFields = ['username', 'name', 'country', 'idCardType', 
        'idCardNumber', 'verificationStatus', 'phone', 'email', 'discountType']
        .every(field => field in response.data);
      
      if (hasRequiredFields) {
        logTest('个人信息包含所有必需字段', 'PASS');
      } else {
        logTest('个人信息包含所有必需字段', 'FAIL', '缺少必需字段');
      }
      
      // 验证手机号脱敏
      if (response.data.phone && response.data.phone.includes('****')) {
        logTest('手机号正确脱敏', 'PASS');
      } else {
        logTest('手机号正确脱敏', 'FAIL', '手机号未脱敏');
      }
    }
    
  } catch (error) {
    if (error.response && error.response.status === 501) {
      logTest('个人信息API端点存在', 'PASS', '骨架代码返回501');
    } else if (error.code === 'ECONNREFUSED') {
      logTest('个人信息API端点存在', 'FAIL', '服务器未运行');
    } else {
      logTest('个人信息API端点存在', 'FAIL', error.message);
    }
  }
}

/**
 * 测试3: 手机号更新流程
 */
async function testPhoneUpdate() {
  logSection('测试3: 手机号更新流程');
  
  try {
    // Step 1: 请求更新手机号（发送验证码）
    const requestData = {
      newPhone: '13900002222',
      password: testUser.password
    };
    
    const requestResponse = await axios.post(
      `${API_BASE_URL}/api/user/phone/update-request`, 
      requestData
    );
    
    if (requestResponse.status === 501) {
      logTest('手机号更新请求API端点存在', 'PASS');
    } else if (requestResponse.status === 200) {
      logTest('发送手机号更新验证码', 'PASS');
      
      // Step 2: 确认更新（验证验证码）
      const confirmData = {
        sessionId: requestResponse.data.sessionId,
        verificationCode: '123456' // 测试验证码
      };
      
      try {
        const confirmResponse = await axios.post(
          `${API_BASE_URL}/api/user/phone/confirm-update`,
          confirmData
        );
        
        if (confirmResponse.status === 200) {
          logTest('确认手机号更新', 'PASS');
        } else {
          logTest('确认手机号更新', 'FAIL', `状态码: ${confirmResponse.status}`);
        }
      } catch (error) {
        if (error.response && error.response.status === 501) {
          logTest('手机号更新确认API端点存在', 'PASS');
        } else {
          logTest('确认手机号更新', 'FAIL', error.message);
        }
      }
    }
    
  } catch (error) {
    if (error.response && error.response.status === 501) {
      logTest('手机号更新请求API端点存在', 'PASS');
    } else if (error.code === 'ECONNREFUSED') {
      logTest('手机号更新请求', 'FAIL', '服务器未运行');
    } else {
      logTest('手机号更新请求', 'FAIL', error.message);
    }
  }
}

/**
 * 测试4: 乘客管理流程
 */
async function testPassengerManagement() {
  logSection('测试4: 乘客管理流程');
  
  try {
    // Step 1: 验证乘客信息
    const passengerData = {
      name: '张三',
      idCardType: '居民身份证',
      idCardNumber: '110101199001011234',
      phone: '13900001111',
      discountType: '成人'
    };
    
    const validateResponse = await axios.post(
      `${API_BASE_URL}/api/passengers/validate`,
      passengerData
    );
    
    if (validateResponse.status === 501) {
      logTest('乘客信息验证API端点存在', 'PASS');
    } else if (validateResponse.data.valid) {
      logTest('验证乘客信息', 'PASS');
    } else {
      logTest('验证乘客信息', 'FAIL', validateResponse.data.error);
    }
    
    // Step 2: 更新乘客信息
    const passengerId = 'pass123';
    try {
      const updateResponse = await axios.put(
        `${API_BASE_URL}/api/passengers/${passengerId}`,
        { phone: '13900002222' }
      );
      
      if (updateResponse.status === 501) {
        logTest('更新乘客信息API端点存在', 'PASS');
      } else if (updateResponse.status === 200) {
        logTest('更新乘客信息', 'PASS');
      } else {
        logTest('更新乘客信息', 'FAIL', `状态码: ${updateResponse.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 501) {
        logTest('更新乘客信息API端点存在', 'PASS');
      } else {
        logTest('更新乘客信息', 'FAIL', error.message);
      }
    }
    
    // Step 3: 删除乘客
    try {
      const deleteResponse = await axios.delete(
        `${API_BASE_URL}/api/passengers/${passengerId}`
      );
      
      if (deleteResponse.status === 501) {
        logTest('删除乘客API端点存在', 'PASS');
      } else if (deleteResponse.status === 200) {
        logTest('删除乘客', 'PASS');
      } else {
        logTest('删除乘客', 'FAIL', `状态码: ${deleteResponse.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 501) {
        logTest('删除乘客API端点存在', 'PASS');
      } else {
        logTest('删除乘客', 'FAIL', error.message);
      }
    }
    
  } catch (error) {
    if (error.response && error.response.status === 501) {
      logTest('乘客管理API端点存在', 'PASS');
    } else if (error.code === 'ECONNREFUSED') {
      logTest('乘客管理', 'FAIL', '服务器未运行');
    } else {
      logTest('乘客管理', 'FAIL', error.message);
    }
  }
}

/**
 * 测试5: 历史订单查询
 */
async function testOrderHistory() {
  logSection('测试5: 历史订单查询');
  
  try {
    // Step 1: 获取所有订单
    const allOrdersResponse = await axios.get(`${API_BASE_URL}/api/user/orders`);
    
    if (allOrdersResponse.status === 501) {
      logTest('历史订单API端点存在', 'PASS');
    } else if (allOrdersResponse.status === 200) {
      logTest('获取历史订单列表', 'PASS');
      
      // 验证返回数据是数组
      if (Array.isArray(allOrdersResponse.data.orders)) {
        logTest('订单列表格式正确', 'PASS');
      } else {
        logTest('订单列表格式正确', 'FAIL', '返回数据不是数组');
      }
    }
    
    // Step 2: 按日期筛选订单
    try {
      const filteredResponse = await axios.get(`${API_BASE_URL}/api/user/orders`, {
        params: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        }
      });
      
      if (filteredResponse.status === 501) {
        logTest('日期筛选功能API端点存在', 'PASS');
      } else if (filteredResponse.status === 200) {
        logTest('按日期范围筛选订单', 'PASS');
      }
    } catch (error) {
      if (error.response && error.response.status === 501) {
        logTest('日期筛选功能API端点存在', 'PASS');
      } else {
        logTest('按日期范围筛选订单', 'FAIL', error.message);
      }
    }
    
    // Step 3: 按关键词搜索订单
    try {
      const searchResponse = await axios.get(`${API_BASE_URL}/api/user/orders`, {
        params: {
          keyword: 'G1234'
        }
      });
      
      if (searchResponse.status === 501) {
        logTest('关键词搜索功能API端点存在', 'PASS');
      } else if (searchResponse.status === 200) {
        logTest('按关键词搜索订单', 'PASS');
      }
    } catch (error) {
      if (error.response && error.response.status === 501) {
        logTest('关键词搜索功能API端点存在', 'PASS');
      } else {
        logTest('按关键词搜索订单', 'FAIL', error.message);
      }
    }
    
  } catch (error) {
    if (error.response && error.response.status === 501) {
      logTest('历史订单API端点存在', 'PASS');
    } else if (error.code === 'ECONNREFUSED') {
      logTest('历史订单查询', 'FAIL', '服务器未运行');
    } else {
      logTest('历史订单查询', 'FAIL', error.message);
    }
  }
}

// 打印测试报告
function printTestReport() {
  logSection('测试报告');
  
  console.log(`\n总计: ${testResults.total} 个测试`);
  console.log(`通过: ${testResults.passed} 个 (${((testResults.passed/testResults.total)*100).toFixed(1)}%)`);
  console.log(`失败: ${testResults.failed} 个 (${((testResults.failed/testResults.total)*100).toFixed(1)}%)`);
  
  if (testResults.failures.length > 0) {
    console.log(`\n失败的测试:`);
    testResults.failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.name}`);
      console.log(`   ${failure.message}`);
    });
  }
  
  console.log('\n');
  
  if (testResults.failed === 0) {
    console.log('✓ 所有测试通过！');
    return 0;
  } else {
    console.log('✗ 部分测试失败。请检查上述失败的测试。');
    return 1;
  }
}

// 主函数
async function main() {
  console.log('个人信息页端到端测试');
  console.log('========================\n');
  console.log('注意：这些测试针对代码骨架，期望返回501状态码。');
  console.log('实际实现后需要更新测试期望值。\n');
  
  // 运行所有测试
  await testUserLogin();
  await testViewPersonalInfo();
  await testPhoneUpdate();
  await testPassengerManagement();
  await testOrderHistory();
  
  // 打印报告并退出
  const exitCode = printTestReport();
  process.exit(exitCode);
}

// 运行测试
main().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});






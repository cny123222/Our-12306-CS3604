// 个人信息页集成测试
// 测试完整的业务流程和API调用链

const http = require('http');
const https = require('https');

// 配置
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 辅助函数：发送HTTP请求
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// 测试函数
async function runTest(testName, testFn) {
  testResults.total++;
  try {
    console.log(`\n🧪 测试: ${testName}`);
    await testFn();
    testResults.passed++;
    console.log(`✅ 通过`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ testName, error: error.message });
    console.log(`❌ 失败: ${error.message}`);
  }
}

// ===== 系统健康检查 =====
async function testSystemHealth() {
  await runTest('后端服务健康检查', async () => {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    if (response.statusCode !== 200) {
      throw new Error(`后端服务返回状态码: ${response.statusCode}`);
    }
  });

  await runTest('前端服务可访问性检查', async () => {
    const response = await makeRequest(FRONTEND_URL);
    if (response.statusCode !== 200) {
      throw new Error(`前端服务返回状态码: ${response.statusCode}`);
    }
  });
}

// ===== API端点测试 =====
async function testAPIEndpoints() {
  // 测试用的JWT token（需要先登录获取）
  let authToken = '';

  await runTest('用户登录获取Token', async () => {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'testuser',
        password: 'password123'
      })
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      authToken = data.token || '';
    }
    // TODO: 功能实现后，验证token存在
  });

  await runTest('API-GET-UserInfo: 获取用户信息', async () => {
    const response = await makeRequest(`${BACKEND_URL}/api/user/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // TODO: 功能实现后，验证响应
    // if (response.statusCode !== 200) {
    //   throw new Error(`获取用户信息失败: ${response.statusCode}`);
    // }
    // 
    // const data = JSON.parse(response.body);
    // if (!data.username || !data.name || !data.phone) {
    //   throw new Error('返回的用户信息不完整');
    // }
    // 
    // // 验证手机号脱敏
    // if (!/^\(\+86\)\d{3}\*{4}\d{4}$/.test(data.phone)) {
    //   throw new Error('手机号脱敏格式不正确');
    // }
  });

  await runTest('API-PUT-UserEmail: 更新用户邮箱', async () => {
    const response = await makeRequest(`${BACKEND_URL}/api/user/email`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'newemail@example.com'
      })
    });
    
    // TODO: 功能实现后，验证响应
    // if (response.statusCode !== 200) {
    //   throw new Error(`更新邮箱失败: ${response.statusCode}`);
    // }
  });

  await runTest('API-POST-UpdatePhoneRequest: 请求更新手机号', async () => {
    const response = await makeRequest(`${BACKEND_URL}/api/user/phone/update-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPhone: '13900001111',
        password: 'password123'
      })
    });
    
    // TODO: 功能实现后，验证响应
    // if (response.statusCode !== 200) {
    //   throw new Error(`请求更新手机号失败: ${response.statusCode}`);
    // }
    // 
    // const data = JSON.parse(response.body);
    // if (!data.sessionId) {
    //   throw new Error('未返回sessionId');
    // }
  });

  await runTest('API-GET-UserOrders: 获取用户订单列表', async () => {
    const response = await makeRequest(`${BACKEND_URL}/api/user/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // TODO: 功能实现后，验证响应
    // if (response.statusCode !== 200) {
    //   throw new Error(`获取订单列表失败: ${response.statusCode}`);
    // }
    // 
    // const data = JSON.parse(response.body);
    // if (!Array.isArray(data.orders)) {
    //   throw new Error('返回的订单列表格式不正确');
    // }
  });

  await runTest('API-POST-ValidatePassenger: 验证乘客信息', async () => {
    const response = await makeRequest(`${BACKEND_URL}/api/passengers/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '张三',
        idCardType: '居民身份证',
        idCardNumber: '310101199001011234',
        phone: '13800138000',
        discountType: '成人'
      })
    });
    
    // TODO: 功能实现后，验证响应
    // if (response.statusCode !== 200 && response.statusCode !== 400) {
    //   throw new Error(`验证乘客信息失败: ${response.statusCode}`);
    // }
  });
}

// ===== 完整业务流程测试 =====
async function testBusinessFlows() {
  await runTest('完整流程: 用户登录 -> 查看个人信息 -> 更新邮箱', async () => {
    // Step 1: 登录
    const loginResponse = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'testuser',
        password: 'password123'
      })
    });
    
    // TODO: 功能实现后，验证完整流程
    // Step 2: 获取用户信息
    // Step 3: 更新邮箱
  });

  await runTest('完整流程: 乘客管理（添加、编辑、删除）', async () => {
    // TODO: 功能实现后，测试完整的乘客管理流程
    // Step 1: 获取乘客列表
    // Step 2: 添加新乘客
    // Step 3: 验证乘客已添加
    // Step 4: 编辑乘客信息
    // Step 5: 验证乘客信息已更新
    // Step 6: 删除乘客
    // Step 7: 验证乘客已删除
  });

  await runTest('完整流程: 查询历史订单（按日期范围）', async () => {
    // TODO: 功能实现后，测试订单查询流程
    // Step 1: 查询所有订单
    // Step 2: 按日期范围筛选
    // Step 3: 按关键词搜索
    // Step 4: 验证返回结果正确
  });

  await runTest('完整流程: 手机号修改（含验证码）', async () => {
    // TODO: 功能实现后，测试手机号修改流程
    // Step 1: 请求更新手机号（发送验证码）
    // Step 2: 获取sessionId
    // Step 3: 确认更新（验证验证码）
    // Step 4: 验证手机号已更新
  });
}

// ===== 主测试入口 =====
async function main() {
  console.log('========================================');
  console.log('个人信息页集成测试');
  console.log('========================================');
  console.log(`后端URL: ${BACKEND_URL}`);
  console.log(`前端URL: ${FRONTEND_URL}`);
  console.log('========================================\n');

  try {
    // 运行测试
    await testSystemHealth();
    await testAPIEndpoints();
    await testBusinessFlows();

    // 打印测试结果
    console.log('\n========================================');
    console.log('测试结果汇总');
    console.log('========================================');
    console.log(`总测试数: ${testResults.total}`);
    console.log(`✅ 通过: ${testResults.passed}`);
    console.log(`❌ 失败: ${testResults.failed}`);
    console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

    if (testResults.errors.length > 0) {
      console.log('\n失败的测试:');
      testResults.errors.forEach(({ testName, error }, index) => {
        console.log(`${index + 1}. ${testName}`);
        console.log(`   错误: ${error}`);
      });
    }

    console.log('\n========================================');
    
    // 退出代码
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ 集成测试执行失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
main();


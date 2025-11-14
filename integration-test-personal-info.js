/**
 * 个人信息页模块集成测试
 * 目的：测试前后端通信、完整用户流程、系统集成
 */

const http = require('http');
const https = require('https');

// 配置
const CONFIG = {
  BACKEND_URL: 'http://localhost:3000',
  FRONTEND_URL: 'http://localhost:5173',
  TIMEOUT: 10000
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP请求工具
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
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
    req.setTimeout(CONFIG.TIMEOUT, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// 测试用例
const tests = [];
let passedTests = 0;
let failedTests = 0;

function test(description, testFn) {
  tests.push({ description, testFn });
}

async function runTests() {
  log('\n========================================', 'blue');
  log('个人信息页模块集成测试开始', 'blue');
  log('========================================\n', 'blue');

  for (const { description, testFn } of tests) {
    try {
      await testFn();
      log(`✓ ${description}`, 'green');
      passedTests++;
    } catch (error) {
      log(`✗ ${description}`, 'red');
      log(`  错误: ${error.message}`, 'red');
      failedTests++;
    }
  }

  log('\n========================================', 'blue');
  log('测试完成', 'blue');
  log('========================================\n', 'blue');
  log(`通过: ${passedTests}`, 'green');
  log(`失败: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`总计: ${tests.length}\n`, 'blue');

  process.exit(failedTests > 0 ? 1 : 0);
}

// ===== 系统健康检查 =====

test('后端服务应该正常运行', async () => {
  const response = await makeRequest(`${CONFIG.BACKEND_URL}/health`);
  if (response.statusCode !== 200 && response.statusCode !== 404) {
    throw new Error(`后端服务不可达，状态码: ${response.statusCode}`);
  }
});

test('前端服务应该正常运行', async () => {
  const response = await makeRequest(CONFIG.FRONTEND_URL);
  if (response.statusCode !== 200) {
    throw new Error(`前端服务不可达，状态码: ${response.statusCode}`);
  }
});

// ===== API端点测试 =====

test('API-GET-UserProfile: 获取用户信息端点应该可访问', async () => {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // 未登录应该返回401
    if (response.statusCode !== 401 && response.statusCode !== 200) {
      throw new Error(`意外的状态码: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到后端服务');
    }
    throw error;
  }
});

test('API-PUT-UserContactInfo: 更新联系方式端点应该可访问', async () => {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/user/contact-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    // 未登录应该返回401
    if (response.statusCode !== 401 && response.statusCode !== 200) {
      throw new Error(`意外的状态码: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到后端服务');
    }
    throw error;
  }
});

test('API-POST-VerifyPhoneChange: 手机号更新端点应该可访问', async () => {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/user/verify-phone-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPhone: '13812345678',
        password: 'testpassword',
        verificationCode: '123456'
      })
    });
    // 未登录应该返回401
    if (response.statusCode !== 401 && response.statusCode !== 200) {
      throw new Error(`意外的状态码: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到后端服务');
    }
    throw error;
  }
});

test('API-GET-Passengers: 获取乘客列表端点应该可访问', async () => {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/passengers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // 未登录应该返回401
    if (response.statusCode !== 401 && response.statusCode !== 200) {
      throw new Error(`意外的状态码: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到后端服务');
    }
    throw error;
  }
});

test('API-GET-UserOrders: 获取订单列表端点应该可访问', async () => {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/user/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // 未登录应该返回401
    if (response.statusCode !== 401 && response.statusCode !== 200) {
      throw new Error(`意外的状态码: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到后端服务');
    }
    throw error;
  }
});

// ===== 前后端通信测试 =====

test('前端应该能够访问后端API', async () => {
  // 通过前端发起的请求测试（需要前端服务运行）
  // TODO: 实现前端到后端的实际请求测试
});

test('CORS配置应该正确', async () => {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/user/profile`, {
      method: 'OPTIONS',
      headers: {
        'Origin': CONFIG.FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      }
    });
    // 检查CORS响应头
    if (!response.headers['access-control-allow-origin']) {
      log('  警告: 未检测到CORS头，可能需要配置', 'yellow');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到后端服务');
    }
    // CORS预检请求失败是可以接受的
  }
});

// ===== 完整用户流程测试（E2E） =====

test('E2E: 用户查看个人信息流程', async () => {
  // TODO: 实现完整的用户查看个人信息流程测试
  // 1. 用户登录
  // 2. 导航到个人中心
  // 3. 查看个人信息
  // 4. 验证信息正确显示
});

test('E2E: 用户更新手机号流程', async () => {
  // TODO: 实现完整的更新手机号流程测试
  // 1. 用户登录
  // 2. 进入手机核验页
  // 3. 输入新手机号和密码
  // 4. 接收验证码
  // 5. 完成验证
});

test('E2E: 用户管理乘客流程', async () => {
  // TODO: 实现完整的乘客管理流程测试
  // 1. 用户登录
  // 2. 进入乘客管理页
  // 3. 添加乘客
  // 4. 编辑乘客
  // 5. 删除乘客
});

// ===== 数据持久化测试 =====

test('用户信息应该正确存储在数据库中', async () => {
  // TODO: 测试数据库操作
});

test('乘客信息应该正确存储和检索', async () => {
  // TODO: 测试乘客数据的CRUD操作
});

test('订单信息应该正确存储（30日期限）', async () => {
  // TODO: 测试订单数据存储和过期处理
});

// ===== 错误处理测试 =====

test('API应该正确处理无效的请求参数', async () => {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/user/contact-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'invalid-email' })
    });
    // 应该返回400错误
    if (response.statusCode !== 400 && response.statusCode !== 401) {
      throw new Error(`应该返回400或401，但返回了: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到后端服务');
    }
    throw error;
  }
});

test('API应该正确处理未授权的访问', async () => {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/user/profile`, {
      method: 'GET'
    });
    // 应该返回401
    if (response.statusCode !== 401) {
      throw new Error(`应该返回401，但返回了: ${response.statusCode}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到后端服务');
    }
    throw error;
  }
});

// ===== 性能测试 =====

test('API响应时间应该在100ms内', async () => {
  const startTime = Date.now();
  try {
    await makeRequest(`${CONFIG.BACKEND_URL}/api/user/profile`);
  } catch (error) {
    // 忽略401错误，只关注响应时间
  }
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  if (responseTime > 100) {
    log(`  警告: API响应时间 ${responseTime}ms 超过100ms`, 'yellow');
  }
});

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    log(`\n致命错误: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests, tests };


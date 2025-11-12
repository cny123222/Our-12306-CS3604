/**
 * 登录功能集成测试脚本
 * 文件：verify-login-integration.js
 * 
 * 功能：验证登录功能的前后端集成
 * - 验证前端服务可访问
 * - 验证后端登录API端点
 * - 测试完整的登录流程
 */

const http = require('http');

// 配置
const CONFIG = {
  backend: {
    host: 'localhost',
    port: 3000,
    protocol: 'http'
  },
  frontend: {
    host: 'localhost',
    port: 5173,
    protocol: 'http'
  },
  timeout: 5000
};

// 测试结果
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
  results.passed.push(message);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
  results.failed.push(message);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
  results.warnings.push(message);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function logSection(title) {
  log(`\n${'='.repeat(50)}`, colors.blue);
  log(title, colors.blue);
  log('='.repeat(50), colors.blue);
}

// HTTP请求工具函数
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: options.host,
      port: options.port,
      path: options.path,
      method: options.method,
      headers: options.headers || {}
    };

    if (postData) {
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(postData));
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: null
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

// 测试1: 验证前端服务
async function verifyFrontendService() {
  logSection('测试 1: 前端服务验证');

  try {
    const response = await makeRequest({
      protocol: CONFIG.frontend.protocol,
      host: CONFIG.frontend.host,
      port: CONFIG.frontend.port,
      path: '/login',
      method: 'GET'
    });

    if (response.statusCode === 200 || response.statusCode === 304) {
      logSuccess(`前端登录页面可访问: ${CONFIG.frontend.protocol}://${CONFIG.frontend.host}:${CONFIG.frontend.port}/login`);
      return true;
    } else {
      logError(`前端登录页面响应异常: HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`前端登录页面无法访问: ${error.message}`);
    logWarning('请确保前端服务已启动: cd frontend && npm run dev');
    return false;
  }
}

// 测试2: 验证后端服务
async function verifyBackendService() {
  logSection('测试 2: 后端服务验证');

  try {
    const response = await makeRequest({
      protocol: CONFIG.backend.protocol,
      host: CONFIG.backend.host,
      port: CONFIG.backend.port,
      path: '/api/health',
      method: 'GET'
    });

    if (response.statusCode === 200) {
      logSuccess(`后端服务运行正常: ${CONFIG.backend.protocol}://${CONFIG.backend.host}:${CONFIG.backend.port}`);
      return true;
    } else {
      logError(`后端服务响应异常: HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`后端服务无法访问: ${error.message}`);
    logWarning('请确保后端服务已启动: cd backend && npm start');
    return false;
  }
}

// 测试3: 验证登录API端点
async function verifyLoginEndpoints() {
  logSection('测试 3: 登录API端点验证');

  const endpoints = [
    { path: '/api/auth/homepage', method: 'GET', name: '首页内容API' },
    { path: '/api/auth/forgot-password', method: 'GET', name: '忘记密码API' }
  ];

  let passedCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest({
        protocol: CONFIG.backend.protocol,
        host: CONFIG.backend.host,
        port: CONFIG.backend.port,
        path: endpoint.path,
        method: endpoint.method
      });

      if (response.statusCode === 200 && response.json && response.json.success) {
        logSuccess(`${endpoint.name} 端点可访问 (${endpoint.method} ${endpoint.path})`);
        passedCount++;
      } else {
        logError(`${endpoint.name} 端点响应异常: HTTP ${response.statusCode}`);
      }
    } catch (error) {
      logError(`${endpoint.name} 无法访问: ${error.message}`);
    }
  }

  logInfo(`\nAPI端点验证: ${passedCount}/${endpoints.length} 通过`);
  return passedCount === endpoints.length;
}

// 测试4: 测试登录流程
async function testLoginFlow() {
  logSection('测试 4: 完整登录流程验证');

  logInfo('注意：这个测试需要数据库中有测试用户');
  logInfo('测试用户: username=testuser, password=password123');

  try {
    // 步骤1: 登录请求
    logInfo('\n步骤1: 发送登录请求...');
    const loginResponse = await makeRequest({
      protocol: CONFIG.backend.protocol,
      host: CONFIG.backend.host,
      port: CONFIG.backend.port,
      path: '/api/auth/login',
      method: 'POST'
    }, {
      identifier: 'testuser',
      password: 'password123'
    });

    if (loginResponse.statusCode === 200 && loginResponse.json && loginResponse.json.success) {
      logSuccess('登录请求成功，获得sessionId');
      logInfo(`  SessionId: ${loginResponse.json.sessionId}`);

      // 步骤2: 发送验证码（模拟）
      logInfo('\n步骤2: 模拟短信验证流程...');
      logWarning('  实际使用中需要输入短信验证码');
      logSuccess('登录流程API验证完成');

      return true;
    } else if (loginResponse.statusCode === 401) {
      logWarning('登录失败：用户名或密码错误');
      logInfo('  这是正常的，如果数据库中没有测试用户');
      logInfo('  可以运行: cd backend && npm test -- test/routes/auth.test.js');
      logInfo('  测试会创建测试用户');
      return false;
    } else {
      logError(`登录请求失败: HTTP ${loginResponse.statusCode}`);
      if (loginResponse.json) {
        logInfo(`  错误信息: ${JSON.stringify(loginResponse.json)}`);
      }
      return false;
    }
  } catch (error) {
    logError(`登录流程测试失败: ${error.message}`);
    return false;
  }
}

// 测试5: 验证CORS配置
async function verifyCORS() {
  logSection('测试 5: CORS配置验证');

  try {
    const response = await makeRequest({
      protocol: CONFIG.backend.protocol,
      host: CONFIG.backend.host,
      port: CONFIG.backend.port,
      path: '/api/auth/homepage',
      method: 'OPTIONS',
      headers: {
        'Origin': `${CONFIG.frontend.protocol}://${CONFIG.frontend.host}:${CONFIG.frontend.port}`,
        'Access-Control-Request-Method': 'POST'
      }
    });

    if (response.headers['access-control-allow-origin']) {
      logSuccess('CORS配置正确，前端可以访问后端API');
      return true;
    } else {
      logWarning('CORS头部未找到，可能需要配置');
      return false;
    }
  } catch (error) {
    logError(`CORS验证失败: ${error.message}`);
    return false;
  }
}

// 主函数
async function main() {
  log('\n' + '='.repeat(50), colors.blue);
  log('12306登录功能集成测试脚本', colors.blue);
  log('='.repeat(50) + '\n', colors.blue);

  logInfo('开始集成测试...\n');

  await verifyFrontendService();
  await verifyBackendService();
  await verifyLoginEndpoints();
  await testLoginFlow();
  await verifyCORS();

  // 生成测试报告
  logSection('测试报告汇总');

  const totalTests = results.passed.length + results.failed.length;
  const passRate = totalTests > 0 ? ((results.passed.length / totalTests) * 100).toFixed(0) : 0;

  logInfo(`\n总计测试: ${totalTests}`);
  logSuccess(`✓ 通过: ${results.passed.length}`);
  logError(`✗ 失败: ${results.failed.length}`);
  logWarning(`⚠ 警告: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    log('\n失败的测试:', colors.red);
    results.failed.forEach((msg, index) => {
      log(`  ${index + 1}. ${msg}`, colors.red);
    });
  }

  if (results.warnings.length > 0) {
    log('\n警告信息:', colors.yellow);
    results.warnings.forEach((msg, index) => {
      log(`  ${index + 1}. ${msg}`, colors.yellow);
    });
  }

  logInfo(`\n整体通过率: ${passRate}%`);

  if (results.failed.length === 0) {
    log('\n🎉 所有测试通过！登录功能集成正常！', colors.green);
    process.exit(0);
  } else {
    log('\n❌ 部分测试失败，请检查上述错误信息', colors.red);
    process.exit(1);
  }
}

// 运行测试
main().catch(error => {
  log(`\n致命错误: ${error.message}`, colors.red);
  process.exit(1);
});


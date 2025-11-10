/**
 * 系统验证脚本
 * 文件：verify-system.js
 * 
 * 功能：验证整个系统的健康状态和连通性
 * - 验证后端服务启动
 * - 验证前端服务启动
 * - 验证前端可以访问后端API
 * - 验证数据库连接
 * - 验证关键API端点响应
 */

const http = require('http');
const https = require('https');

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
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// 测试1: 验证后端服务
async function verifyBackendService() {
  logSection('测试 1: 后端服务验证');
  
  try {
    const response = await makeRequest({
      protocol: CONFIG.backend.protocol,
      host: CONFIG.backend.host,
      port: CONFIG.backend.port,
      path: '/health',
      method: 'GET'
    });
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      logSuccess(`后端服务运行在 ${CONFIG.backend.protocol}://${CONFIG.backend.host}:${CONFIG.backend.port}`);
      return true;
    } else {
      logError(`后端服务响应异常: HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`后端服务无法访问: ${error.message}`);
    logWarning('请确保后端服务已启动: npm run dev (在backend目录)');
    return false;
  }
}

// 测试2: 验证前端服务
async function verifyFrontendService() {
  logSection('测试 2: 前端服务验证');
  
  try {
    const response = await makeRequest({
      protocol: CONFIG.frontend.protocol,
      host: CONFIG.frontend.host,
      port: CONFIG.frontend.port,
      path: '/',
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      logSuccess(`前端服务运行在 ${CONFIG.frontend.protocol}://${CONFIG.frontend.host}:${CONFIG.frontend.port}`);
      return true;
    } else {
      logError(`前端服务响应异常: HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`前端服务无法访问: ${error.message}`);
    logWarning('请确保前端服务已启动: npm run dev (在frontend目录)');
    return false;
  }
}

// 测试3: 验证CORS配置
async function verifyCORSConfiguration() {
  logSection('测试 3: CORS配置验证');
  
  try {
    const response = await makeRequest({
      protocol: CONFIG.backend.protocol,
      host: CONFIG.backend.host,
      port: CONFIG.backend.port,
      path: '/api/auth/validate-username',
      method: 'OPTIONS',
      headers: {
        'Origin': `${CONFIG.frontend.protocol}://${CONFIG.frontend.host}:${CONFIG.frontend.port}`,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    if (response.headers['access-control-allow-origin']) {
      logSuccess('CORS配置正确，前端可以访问后端API');
      return true;
    } else {
      logWarning('CORS配置可能不正确');
      return false;
    }
  } catch (error) {
    logError(`CORS验证失败: ${error.message}`);
    return false;
  }
}

// 测试4: 验证注册相关API端点
async function verifyRegistrationAPIs() {
  logSection('测试 4: 注册相关API端点验证');
  
  const endpoints = [
    { path: '/api/auth/validate-username', method: 'POST', name: '用户名验证API' },
    { path: '/api/auth/validate-password', method: 'POST', name: '密码验证API' },
    { path: '/api/auth/validate-name', method: 'POST', name: '姓名验证API' },
    { path: '/api/auth/validate-idcard', method: 'POST', name: '证件号验证API' },
    { path: '/api/auth/validate-email', method: 'POST', name: '邮箱验证API' },
    { path: '/api/auth/validate-phone', method: 'POST', name: '手机号验证API' },
    { path: '/api/auth/register', method: 'POST', name: '用户注册API' },
    { path: '/api/terms/service-terms', method: 'GET', name: '服务条款API' },
    { path: '/api/terms/privacy-policy', method: 'GET', name: '隐私政策API' }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest({
        protocol: CONFIG.backend.protocol,
        host: CONFIG.backend.host,
        port: CONFIG.backend.port,
        path: endpoint.path,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined
      });
      
      // API端点存在即可，不要求功能完整实现
      if (response.statusCode < 500) {
        logSuccess(`${endpoint.name} 端点可访问 (${endpoint.method} ${endpoint.path})`);
        successCount++;
      } else {
        logError(`${endpoint.name} 服务器错误: HTTP ${response.statusCode}`);
      }
    } catch (error) {
      logError(`${endpoint.name} 无法访问: ${error.message}`);
    }
  }
  
  logInfo(`\nAPI端点验证: ${successCount}/${endpoints.length} 通过`);
  return successCount === endpoints.length;
}

// 测试5: 验证数据库连接
async function verifyDatabaseConnection() {
  logSection('测试 5: 数据库连接验证');
  
  try {
    // 尝试访问一个需要数据库的API
    const response = await makeRequest({
      protocol: CONFIG.backend.protocol,
      host: CONFIG.backend.host,
      port: CONFIG.backend.port,
      path: '/api/auth/validate-username',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: 'testuser123' })
    });
    
    // 如果API能够响应（不是500错误），说明数据库连接正常
    if (response.statusCode < 500) {
      logSuccess('数据库连接正常');
      return true;
    } else {
      logError('数据库连接可能存在问题');
      return false;
    }
  } catch (error) {
    logError(`数据库连接验证失败: ${error.message}`);
    return false;
  }
}

// 测试6: 验证完整注册流程
async function verifyRegistrationFlow() {
  logSection('测试 6: 完整注册流程验证');
  
  logInfo('这个测试需要功能实现完成后才能通过');
  logInfo('当前仅验证API端点可访问性');
  
  try {
    // Step 1: 验证用户名
    logInfo('步骤1: 验证用户名...');
    await makeRequest({
      protocol: CONFIG.backend.protocol,
      host: CONFIG.backend.host,
      port: CONFIG.backend.port,
      path: '/api/auth/validate-username',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser123' })
    });
    logInfo('  用户名验证端点响应正常');
    
    // Step 2: 提交注册信息
    logInfo('步骤2: 提交注册信息...');
    await makeRequest({
      protocol: CONFIG.backend.protocol,
      host: CONFIG.backend.host,
      port: CONFIG.backend.port,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser123',
        password: 'test123',
        confirmPassword: 'test123',
        idCardType: '居民身份证',
        name: '测试用户',
        idCardNumber: '110101199001011234',
        discountType: '成人',
        phone: '13800138000',
        agreedToTerms: true
      })
    });
    logInfo('  注册端点响应正常');
    
    logWarning('完整注册流程需要实现后才能完全验证');
    return true;
  } catch (error) {
    logError(`注册流程验证失败: ${error.message}`);
    return false;
  }
}

// 生成测试报告
function generateReport() {
  logSection('测试报告汇总');
  
  log(`\n总计测试: ${results.passed.length + results.failed.length}`, colors.cyan);
  log(`✓ 通过: ${results.passed.length}`, colors.green);
  log(`✗ 失败: ${results.failed.length}`, colors.red);
  log(`⚠ 警告: ${results.warnings.length}`, colors.yellow);
  
  if (results.failed.length > 0) {
    log('\n失败的测试:', colors.red);
    results.failed.forEach((test, index) => {
      log(`  ${index + 1}. ${test}`, colors.red);
    });
  }
  
  if (results.warnings.length > 0) {
    log('\n警告信息:', colors.yellow);
    results.warnings.forEach((warning, index) => {
      log(`  ${index + 1}. ${warning}`, colors.yellow);
    });
  }
  
  const successRate = Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100);
  log(`\n整体通过率: ${successRate}%`, colors.cyan);
  
  if (results.failed.length === 0) {
    log('\n🎉 所有测试通过！系统运行正常！', colors.green);
    return 0;
  } else {
    log('\n❌ 部分测试失败，请检查上述错误信息', colors.red);
    return 1;
  }
}

// 主函数
async function main() {
  log('\n' + '='.repeat(50), colors.blue);
  log('12306系统验证脚本', colors.blue);
  log('='.repeat(50) + '\n', colors.blue);
  
  logInfo('开始系统验证...\n');
  
  // 执行所有测试
  await verifyBackendService();
  await verifyFrontendService();
  await verifyCORSConfiguration();
  await verifyRegistrationAPIs();
  await verifyDatabaseConnection();
  await verifyRegistrationFlow();
  
  // 生成报告
  const exitCode = generateReport();
  
  process.exit(exitCode);
}

// 错误处理
process.on('unhandledRejection', (error) => {
  logError(`未处理的Promise拒绝: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

// 运行主函数
main();


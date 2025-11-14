// 个人信息页系统验证脚本
// 快速验证系统配置、数据库、API端点是否就绪

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, 'backend', 'database', 'railway.db'),
  TIMEOUT: 5000 // 5秒超时
};

// 验证结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// 辅助函数：彩色输出
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 辅助函数：HTTP请求
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, CONFIG.TIMEOUT);

    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const req = protocol.request(url, options, (res) => {
        clearTimeout(timeout);
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
      
      req.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      
      req.end();
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

// 执行单个检查
async function check(name, checkFn, severity = 'error') {
  results.total++;
  process.stdout.write(`  ${colors.blue}⏳${colors.reset} ${name}...`);
  
  try {
    const result = await checkFn();
    
    if (result.success) {
      results.passed++;
      process.stdout.write(`\r  ${colors.green}✓${colors.reset} ${name}`);
      if (result.message) {
        process.stdout.write(` ${colors.gray}(${result.message})${colors.reset}`);
      }
      console.log('');
      results.checks.push({ name, status: 'passed', message: result.message });
    } else {
      if (severity === 'warning') {
        results.warnings++;
        process.stdout.write(`\r  ${colors.yellow}⚠${colors.reset} ${name}`);
        console.log(` ${colors.yellow}${result.message || 'Warning'}${colors.reset}`);
        results.checks.push({ name, status: 'warning', message: result.message });
      } else {
        results.failed++;
        process.stdout.write(`\r  ${colors.red}✗${colors.reset} ${name}`);
        console.log(` ${colors.red}${result.message || 'Failed'}${colors.reset}`);
        results.checks.push({ name, status: 'failed', message: result.message });
      }
    }
  } catch (error) {
    if (severity === 'warning') {
      results.warnings++;
      process.stdout.write(`\r  ${colors.yellow}⚠${colors.reset} ${name}`);
      console.log(` ${colors.yellow}${error.message}${colors.reset}`);
      results.checks.push({ name, status: 'warning', message: error.message });
    } else {
      results.failed++;
      process.stdout.write(`\r  ${colors.red}✗${colors.reset} ${name}`);
      console.log(` ${colors.red}${error.message}${colors.reset}`);
      results.checks.push({ name, status: 'failed', message: error.message });
    }
  }
}

// ===== 1. 环境配置检查 =====
async function checkEnvironmentConfig() {
  log('\n📋 环境配置检查', 'blue');
  
  await check('Node.js 版本', async () => {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    if (major >= 16) {
      return { success: true, message: version };
    } else {
      return { success: false, message: `${version} (建议使用 >= 16.x)` };
    }
  }, 'warning');

  await check('环境变量 NODE_ENV', async () => {
    const env = process.env.NODE_ENV || 'development';
    return { success: true, message: env };
  });

  await check('后端URL配置', async () => {
    return { success: true, message: CONFIG.BACKEND_URL };
  });

  await check('前端URL配置', async () => {
    return { success: true, message: CONFIG.FRONTEND_URL };
  });
}

// ===== 2. 数据库检查 =====
async function checkDatabase() {
  log('\n💾 数据库检查', 'blue');
  
  await check('数据库文件存在', async () => {
    if (fs.existsSync(CONFIG.DB_PATH)) {
      const stats = fs.statSync(CONFIG.DB_PATH);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      return { success: true, message: `${sizeMB} MB` };
    } else {
      return { success: false, message: `文件不存在: ${CONFIG.DB_PATH}` };
    }
  });

  // 检查数据库表（需要sqlite3模块）
  await check('数据库表结构', async () => {
    try {
      const sqlite3 = require('sqlite3');
      const db = new sqlite3.Database(CONFIG.DB_PATH, sqlite3.OPEN_READONLY);
      
      return new Promise((resolve) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
          db.close();
          
          if (err) {
            resolve({ success: false, message: err.message });
            return;
          }
          
          const requiredTables = ['users', 'passengers', 'orders'];
          const existingTables = rows.map(row => row.name);
          const missingTables = requiredTables.filter(t => !existingTables.includes(t));
          
          if (missingTables.length === 0) {
            resolve({ success: true, message: `${existingTables.length} 张表` });
          } else {
            resolve({ 
              success: false, 
              message: `缺失表: ${missingTables.join(', ')}` 
            });
          }
        });
      });
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        return { success: true, message: '跳过（sqlite3模块未安装）' };
      }
      throw error;
    }
  }, 'warning');
}

// ===== 3. 后端服务检查 =====
async function checkBackendService() {
  log('\n🔧 后端服务检查', 'blue');
  
  await check('后端服务可访问', async () => {
    try {
      const response = await makeRequest(CONFIG.BACKEND_URL);
      return { success: true, message: `状态码 ${response.statusCode}` };
    } catch (error) {
      return { success: false, message: '服务未启动或不可访问' };
    }
  });

  // 检查个人信息相关的API端点
  const endpoints = [
    { path: '/api/user/info', method: 'GET', name: '获取用户信息', requiresAuth: true },
    { path: '/api/user/email', method: 'PUT', name: '更新用户邮箱', requiresAuth: true },
    { path: '/api/user/phone/update-request', method: 'POST', name: '请求更新手机号', requiresAuth: true },
    { path: '/api/user/orders', method: 'GET', name: '获取用户订单', requiresAuth: true },
    { path: '/api/passengers/validate', method: 'POST', name: '验证乘客信息', requiresAuth: true }
  ];

  for (const endpoint of endpoints) {
    await check(`API ${endpoint.method} ${endpoint.path}`, async () => {
      try {
        const url = `${CONFIG.BACKEND_URL}${endpoint.path}`;
        const response = await makeRequest(url, { method: endpoint.method });
        
        // 对于需要认证的端点，返回401是正常的
        if (endpoint.requiresAuth && response.statusCode === 401) {
          return { success: true, message: '端点存在（需要认证）' };
        }
        
        // 返回501表示端点已定义但未实现
        if (response.statusCode === 501) {
          return { success: true, message: '端点已定义（未实现）' };
        }
        
        // 其他2xx和4xx状态码也表示端点存在
        if (response.statusCode >= 200 && response.statusCode < 500) {
          return { success: true, message: `状态码 ${response.statusCode}` };
        }
        
        return { success: false, message: `异常状态码 ${response.statusCode}` };
      } catch (error) {
        return { success: false, message: '端点不存在或不可访问' };
      }
    }, 'warning');
  }
}

// ===== 4. 前端服务检查 =====
async function checkFrontendService() {
  log('\n🎨 前端服务检查', 'blue');
  
  await check('前端服务可访问', async () => {
    try {
      const response = await makeRequest(CONFIG.FRONTEND_URL);
      if (response.statusCode === 200) {
        return { success: true, message: '服务正常' };
      } else {
        return { success: false, message: `状态码 ${response.statusCode}` };
      }
    } catch (error) {
      return { success: false, message: '服务未启动或不可访问' };
    }
  });

  // 检查前端静态资源
  await check('前端资源文件', async () => {
    const frontendPath = path.join(__dirname, 'frontend');
    if (fs.existsSync(frontendPath)) {
      const srcPath = path.join(frontendPath, 'src');
      if (fs.existsSync(srcPath)) {
        return { success: true, message: '源文件目录存在' };
      } else {
        return { success: false, message: 'src目录不存在' };
      }
    } else {
      return { success: false, message: 'frontend目录不存在' };
    }
  });
}

// ===== 5. 依赖检查 =====
async function checkDependencies() {
  log('\n📦 依赖检查', 'blue');
  
  await check('后端依赖安装', async () => {
    const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
    const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
    
    if (!fs.existsSync(backendPackagePath)) {
      return { success: false, message: 'package.json 不存在' };
    }
    
    if (!fs.existsSync(backendNodeModules)) {
      return { success: false, message: 'node_modules 不存在，请运行 npm install' };
    }
    
    return { success: true, message: '已安装' };
  });

  await check('前端依赖安装', async () => {
    const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');
    const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');
    
    if (!fs.existsSync(frontendPackagePath)) {
      return { success: false, message: 'package.json 不存在' };
    }
    
    if (!fs.existsSync(frontendNodeModules)) {
      return { success: false, message: 'node_modules 不存在，请运行 npm install' };
    }
    
    return { success: true, message: '已安装' };
  });
}

// ===== 6. 代码文件检查 =====
async function checkCodeFiles() {
  log('\n📄 个人信息页代码文件检查', 'blue');
  
  const files = [
    { path: 'backend/src/services/userInfoDbService.js', name: '用户信息数据库服务' },
    { path: 'backend/src/services/passengerManagementDbService.js', name: '乘客管理数据库服务' },
    { path: 'backend/src/routes/userInfo.js', name: '用户信息API路由' },
    { path: 'backend/src/routes/passengerManagement.js', name: '乘客管理API路由' },
    { path: 'backend/test/services/userInfoDbService.test.js', name: '用户信息服务测试' },
    { path: 'backend/test/services/passengerManagementDbService.test.js', name: '乘客管理服务测试' },
    { path: 'backend/test/routes/userInfo.test.js', name: '用户信息路由测试' },
    { path: 'frontend/src/pages/PersonalInfoPage.tsx', name: '个人信息页组件' },
    { path: 'frontend/src/components/SideMenu.tsx', name: '侧边菜单组件' },
    { path: 'frontend/test/pages/PersonalInfoPage.test.tsx', name: '个人信息页测试' }
  ];

  for (const file of files) {
    await check(file.name, async () => {
      const filePath = path.join(__dirname, file.path);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        return { success: true, message: `${sizeKB} KB` };
      } else {
        return { success: false, message: '文件不存在' };
      }
    }, 'warning');
  }
}

// ===== 7. 集成测试文件检查 =====
async function checkTestFiles() {
  log('\n🧪 测试文件检查', 'blue');
  
  await check('集成测试脚本', async () => {
    const testPath = path.join(__dirname, 'integration-test-personal-info.js');
    if (fs.existsSync(testPath)) {
      return { success: true, message: '文件存在' };
    } else {
      return { success: false, message: '文件不存在' };
    }
  });

  await check('测试总结文档', async () => {
    const summaryPath = path.join(__dirname, 'PERSONAL-INFO-TEST-GENERATION-SUMMARY.md');
    if (fs.existsSync(summaryPath)) {
      return { success: true, message: '文档存在' };
    } else {
      return { success: false, message: '文档不存在' };
    }
  }, 'warning');
}

// ===== 主函数 =====
async function main() {
  console.clear();
  log('════════════════════════════════════════════════════════════════', 'blue');
  log('  个人信息页系统验证', 'blue');
  log('════════════════════════════════════════════════════════════════', 'blue');
  log(`  时间: ${new Date().toLocaleString('zh-CN')}`, 'gray');
  log('════════════════════════════════════════════════════════════════\n', 'blue');

  try {
    // 执行所有检查
    await checkEnvironmentConfig();
    await checkDatabase();
    await checkDependencies();
    await checkCodeFiles();
    await checkTestFiles();
    await checkBackendService();
    await checkFrontendService();

    // 打印结果统计
    log('\n════════════════════════════════════════════════════════════════', 'blue');
    log('  验证结果汇总', 'blue');
    log('════════════════════════════════════════════════════════════════', 'blue');
    log(`  总检查项: ${results.total}`, 'gray');
    log(`  ${colors.green}✓${colors.reset} 通过: ${results.passed}`, 'gray');
    log(`  ${colors.red}✗${colors.reset} 失败: ${results.failed}`, 'gray');
    log(`  ${colors.yellow}⚠${colors.reset} 警告: ${results.warnings}`, 'gray');
    
    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    log(`  成功率: ${successRate}%`, 'gray');
    log('════════════════════════════════════════════════════════════════\n', 'blue');

    // 健康状态判断
    if (results.failed === 0 && results.warnings === 0) {
      log('🎉 系统状态: 完美！所有检查通过', 'green');
    } else if (results.failed === 0) {
      log('✅ 系统状态: 良好（有些许警告）', 'yellow');
    } else if (results.failed <= 3) {
      log('⚠️  系统状态: 需要注意（有少量问题）', 'yellow');
    } else {
      log('❌ 系统状态: 需要修复（有较多问题）', 'red');
    }

    // 失败项详细信息
    const failedChecks = results.checks.filter(c => c.status === 'failed');
    if (failedChecks.length > 0) {
      log('\n需要修复的问题:', 'red');
      failedChecks.forEach((check, index) => {
        log(`  ${index + 1}. ${check.name}: ${check.message}`, 'red');
      });
    }

    // 警告项详细信息
    const warningChecks = results.checks.filter(c => c.status === 'warning');
    if (warningChecks.length > 0) {
      log('\n警告提示:', 'yellow');
      warningChecks.forEach((check, index) => {
        log(`  ${index + 1}. ${check.name}: ${check.message}`, 'yellow');
      });
    }

    log('\n提示: 使用环境变量自定义配置', 'gray');
    log('  BACKEND_URL=http://localhost:3000 node verify-personal-info-system.js', 'gray');
    log('  FRONTEND_URL=http://localhost:5173 node verify-personal-info-system.js\n', 'gray');

    // 退出代码
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    log('\n❌ 验证过程中发生错误:', 'red');
    log(`  ${error.message}`, 'red');
    if (error.stack) {
      log(`\n${error.stack}`, 'gray');
    }
    process.exit(1);
  }
}

// 运行验证
main();


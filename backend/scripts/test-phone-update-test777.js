/**
 * 测试test777用户的手机号更新API
 */

const bcrypt = require('bcryptjs');
const path = require('path');

// 模拟API调用
async function testAPI() {
  console.log('🔍 测试test777用户的密码验证...\n');
  
  try {
    // 从数据库获取用户信息
    const db = require('../src/database');
    const userId = 12;
    const password = '777'; // 假设的密码，你需要告诉我正确的密码
    
    console.log('步骤1: 查询用户信息...');
    const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    console.log('查询结果:', {
      found: user && user.length > 0,
      count: user ? user.length : 0,
      user: user && user.length > 0 ? {
        id: user[0].id,
        username: user[0].username,
        phone: user[0].phone,
        passwordHash: user[0].password ? user[0].password.substring(0, 20) + '...' : 'null'
      } : null
    });
    
    if (!user || user.length === 0) {
      console.error('❌ 用户不存在');
      return;
    }
    
    console.log('\n步骤2: 验证密码格式...');
    const storedPassword = user[0].password;
    console.log('密码类型:', typeof storedPassword);
    console.log('密码长度:', storedPassword ? storedPassword.length : 0);
    console.log('是否bcrypt格式:', storedPassword && storedPassword.startsWith('$2a$'));
    
    // 尝试不同的密码
    const testPasswords = ['777', 'test777', '123456', 'password'];
    
    console.log('\n步骤3: 尝试验证密码...');
    for (const testPwd of testPasswords) {
      try {
        const match = await bcrypt.compare(testPwd, storedPassword);
        console.log(`  密码 "${testPwd}": ${match ? '✅ 匹配' : '❌ 不匹配'}`);
      } catch (err) {
        console.error(`  密码 "${testPwd}": ❌ 验证出错:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

testAPI();


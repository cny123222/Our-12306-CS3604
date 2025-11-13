#!/usr/bin/env node

/**
 * Test script for registration, login, and verification code functionality
 */

const API_BASE = 'http://localhost:3000';

async function testRegistration() {
  console.log('\n========================================');
  console.log('测试注册功能');
  console.log('========================================\n');

  // Test user data with unique phone number
  const timestamp = Date.now().toString().slice(-8);
  const userData = {
    username: `testuser${timestamp}`,
    password: 'test123_',
    confirmPassword: 'test123_',
    idType: '居民身份证',
    realName: '张三',
    idNumber: `1101011990010${timestamp.slice(0, 5)}`,
    discountType: '成人',
    email: `test${timestamp}@example.com`,
    phone: `138${timestamp}`,
    agreedToTerms: true
  };

  try {
    console.log('发送注册请求...');
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ 注册失败:', result.error);
      return null;
    }

    console.log('✅ 注册成功!');
    console.log('用户ID:', result.userId);
    console.log('用户名:', userData.username);
    return { userId: result.userId, username: userData.username, idNumber: userData.idNumber };
  } catch (error) {
    console.error('❌ 注册请求失败:', error.message);
    return null;
  }
}

async function testSendSmsVerificationCode(userId, idNumberLast4) {
  console.log('\n========================================');
  console.log('测试发送短信验证码');
  console.log('========================================\n');

  try {
    console.log('发送短信验证码请求...');
    const response = await fetch(`${API_BASE}/api/auth/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        idNumberLast4
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ 发送短信验证码失败:', result.error);
      return false;
    }

    console.log('✅ 短信验证码发送成功!');
    console.log('掩码手机号:', result.phoneNumberMasked);
    console.log('\n👆 请查看上方terminal输出的验证码');
    return true;
  } catch (error) {
    console.error('❌ 发送短信验证码请求失败:', error.message);
    return false;
  }
}

async function testLogin(username, password) {
  console.log('\n========================================');
  console.log('测试登录功能');
  console.log('========================================\n');

  try {
    console.log('发送登录请求...');
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        credential: username,
        password
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ 登录失败:', result.error);
      return null;
    }

    console.log('✅ 登录成功（需要短信验证）');
    console.log('用户ID:', result.userId);
    return result.userId;
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return null;
  }
}

async function testVerifyLoginCode(userId, idNumberLast4, verificationCode) {
  console.log('\n========================================');
  console.log('测试验证码验证');
  console.log('========================================\n');

  try {
    console.log('发送验证码验证请求...');
    const response = await fetch(`${API_BASE}/api/auth/verify-login-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        idNumberLast4,
        verificationCode
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ 验证码验证失败:', result.error);
      return null;
    }

    console.log('✅ 验证码验证成功，登录完成！');
    console.log('Token:', result.token);
    console.log('用户信息:', result.user);
    return result.token;
  } catch (error) {
    console.error('❌ 验证码验证请求失败:', error.message);
    return null;
  }
}

// Main test flow
async function main() {
  console.log('\n========================================');
  console.log('开始测试注册和登录流程');
  console.log('========================================\n');

  // Step 1: Register
  const registrationResult = await testRegistration();
  if (!registrationResult) {
    console.error('\n❌ 测试失败：注册失败');
    process.exit(1);
  }

  // Wait for database to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Step 2: Login
  const loginUserId = await testLogin(registrationResult.username, 'test123_');
  if (!loginUserId) {
    console.error('\n❌ 测试失败：登录失败');
    process.exit(1);
  }

  // Step 3: Send verification code
  const idNumberLast4 = registrationResult.idNumber.slice(-4);
  const codeSent = await testSendSmsVerificationCode(loginUserId, idNumberLast4);
  if (!codeSent) {
    console.error('\n❌ 测试失败：发送验证码失败');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('⚠️  手动测试步骤');
  console.log('========================================');
  console.log('1. 查看上方terminal输出的验证码');
  console.log('2. 在网页中输入该验证码');
  console.log('3. 或者使用以下命令测试验证码验证:');
  console.log(`   node -e "import('./test-registration.js').then(m => m.testVerifyLoginCode('${loginUserId}', '1234', 'YOUR_CODE'))"`);
  console.log('========================================\n');
}

main().catch(console.error);

export { testVerifyLoginCode };


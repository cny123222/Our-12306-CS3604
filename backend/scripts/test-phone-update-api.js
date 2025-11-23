/**
 * 测试手机号更新API
 */

const axios = require('axios');

async function testPhoneUpdateAPI() {
  console.log('🔍 测试手机号更新API...\n');
  
  try {
    // 1. 先登录获取token
    console.log('步骤1: 登录testuser账号...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      identifier: 'testuser',
      password: 'testpass123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，token获取成功\n');
    
    // 2. 获取用户信息
    console.log('步骤2: 获取用户信息...');
    const userInfoResponse = await axios.get('http://localhost:3000/api/user/info', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ 用户信息:', {
      username: userInfoResponse.data.username,
      phone: userInfoResponse.data.phone,
      email: userInfoResponse.data.email
    });
    console.log('');
    
    // 3. 请求更新手机号
    console.log('步骤3: 请求更新手机号...');
    console.log('请求参数:', {
      newPhone: '13900139000',
      password: 'testpass123'
    });
    
    const updateResponse = await axios.post('http://localhost:3000/api/user/phone/update-request', {
      newPhone: '13900139000',
      password: 'testpass123'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ API响应:', updateResponse.data);
    console.log('\n' + '='.repeat(60));
    console.log('✅ 测试成功！');
    console.log('验证码:', updateResponse.data.verificationCode);
    console.log('手机号:', updateResponse.data.phone);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 测试失败！');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error('HTTP状态码:', error.response.status);
      console.error('错误响应:', error.response.data);
      console.error('请求配置:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      });
    } else if (error.request) {
      console.error('请求已发送但没有收到响应');
      console.error('错误信息:', error.message);
    } else {
      console.error('请求配置错误:', error.message);
    }
  }
}

testPhoneUpdateAPI();


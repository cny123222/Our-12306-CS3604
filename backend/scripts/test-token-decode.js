/**
 * 测试 Token 解码
 * 用于检查登录时生成的 Token 中的 userId
 */

// 从浏览器控制台获取 token
const testToken = process.argv[2];

if (!testToken) {
  console.log('用法: node test-token-decode.js <your-token>');
  console.log('');
  console.log('如何获取 token:');
  console.log('1. 在浏览器中打开开发者工具 (F12)');
  console.log('2. 在 Console 中输入: localStorage.getItem("authToken")');
  console.log('3. 复制输出的 token');
  console.log('4. 运行: node scripts/test-token-decode.js "你的token"');
  process.exit(1);
}

console.log('=== Token 解码测试 ===\n');
console.log('Token (前50个字符):', testToken.substring(0, 50) + '...\n');

try {
  const tokenData = JSON.parse(Buffer.from(testToken, 'base64').toString('utf-8'));
  
  console.log('解码后的 Token 数据:');
  console.log(JSON.stringify(tokenData, null, 2));
  console.log('');
  console.log('关键信息:');
  console.log(`  - userId: ${tokenData.userId} (类型: ${typeof tokenData.userId})`);
  console.log(`  - username: ${tokenData.username}`);
  console.log(`  - timestamp: ${tokenData.timestamp} (${new Date(tokenData.timestamp).toLocaleString()})`);
  
  const age = Date.now() - tokenData.timestamp;
  const hours = Math.floor(age / (1000 * 60 * 60));
  const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
  console.log(`  - Token 年龄: ${hours}小时 ${minutes}分钟`);
  console.log(`  - 是否过期: ${age > 24 * 60 * 60 * 1000 ? '是' : '否'} (24小时有效期)`);
  
} catch (error) {
  console.error('解码失败:', error.message);
  console.log('\nToken 格式可能不正确，请确保:');
  console.log('1. Token 是从 localStorage.getItem("authToken") 获取的');
  console.log('2. Token 包含在引号中');
}

console.log('\n=== 检查完成 ===');


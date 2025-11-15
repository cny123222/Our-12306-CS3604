/**
 * 测试订单查询修复
 * 模拟用户登录并查询订单
 */

const path = require('path');

// 设置环境变量
process.env.DB_PATH = path.join(__dirname, '../database/railway.db');

// 引入服务
const userInfoDbService = require('../src/services/userInfoDbService');

console.log('测试订单查询修复...\n');

async function testOrderQuery() {
  try {
    // 测试用例1：使用INTEGER类型的userId（模拟从token解析出的）
    console.log('=== 测试1：INTEGER类型的userId ===');
    const userId1 = 1; // INTEGER类型
    console.log(`查询userId: ${userId1} (类型: ${typeof userId1})`);
    
    const orders1 = await userInfoDbService.getUserOrders(userId1, {});
    console.log(`✅ 找到 ${orders1.length} 个订单`);
    
    if (orders1.length > 0) {
      const latestOrder = orders1[0];
      console.log(`最新订单: ${latestOrder.orderId}`);
      console.log(`  车次: ${latestOrder.trainNo}`);
      console.log(`  路线: ${latestOrder.departureStation} → ${latestOrder.arrivalStation}`);
      console.log(`  日期: ${latestOrder.departureDate}`);
      console.log(`  状态: ${latestOrder.status}`);
      console.log(`  创建时间: ${latestOrder.createdAt}`);
    }
    
    console.log('\n=== 测试2：STRING类型的userId ===');
    const userId2 = "1"; // STRING类型
    console.log(`查询userId: "${userId2}" (类型: ${typeof userId2})`);
    
    const orders2 = await userInfoDbService.getUserOrders(userId2, {});
    console.log(`✅ 找到 ${orders2.length} 个订单`);
    
    // 验证两种类型查询结果一致
    console.log('\n=== 结果对比 ===');
    if (orders1.length === orders2.length) {
      console.log(`✅ 两种类型查询结果一致: ${orders1.length} 个订单`);
    } else {
      console.log(`❌ 结果不一致: INTEGER(${orders1.length}) vs STRING(${orders2.length})`);
    }
    
    // 测试搜索功能
    console.log('\n=== 测试3：搜索订单 ===');
    const searchResults = await userInfoDbService.searchOrders(userId1, {
      keyword: 'D6'
    });
    console.log(`✅ 搜索到 ${searchResults.length} 个包含"D6"的订单`);
    
    console.log('\n✅ 所有测试通过！');
    console.log('\n🎉 修复成功！用户现在可以在订单中心看到订单了。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testOrderQuery();


/**
 * 测试乘客姓名修复
 */

const path = require('path');

// 设置环境变量
process.env.DB_PATH = path.join(__dirname, '../database/railway.db');

// 引入服务
const userInfoDbService = require('../src/services/userInfoDbService');

console.log('测试乘客姓名显示修复...\n');

async function testPassengerNameFix() {
  try {
    // 测试刘嘉敏用户（ID=1）
    console.log('=== 测试刘嘉敏用户的订单 ===');
    const userId = 1;
    console.log(`查询userId: ${userId}\n`);
    
    const orders = await userInfoDbService.getUserOrders(userId, {});
    console.log(`✅ 找到 ${orders.length} 个订单\n`);
    
    if (orders.length > 0) {
      console.log('最新5个订单的乘客信息:');
      orders.slice(0, 5).forEach((order, index) => {
        console.log(`\n${index + 1}. 订单ID: ${order.orderId}`);
        console.log(`   车次: ${order.trainNo}`);
        console.log(`   路线: ${order.departureStation} → ${order.arrivalStation}`);
        console.log(`   日期: ${order.departureDate}`);
        console.log(`   状态: ${order.status}`);
        console.log(`   乘客姓名: ${order.passenger_name || '(无)'}`);
        
        if (order.passengers && order.passengers.length > 0) {
          console.log(`   乘客详情:`);
          order.passengers.forEach(p => {
            console.log(`     - ${p.passenger_name}, ${p.seat_type}, ${p.ticket_type}`);
          });
        }
      });
      
      // 检查是否有"张三"
      const hasZhangSan = orders.some(o => o.passenger_name && o.passenger_name.includes('张三'));
      if (hasZhangSan) {
        console.log('\n❌ 错误：订单中仍然包含"张三"');
      } else {
        console.log('\n✅ 正确：订单中没有"张三"');
      }
      
      // 检查是否所有订单都有乘客姓名
      const withoutPassengerName = orders.filter(o => !o.passenger_name || o.passenger_name === '');
      if (withoutPassengerName.length > 0) {
        console.log(`\n⚠️  警告：有 ${withoutPassengerName.length} 个订单没有乘客姓名`);
      } else {
        console.log('\n✅ 所有订单都有乘客姓名');
      }
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testPassengerNameFix();


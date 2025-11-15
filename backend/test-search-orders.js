// 测试订单搜索功能
const db = require('./src/database');
const userInfoDbService = require('./src/services/userInfoDbService');

async function testOrderSearch() {
  try {
    console.log('=== 测试订单搜索功能 ===\n');
    
    // 首先获取刘嘉敏的用户ID
    const user = await db.queryOne('SELECT id, username, name FROM users WHERE username = ?', ['od12322']);
    
    if (!user) {
      console.error('未找到用户 liujiamin');
      return;
    }
    
    console.log(`找到用户: ${user.username} (ID: ${user.id}, 姓名: ${user.name})\n`);
    const userId = user.id;
    
    // 查询刘嘉敏的所有订单
    const allOrders = await db.query(`
      SELECT 
        o.id,
        o.train_number,
        o.departure_station,
        o.arrival_station,
        o.departure_date,
        o.status
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);
    
    console.log(`刘嘉敏共有 ${allOrders.length} 个订单:\n`);
    
    for (const order of allOrders) {
      console.log(`- 订单号: ${order.id}`);
      console.log(`  车次: ${order.train_number}`);
      console.log(`  ${order.departure_station} → ${order.arrival_station}`);
      console.log(`  出发日期: ${order.departure_date}`);
      console.log(`  状态: ${order.status}`);
      
      // 查询该订单的乘客信息
      const passengers = await db.query(`
        SELECT passenger_name, seat_type, seat_number
        FROM order_details
        WHERE order_id = ?
      `, [order.id]);
      
      console.log(`  乘客: ${passengers.map(p => p.passenger_name).join(', ')}`);
      console.log('');
    }
    
    // 测试1: 搜索车次号 G16
    console.log('\n=== 测试1: 搜索车次号 "G16" ===');
    const results1 = await userInfoDbService.searchOrders(userId, { keyword: 'G16' });
    console.log(`搜索结果: 找到 ${results1.length} 个订单`);
    results1.forEach((order, index) => {
      console.log(`${index + 1}. 订单号: ${order.id}, 车次: ${order.train_no}, 乘客: ${order.passenger_name}`);
    });
    
    // 验证：只应该返回G16车次的订单
    const hasG16Only = results1.every(o => o.train_no === 'G16');
    console.log(`✓ 验证: ${hasG16Only ? '通过 - 只返回G16车次' : '失败 - 返回了其他车次'}`);
    
    // 测试2: 搜索车次号 D6
    console.log('\n=== 测试2: 搜索车次号 "D6" ===');
    const results2 = await userInfoDbService.searchOrders(userId, { keyword: 'D6' });
    console.log(`搜索结果: 找到 ${results2.length} 个订单`);
    results2.forEach((order, index) => {
      console.log(`${index + 1}. 订单号: ${order.id}, 车次: ${order.train_no}, 乘客: ${order.passenger_name}`);
    });
    
    // 验证：只应该返回D6车次的订单
    const hasD6Only = results2.every(o => o.train_no === 'D6');
    console.log(`✓ 验证: ${hasD6Only ? '通过 - 只返回D6车次' : '失败 - 返回了其他车次'}`);
    
    // 测试3: 搜索乘客姓名 "刘嘉敏"
    console.log('\n=== 测试3: 搜索乘客姓名 "刘嘉敏" ===');
    const results3 = await userInfoDbService.searchOrders(userId, { keyword: '刘嘉敏' });
    console.log(`搜索结果: 找到 ${results3.length} 个订单`);
    results3.forEach((order, index) => {
      console.log(`${index + 1}. 订单号: ${order.id}, 车次: ${order.train_no}, 乘客: ${order.passenger_name}`);
    });
    
    // 验证：所有订单都应该包含乘客"刘嘉敏"
    const hasLiuJiamin = results3.every(o => o.passenger_name.includes('刘嘉敏'));
    console.log(`✓ 验证: ${hasLiuJiamin ? '通过 - 所有订单都包含乘客刘嘉敏' : '失败 - 部分订单不包含刘嘉敏'}`);
    
    // 测试4: 搜索不存在的关键词
    console.log('\n=== 测试4: 搜索不存在的关键词 "XYZ999" ===');
    const results4 = await userInfoDbService.searchOrders(userId, { keyword: 'XYZ999' });
    console.log(`搜索结果: 找到 ${results4.length} 个订单`);
    console.log(`✓ 验证: ${results4.length === 0 ? '通过 - 正确返回空结果' : '失败 - 不应该有结果'}`);
    
    console.log('\n=== 测试完成 ===');
    
    // 总结
    console.log('\n=== 测试总结 ===');
    const allPassed = hasG16Only && hasD6Only && hasLiuJiamin && results4.length === 0;
    if (allPassed) {
      console.log('✅ 所有测试通过！搜索功能正常工作。');
    } else {
      console.log('❌ 部分测试失败，请检查搜索逻辑。');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testOrderSearch();


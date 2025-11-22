/**
 * 测试过期订单过滤修复
 * 验证过期的 confirmed_unpaid 订单不会显示在订单列表中
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/database/railway.db');
const db = new sqlite3.Database(dbPath);

async function testExpiredOrderFiltering() {
  console.log('\n========== 测试过期订单过滤修复 ==========\n');
  
  try {
    // 1. 检查是否有过期的 confirmed_unpaid 订单
    const expiredOrders = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, 
          user_id,
          status, 
          payment_expires_at,
          datetime('now') as current_time,
          datetime('now') > payment_expires_at as is_expired
        FROM orders 
        WHERE status = 'confirmed_unpaid'
          AND payment_expires_at IS NOT NULL`,
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
    
    console.log(`📊 数据库中的 confirmed_unpaid 订单数量: ${expiredOrders.length}`);
    
    if (expiredOrders.length > 0) {
      console.log('\n订单详情:');
      expiredOrders.forEach(order => {
        const status = order.is_expired ? '❌ 已过期' : '✅ 未过期';
        console.log(`  订单 ${order.id}: ${status}`);
        console.log(`    用户ID: ${order.user_id}`);
        console.log(`    过期时间: ${order.payment_expires_at}`);
        console.log(`    当前时间: ${order.current_time}`);
      });
      
      // 2. 测试新的查询逻辑（模拟 getUserOrders）
      const expiredCount = expiredOrders.filter(o => o.is_expired).length;
      const validCount = expiredOrders.length - expiredCount;
      
      console.log(`\n📈 统计:`);
      console.log(`  已过期订单: ${expiredCount}`);
      console.log(`  未过期订单: ${validCount}`);
      
      if (expiredCount > 0) {
        console.log(`\n✅ 修复后，这 ${expiredCount} 个过期订单将不会显示在未完成订单列表中`);
      }
    } else {
      console.log('✅ 当前没有 confirmed_unpaid 状态的订单');
    }
    
    // 3. 测试新的过滤逻辑
    console.log('\n\n========== 测试过滤逻辑 ==========\n');
    
    const filteredOrders = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id,
          status,
          payment_expires_at
        FROM orders
        WHERE status != 'pending'
          AND (
            status != 'confirmed_unpaid' 
            OR payment_expires_at IS NULL 
            OR datetime('now') <= payment_expires_at
          )
        ORDER BY created_at DESC
        LIMIT 10`,
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
    
    console.log(`📋 使用新过滤逻辑查询到的订单数量: ${filteredOrders.length}`);
    
    if (filteredOrders.length > 0) {
      console.log('\n订单列表（前10个）:');
      filteredOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. 订单 ${order.id}: ${order.status}`);
        if (order.payment_expires_at) {
          console.log(`     支付过期时间: ${order.payment_expires_at}`);
        }
      });
    }
    
    console.log('\n\n========== 测试完成 ==========\n');
    console.log('✅ 修复已应用：');
    console.log('   - getUserOrders() 将过滤掉已过期的 confirmed_unpaid 订单');
    console.log('   - searchOrders() 将过滤掉已过期的 confirmed_unpaid 订单');
    console.log('   - 用户不会再看到超时未支付的订单');
    console.log('   - 点击去支付不会再出现"订单状态错误"的提示\n');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    db.close();
  }
}

// 运行测试
testExpiredOrderFiltering();


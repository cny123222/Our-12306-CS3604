# Pending 订单清理座位释放修复报告

## 问题描述

### 发现的问题
1. **数据库状态不一致**：11-23 的 G16 列车商务座实际上只在 test04 账号下被预定了 9 张票，应该还有一张余票，但数据库显示 0 张余票
2. **Pending 订单清理逻辑缺陷**：pending 订单虽然被清除了，但座位状态没有被正确释放

### 问题根源
在 `backend/src/services/pendingOrderCleanupService.js` 的 `cleanupExpiredPendingOrders` 函数中：
- 只是简单地删除了 pending 订单和订单明细
- **没有调用 `releaseSeatLocks` 函数来释放座位状态**
- 导致座位状态保持在 `booked` 状态，无法被重新预定

## 解决方案

### 1. 修复数据库状态（临时方案）

创建了脚本 `backend/scripts/fix-g16-business-seats.js` 来手动修复数据库状态：

**功能**：
- 查询指定车次、日期、席别的座位状态
- 统计当前可用座位数
- 释放指定数量的已预定座位，使余票数达到目标值

**执行结果**：
```
✅ 座位释放成功！
   已释放 1 个座位
   更新了 8 条座位状态记录

📊 修复后状态:
   可用座位数: 1 个
```

**使用方法**：
```bash
cd backend
node scripts/fix-g16-business-seats.js
```

### 2. 修复 Pending 订单清理逻辑（根本解决）

#### 修改前的代码（有问题）
```javascript
async function cleanupExpiredPendingOrders() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.serialize(() => {
      // 开始事务
      db.run('BEGIN TRANSACTION', ...);
      
      // 查询超时订单数量
      db.get(`SELECT COUNT(*) as count FROM orders 
              WHERE status = 'pending' 
              AND created_at < datetime('now', '-10 minutes')`, ...);
      
      // 删除订单明细
      db.run(`DELETE FROM order_details WHERE order_id IN (...)`, ...);
      
      // 删除订单
      db.run(`DELETE FROM orders WHERE status = 'pending' ...`, ...);
      
      // 提交事务
      db.run('COMMIT', ...);
    });
  });
}
```

**问题**：没有释放座位状态！

#### 修改后的代码（正确）
```javascript
async function cleanupExpiredPendingOrders() {
  return new Promise(async (resolve, reject) => {
    const db = getDatabase();
    const orderService = require('./orderService');
    
    try {
      // 1. 查询过期的pending订单
      const expiredOrders = await new Promise((resolve, reject) => {
        db.all(`SELECT id FROM orders 
                WHERE status = 'pending' 
                AND created_at < datetime('now', '-10 minutes')`, ...);
      });
      
      db.close();
      
      if (expiredOrders.length === 0) {
        return resolve({ ordersDeleted: 0, detailsDeleted: 0 });
      }
      
      // 2. 逐个处理过期订单
      for (const order of expiredOrders) {
        try {
          // ⭐ 关键修复：先释放座位锁定
          await orderService.releaseSeatLocks(order.id);
          
          // 然后删除订单明细和订单
          const deleteDb = getDatabase();
          
          await new Promise((resolve, reject) => {
            deleteDb.run('DELETE FROM order_details WHERE order_id = ?', [order.id], ...);
          });
          
          await new Promise((resolve, reject) => {
            deleteDb.run('DELETE FROM orders WHERE id = ?', [order.id], ...);
          });
          
          deleteDb.close();
        } catch (error) {
          console.error(`[订单清理] 清理订单 ${order.id} 失败:`, error.message);
          // 继续处理其他订单
        }
      }
      
      resolve({ ordersDeleted, detailsDeleted });
    } catch (error) {
      console.error('[订单清理] 清理过程出错:', error);
      reject(error);
    }
  });
}
```

**改进点**：
1. ✅ 在删除订单前调用 `orderService.releaseSeatLocks(order.id)` 释放座位
2. ✅ 采用与 `cleanupExpiredUnpaidOrders` 一致的清理流程
3. ✅ 逐个处理订单，避免数据库锁定冲突
4. ✅ 错误处理更完善，单个订单清理失败不影响其他订单

### 3. releaseSeatLocks 函数工作原理

```javascript
async function releaseSeatLocks(orderId) {
  // 1. 查询订单信息
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  
  // 2. 查询订单明细获取座位信息
  const details = await db.all('SELECT * FROM order_details WHERE order_id = ?', [orderId]);
  
  // 3. 获取所有途经区间
  const stops = await db.all('SELECT station FROM train_stops WHERE ...');
  const segments = constructSegments(stops);
  
  // 4. 释放每个乘客的座位
  for (const detail of details) {
    if (!detail.seat_number) continue;
    
    for (const segment of segments) {
      await db.run(
        `UPDATE seat_status 
         SET status = 'available', booked_by = NULL, booked_at = NULL
         WHERE train_no = ? AND departure_date = ? AND seat_type = ? 
         AND seat_no = ? AND from_station = ? AND to_station = ?`,
        [order.train_number, order.departure_date, detail.seat_type, 
         detail.seat_number, segment.from, segment.to]
      );
    }
  }
}
```

## 修复效果

### 修复前
1. ❌ Pending 订单超时被删除后，座位状态保持 `booked`
2. ❌ 导致余票数不准确，用户无法预定实际可用的座位
3. ❌ 数据库状态不一致，需要手动干预

### 修复后
1. ✅ Pending 订单超时被删除前，先释放所有已分配的座位
2. ✅ 座位状态正确恢复为 `available`
3. ✅ 余票数始终准确
4. ✅ 数据一致性得到保证

## 测试验证

### 测试场景
1. 创建一个 pending 订单，确认后座位被分配
2. 等待订单超时（10分钟）
3. 清理服务运行后检查座位状态

### 预期结果
- ✅ 订单被删除
- ✅ 订单明细被删除
- ✅ 座位状态恢复为 `available`
- ✅ 余票数正确增加

## 相关文件

### 修改的文件
- `backend/src/services/pendingOrderCleanupService.js` - 添加座位释放逻辑

### 新增的文件
- `backend/scripts/fix-g16-business-seats.js` - 临时修复脚本
- `PENDING-ORDER-CLEANUP-FIX.md` - 本文档

### 依赖的函数
- `backend/src/services/orderService.js::releaseSeatLocks()` - 释放座位锁定

## 注意事项

1. **Pending 订单的座位分配**：
   - 正常情况下，pending 订单在确认前不应该有座位分配
   - 但如果有异常情况导致 pending 订单有座位信息，现在也会被正确释放

2. **数据库事务**：
   - 修改后的实现采用逐个处理订单的方式，而不是单个大事务
   - 避免长时间锁定数据库
   - 单个订单清理失败不影响其他订单

3. **错误容忍**：
   - 如果释放座位失败，会记录错误但继续处理其他订单
   - 确保清理服务的鲁棒性

## 总结

这次修复解决了两个重要问题：
1. **短期**：通过脚本修复了当前数据库的状态问题
2. **长期**：修复了 pending 订单清理逻辑，防止将来再次出现相同问题

修复后，系统的座位管理更加健壮，数据一致性得到了保证。


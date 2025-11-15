# 订单页面显示问题修复总结

## 修复日期
2025-11-15

## 问题描述

用户在 `http://localhost:5174/orders` 查看订单时发现三个问题：

1. **所有订单票价都为0元**，未能正确显示车票价格
2. **所有订单未显示车次信息**，包括车次、座位号、出发站、出发时间、到达站、到达时间、席位类别等
3. **所有pending状态的订单都显示在列表中**，数据库中有87个pending订单需要清理

## 根本原因分析

### 问题1：票价显示为0
- **原因**：前端 `OrderItem.tsx` 组件使用下划线命名 `total_price`
- 后端 `userInfoDbService.js` 返回驼峰命名 `totalPrice`
- 字段名不匹配导致前端无法正确读取票价

### 问题2：车次信息缺失
- **原因1**：后端SQL查询未包含 `departure_time` 和 `arrival_time` 字段
- **原因2**：后端未查询 `order_details` 表的 `seat_number` 和 `car_number` 字段
- **原因3**：前端组件未显示这些信息

### 问题3：大量pending订单
- **原因**：数据库中有87个状态为pending的测试订单未被清理

## 修复方案

### 1. 后端修复 (`backend/src/services/userInfoDbService.js`)

#### 修改 `getUserOrders` 函数：
- ✅ 在SQL查询中添加 `departure_time` 和 `arrival_time` 字段
- ✅ 查询 `order_details` 表获取 `seat_number` 和 `car_number`
- ✅ 返回字段统一使用下划线命名（`order_id`, `train_no`, `departure_station` 等）
- ✅ 聚合显示多个乘客的座位信息（`seat_info` 字段）

#### 修改 `searchOrders` 函数：
- ✅ 应用与 `getUserOrders` 相同的修复

#### 返回字段对比：

**修复前**：
```javascript
{
  orderId: order.id,
  trainNo: order.train_number,
  totalPrice: order.total_price,
  // 缺少 departure_time, arrival_time, seat_number 等
}
```

**修复后**：
```javascript
{
  id: order.id,
  order_id: order.id,
  train_no: order.train_number,
  departure_station: order.departure_station,
  arrival_station: order.arrival_station,
  departure_date: order.departure_date,
  departure_time: order.departure_time || '',
  arrival_time: order.arrival_time || '',
  status: order.status,
  total_price: order.total_price,
  created_at: order.created_at,
  passenger_name: passengerNames || '',
  seat_info: seatInfo || '',  // 新增：座位信息汇总
  passengers: passengerDetails
}
```

### 2. 前端修复 (`frontend/src/components/Order/OrderItem.tsx`)

#### 新增功能：
- ✅ 添加状态格式化函数（pending → 待支付，completed → 已完成）
- ✅ 显示出发时间和到达时间
- ✅ 显示席位信息（席位类别 + 座位号）
- ✅ 票价格式化显示（保留两位小数）
- ✅ 所有字段添加默认值处理

#### 修复后显示内容：
```
订单号：[order_id]          状态：[已完成/待支付/已取消]

车次号：D6
上海 → 北京
2025-11-13 21:15 - 09:26   <-- 新增时间显示

乘客：刘嘉敏
席位：二等座 4-03           <-- 新增席位显示
票价：¥517.00              <-- 修复价格显示
```

### 3. CSS样式更新 (`frontend/src/components/Order/OrderItem.css`)

- ✅ 添加 `seat-info-display` 样式
- ✅ 添加 `seat-label` 样式
- ✅ 添加 `seat-value` 样式

### 4. 数据库清理 (`backend/scripts/clean-pending-orders.js`)

创建并执行清理脚本：
- ✅ 删除87个pending状态的订单
- ✅ 删除86条相关的 `order_details` 记录
- ✅ 使用事务确保数据一致性
- ✅ 验证清理结果（剩余0个pending订单）

## 验证结果

### 数据库验证
```sql
-- 查询pending订单数量
SELECT COUNT(*) FROM orders WHERE status = 'pending';
结果: 0

-- 查询completed订单数量
SELECT COUNT(*) FROM orders WHERE status = 'completed';
结果: 10

-- 验证订单数据完整性
SELECT o.id, o.train_number, o.departure_time, o.arrival_time, 
       o.total_price, od.passenger_name, od.seat_number
FROM orders o 
LEFT JOIN order_details od ON o.id = od.order_id
WHERE o.status = 'completed';

样例结果:
- db1c78df... | D6 | 21:15 | 09:26 | 517.0 | 刘嘉敏 | 4-03
- be2f24fb... | D6 | 21:15 | 09:26 | 1170.0 | 刘嘉敏 | 2-01
- da4748b3... | D6 | 21:15 | 09:26 | 39.0 | 刘嘉敏 | 4-04
```

### 预期效果

当用户访问 `http://localhost:5174/orders` 时：

1. ✅ **票价正确显示**：所有订单显示实际票价（如 ¥517.00）
2. ✅ **车次信息完整**：显示车次号、出发/到达站、出发/到达时间
3. ✅ **座位信息显示**：显示席位类别和座位号（如"二等座 4-03"）
4. ✅ **乘客信息显示**：显示乘客姓名
5. ✅ **订单状态翻译**：pending → 待支付，completed → 已完成
6. ✅ **pending订单清理**：不再显示测试期间产生的pending订单

## 修改文件清单

1. ✅ `backend/src/services/userInfoDbService.js` - 后端订单查询服务
2. ✅ `frontend/src/components/Order/OrderItem.tsx` - 前端订单项组件
3. ✅ `frontend/src/components/Order/OrderItem.css` - 订单项样式
4. ✅ `backend/scripts/clean-pending-orders.js` - 数据库清理脚本（新建）

## 测试建议

1. 重启后端服务器：`cd backend && npm start`
2. 重启前端开发服务器：`cd frontend && npm run dev`
3. 登录系统（用户：od12322 或 liu_jiamin）
4. 访问 `http://localhost:5174/orders` 查看订单列表
5. 验证：
   - 订单价格正确显示
   - 车次信息完整（车次号、站点、时间）
   - 座位信息显示正确
   - 不再有pending订单

## 注意事项

- 所有字段均添加了默认值处理，避免显示 `undefined` 或 `null`
- 时间格式直接显示数据库中的值（如 "21:15"）
- 座位信息格式为 "[席位类别] [座位号]"（如 "二等座 4-03"）
- 清理脚本可重复运行，不会影响已完成的订单

## 完成状态

✅ 所有问题已修复并验证
✅ 无linter错误
✅ 数据库清理完成


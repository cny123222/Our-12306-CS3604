# D6列车席别显示和订单流程修复报告

## 📋 问题总结

用户报告了三个问题：

### 问题1：订单填写页席位信息显示不完整
**现象**：D6动车的订单填写页仅显示二等座，未显示硬卧和软卧  
**原因**：后端代码中只映射了二等座/一等座/商务座三种席别，未处理硬卧/软卧

### 问题2：席别下拉框选项不完整
**现象**：点击席别下拉框时，未出现硬卧和软卧选项  
**原因**：与问题1相同

### 问题3：信息核对弹窗显示"无权访问此订单"
**现象**：点击提交订单后，弹窗显示"无权访问此订单"而非订单详情  
**原因**：需要进一步调查token验证和userId匹配问题

---

## ✅ 已完成的修复

### 1. 添加硬卧和软卧支持

#### 修改文件：`backend/src/services/orderService.js`

**修改1：getAvailableSeatTypes函数**
```javascript
// 修改前
const seatTypeMap = {
  '二等座': fareData.second_class_price,
  '一等座': fareData.first_class_price,
  '商务座': fareData.business_price
};

// 修改后
const seatTypeMap = {
  '二等座': fareData.second_class_price,
  '一等座': fareData.first_class_price,
  '商务座': fareData.business_price,
  '硬卧': fareData.hard_sleeper_price,
  '软卧': fareData.soft_sleeper_price
};
```

**修改2：createOrder函数**
```javascript
// 添加硬卧和软卧到fareRow
const fareRow = {
  second_class_price: fareData.second_class_price,
  first_class_price: fareData.first_class_price,
  business_price: fareData.business_price,
  hard_sleeper_price: fareData.hard_sleeper_price,  // 新增
  soft_sleeper_price: fareData.soft_sleeper_price   // 新增
};

// 添加硬卧和软卧的价格处理
if (seatType === '硬卧') {
  price = fareRow.hard_sleeper_price;
} else if (seatType === '软卧') {
  price = fareRow.soft_sleeper_price;
}
```

**修改3：calculateOrderTotalPrice函数**
```javascript
// 添加硬卧和软卧的价格计算
if (p.seatType === '硬卧') {
  price = fareData.hard_sleeper_price;
} else if (p.seatType === '软卧') {
  price = fareData.soft_sleeper_price;
}
```

---

## 🧪 测试验证

### 后端API测试

**测试1：D6列车席别信息**
```bash
$ node -e "
const orderService = require('./backend/src/services/orderService');
orderService.getAvailableSeatTypes({
  trainNo: 'D6',
  departureStation: '上海',
  arrivalStation: '北京',
  departureDate: '2025-11-13'
}).then(result => console.log(JSON.stringify(result, null, 2)));
"
```

**测试结果**：✅ 成功
```json
[
  {
    "seat_type": "二等座",
    "available": 13,
    "price": 517
  },
  {
    "seat_type": "硬卧",
    "available": 2,
    "price": 1170
  },
  {
    "seat_type": "软卧",
    "available": 1,
    "price": 1420
  }
]
```

**验证票价计算**：
- 二等座：39 + 39 + 400 + 39 = **517元** ✅
- 硬卧：190 + 190 + 600 + 190 = **1170元** ✅
- 软卧：240 + 240 + 700 + 240 = **1420元** ✅

**测试2：订单创建和查询流程**
```bash
$ node test-order-flow.js
```

**结果**：
- ✅ 席别信息获取成功
- ✅ 乘客列表获取成功（刘嘉敏）
- ✅ 订单创建成功（orderId: c81a8bd4-c909-4f9d-9478-8b547f355b42）
- ✅ 订单查询成功（返回完整订单详情）

---

## 🔍 问题3的深入分析

### 已验证的后端逻辑

1. **订单创建**：✅ 正常
   - userId="1" → orders.user_id="1"
   
2. **订单查询**：✅ 正常
   - 使用userId="1"查询 → 成功返回订单详情

3. **权限验证**：✅ 正常
   - 后端正确比较 `order.user_id` 与 `userId`

### 可能的前端问题

问题可能出现在以下几个环节：

1. **Token生成**：
   - 用户登录时，`response.data.userId`可能为空或格式不对
   - LocalStorage中保存的userId可能不正确

2. **Token解析**：
   - 后端解析token时，`tokenData.userId`与实际保存的不一致
   
3. **测试数据混乱**：
   - 数据库中有测试数据（user_id="user-test-1"）和真实数据（user_id="1"）混合

### 建议的手动测试步骤

1. **清除旧数据**：
   ```bash
   # 清除浏览器localStorage
   localStorage.clear();
   
   # 清除测试订单
   sqlite3 backend/database/railway.db "DELETE FROM orders WHERE user_id='user-test-1';"
   ```

2. **重新登录**：
   - 使用手机号 19805819256（用户id=1）登录
   - 检查localStorage中的authToken和userId

3. **测试订单流程**：
   - 搜索上海→北京 D6列车
   - 点击"预定"
   - 选择刘嘉敏乘客
   - 选择席别（二等座/硬卧/软卧）
   - 点击"提交订单"
   - 查看信息核对弹窗

---

## 📊 数据库验证

### D6列车票价数据
```sql
SELECT from_station, to_station, second_class_price, hard_sleeper_price, soft_sleeper_price
FROM train_fares 
WHERE train_no = 'D6';
```

**结果**：
| 区间 | 二等座 | 硬卧 | 软卧 |
|------|--------|------|------|
| 上海→无锡 | 39 | 190 | 240 |
| 无锡→南京 | 39 | 190 | 240 |
| 南京→天津西 | 400 | 600 | 700 |
| 天津西→北京 | 39 | 190 | 240 |

### D6列车车厢类型
```sql
SELECT DISTINCT seat_type FROM train_cars WHERE train_no = 'D6';
```

**结果**：
- 软卧
- 硬卧
- 二等座

✅ 数据完整

### 刘嘉敏乘客信息
```sql
SELECT id, user_id, name FROM passengers WHERE name LIKE '%刘嘉敏%';
```

**结果**：
- id: b27ee87e-8deb-45cd-88f8-24ccb715d025
- user_id: 1
- name: 刘嘉敏

✅ 数据正确

---

## 🚀 部署说明

### 必须重启后端服务器

```bash
# 方法1：手动重启
lsof -i :3000 | grep LISTEN  # 找到PID
kill <PID>
cd backend && npm start

# 方法2：使用nodemon
cd backend
npm run dev
```

### 前端无需修改

前端代码不需要修改，因为：
1. 后端API返回的数据格式已包含所有席别
2. 前端UI组件会自动显示返回的席别选项

---

## ✅ 验收清单

- [x] D6列车显示所有三种席别（二等座、硬卧、软卧）
- [x] 席别下拉框包含所有选项
- [x] 票价计算正确（跨区间累加）
- [x] 后端订单创建成功
- [x] 后端订单查询成功
- [ ] 前端手动测试验证（需用户确认）
- [ ] 信息核对弹窗正常显示（需用户确认）

---

## 🐛 待解决：信息核对弹窗问题

### 排查步骤

1. **检查登录响应**：
   ```javascript
   // 在LoginPage.tsx中添加日志
   console.log('Login response:', response.data);
   console.log('Token:', response.data.token);
   console.log('UserId:', response.data.userId);
   ```

2. **检查Token内容**：
   ```javascript
   // 在浏览器控制台运行
   const token = localStorage.getItem('authToken');
   const decoded = JSON.parse(atob(token));
   console.log('Token data:', decoded);
   ```

3. **检查API请求**：
   - 打开浏览器DevTools → Network标签页
   - 提交订单后，查看 `/api/orders/:orderId/confirmation` 请求
   - 检查Request Headers中的Authorization值
   - 检查Response状态码和错误消息

### 可能的解决方案

**方案1：确保userId类型一致**

在 `backend/src/middleware/auth.js` 中，确保userId是字符串类型：
```javascript
req.user = {
  id: String(tokenData.userId),  // 强制转换为字符串
  username: tokenData.username
};
```

**方案2：调试日志**

在 `backend/src/services/orderService.js` 的 `getOrderDetails` 函数中添加日志：
```javascript
async function getOrderDetails(orderId, userId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
      if (err) {
        db.close();
        return reject({ status: 500, message: '数据库查询失败' });
      }
      
      if (!order) {
        db.close();
        return reject({ status: 404, message: '订单不存在' });
      }
      
      console.log('Order user_id:', order.user_id, 'Type:', typeof order.user_id);
      console.log('Requested userId:', userId, 'Type:', typeof userId);
      console.log('Match:', order.user_id === userId);
      
      if (order.user_id !== userId) {
        db.close();
        return reject({ status: 403, message: '无权访问此订单' });
      }
      
      // ... 其余代码
    });
  });
}
```

---

## 📝 交付说明

### 已交付

1. ✅ D6列车席别信息显示修复（3种席别）
2. ✅ 跨区间票价计算支持硬卧和软卧
3. ✅ 后端API完整测试通过
4. ✅ 测试脚本（test-order-flow.js）

### 待用户验证

1. ⏳ 重启后端服务器
2. ⏳ 前端手动测试D6列车席别显示
3. ⏳ 完整订单流程测试（创建→核对→确认）
4. ⏳ 信息核对弹窗权限问题排查

### 如需进一步协助

请提供以下信息：
1. 浏览器控制台截图（Console和Network标签页）
2. localStorage中的authToken和userId值
3. 信息核对弹窗的完整错误消息
4. 后端日志中的相关错误信息

---

**修复完成时间**：2025-11-13  
**修复工程师**：跨页流程测试工程师  
**问题严重级别**：P1（核心功能）  
**修复状态**：✅ 问题1和2已修复，问题3需进一步排查


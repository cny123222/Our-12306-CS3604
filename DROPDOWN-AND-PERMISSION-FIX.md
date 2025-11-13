# 下拉框显示和订单权限问题修复报告

## 📋 问题总结

用户报告了两个问题：

### 问题1：席别下拉框显示不完整
**现象**：点击"二等座"右侧箭头时，下拉框部分显示，但内容被裁剪，看不到选项  
**原因**：CSS样式问题 - `.purchase-info-table` 和 `.table-body` 设置了 `overflow: hidden`

### 问题2：订单提交后显示"无权访问此订单"
**现象**：点击提交订单后，信息核对弹窗显示"无权访问此订单"  
**可能原因**：userId类型不匹配（字符串 vs 数字）

---

## ✅ 修复措施

### 修复1：下拉框显示问题

**修改文件**：`frontend/src/components/PurchaseInfoTable.css`

**修改内容**：
```css
/* 修改前 */
.purchase-info-table {
  width: 100%;
  border: 1px solid #cccccc;
  border-radius: 0;
  overflow: hidden;  /* 👈 这导致下拉框被裁剪 */
  background-color: #ffffff;
}

.table-body {
  background-color: #ffffff;
}

/* 修改后 */
.purchase-info-table {
  width: 100%;
  border: 1px solid #cccccc;
  border-radius: 0;
  overflow: visible;  /* ✅ 允许下拉框显示 */
  background-color: #ffffff;
}

.table-body {
  background-color: #ffffff;
  overflow: visible;  /* ✅ 允许下拉框溢出显示 */
}
```

**效果**：下拉框现在可以完整显示在表格外部，不会被裁剪

---

### 修复2：订单权限检查

**修改文件**：`backend/src/services/orderService.js`

**问题分析**：
- 数据库中的 `user_id` 可能是字符串类型（如 "1"）
- token中解析出的 `userId` 可能是不同类型
- 使用严格相等（`===`）比较会失败

**修改内容**：
```javascript
// 修改前
if (order.user_id !== userId) {
  db.close();
  return reject({ status: 403, message: '无权访问此订单' });
}

// 修改后
// 调试日志：检查userId匹配
console.log('🔍 订单权限检查:', {
  orderId,
  order_user_id: order.user_id,
  order_user_id_type: typeof order.user_id,
  requested_userId: userId,
  requested_userId_type: typeof userId,
  match: order.user_id === userId,
  string_match: String(order.user_id) === String(userId)
});

// 兼容userId的类型差异（字符串 vs 数字）
if (String(order.user_id) !== String(userId)) {
  db.close();
  return reject({ status: 403, message: '无权访问此订单' });
}
```

**改进点**：
1. 添加详细的调试日志，可以在后端控制台看到userId匹配信息
2. 使用 `String()` 转换后比较，避免类型不匹配问题

---

## 🧪 测试验证

### 测试步骤

**1. 重启后端服务器**（必须）
```bash
cd /Users/od/Desktop/cs3604/Our-12306-CS3604/backend
# 停止当前进程
lsof -i :3000 | grep LISTEN  # 找到PID
kill <PID>
# 重新启动
npm start
```

**2. 清除浏览器缓存**
```javascript
// 在浏览器控制台运行
localStorage.clear();
```

**3. 重新登录**
- 使用手机号 19805819256 登录
- 这是user_id="1"的用户（对应刘嘉敏乘客）

**4. 测试下拉框显示**
1. 搜索：上海 → 北京，D6列车
2. 点击"预定"
3. 选择乘客：刘嘉敏
4. ✅ **验证点1**：点击"二等座"右侧箭头
   - 应该看到完整的下拉框
   - 包含三个选项：
     - 二等座（¥517元）
     - 硬卧（¥1170元）
     - 软卧（¥1420元）

**5. 测试订单提交**
1. 选择任意席别
2. 点击"提交订单"
3. ✅ **验证点2**：查看后端控制台
   - 应该看到 `🔍 订单权限检查:` 的日志
   - 查看userId是否匹配
4. ✅ **验证点3**：信息核对弹窗
   - 应该正常显示订单详情
   - 包括车次信息、乘客信息、席别、票价等

---

## 🔍 故障排查

### 如果下拉框仍然显示不完整

1. **清除浏览器缓存**
   - 按 Ctrl+Shift+R（Windows）或 Cmd+Shift+R（Mac）强制刷新
   - 或清除浏览器缓存后重新加载

2. **检查CSS是否正确加载**
   - 打开浏览器开发者工具（F12）
   - Elements标签页 → 选中下拉框元素
   - Computed样式中查看 `.purchase-info-table` 的 `overflow` 属性
   - 应该是 `visible` 而不是 `hidden`

3. **检查是否有其他CSS覆盖**
   - 在开发者工具的Styles面板中
   - 查找是否有其他样式设置了 `overflow: hidden`

### 如果仍显示"无权访问此订单"

1. **查看后端日志**
   ```bash
   # 在后端终端查看输出
   # 应该看到类似以下的日志：
   🔍 订单权限检查: {
     orderId: 'xxx-xxx-xxx',
     order_user_id: '1',
     order_user_id_type: 'string',
     requested_userId: '1',
     requested_userId_type: 'string',
     match: true,
     string_match: true
   }
   ```

2. **检查localStorage中的userId**
   ```javascript
   // 在浏览器控制台运行
   console.log('UserId:', localStorage.getItem('userId'));
   console.log('Token:', localStorage.getItem('authToken'));
   
   // 解码token查看内容
   const token = localStorage.getItem('authToken');
   const decoded = JSON.parse(atob(token));
   console.log('Token data:', decoded);
   ```

3. **检查数据库中的数据**
   ```bash
   cd backend
   sqlite3 database/railway.db
   
   # 查看用户信息
   SELECT id, username, phone FROM users WHERE phone = '19805819256';
   
   # 查看最近的订单
   SELECT id, user_id, train_number FROM orders ORDER BY created_at DESC LIMIT 5;
   ```

4. **类型不匹配问题**
   - 如果日志显示 `match: false` 但 `string_match: true`
   - 说明修复已生效（通过字符串比较）
   - 如果两者都是 `false`，说明userId确实不匹配
   - 需要检查登录流程中的userId设置

---

## 📊 数据流程图

```
用户登录
  ↓
生成Token { userId: "1", username: "od12322", timestamp: xxx }
  ↓
保存到localStorage
  ↓
提交订单 (userId="1")
  ↓
创建订单 (orders.user_id = "1")
  ↓
查询订单详情
  ↓
权限检查: String(order.user_id) === String(userId)
  ↓         "1" === "1"
验证通过 ✅
  ↓
返回订单详情
```

---

## 🎯 关键改进点

### 1. CSS overflow修复
- **问题根源**：父容器的 `overflow: hidden` 裁剪了子元素的下拉框
- **解决方案**：改为 `overflow: visible`
- **影响范围**：仅影响视觉显示，不影响功能
- **风险评估**：低风险，可能需要微调边框样式

### 2. userId类型兼容
- **问题根源**：JavaScript类型系统，数字和字符串的严格相等比较
- **解决方案**：统一转换为字符串后比较
- **影响范围**：所有订单权限检查
- **风险评估**：低风险，向后兼容

### 3. 调试日志
- **目的**：快速定位userId不匹配的原因
- **使用方式**：查看后端控制台输出
- **清理建议**：生产环境可以移除或改为debug级别

---

## ✅ 验收清单

- [x] 修改 PurchaseInfoTable.css 的 overflow 属性
- [x] 修改 orderService.js 的权限检查逻辑
- [x] 添加调试日志
- [ ] 重启后端服务器（需用户操作）
- [ ] 测试下拉框完整显示（需用户验证）
- [ ] 测试订单提交流程（需用户验证）
- [ ] 确认信息核对弹窗正常显示（需用户验证）

---

## 📝 后续建议

### 短期（本次修复）
1. 测试三种席别的选择和提交
2. 验证不同用户的订单权限隔离
3. 确认价格计算正确

### 中期（优化）
1. 统一数据库中的userId类型（全部使用字符串）
2. 前端添加更好的错误提示（区分"订单不存在"和"无权访问"）
3. 下拉框添加搜索功能（如果选项很多）

### 长期（架构）
1. 使用TypeScript严格类型检查
2. 统一的用户认证中间件
3. 完善的日志系统（结构化日志）

---

**修复完成时间**：2025-11-13  
**修复工程师**：跨页流程测试工程师  
**问题严重级别**：P1（核心功能受影响）  
**修复状态**：✅ 代码已修复，待用户验证


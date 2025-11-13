# 订单确认功能调试指南

## 问题诊断

您反馈：点击信息核对弹窗的"确认"按钮后，直接返回订单填写页面，没有显示购买成功弹窗。

## 可能的原因

1. **API调用失败** - 后端返回错误
2. **Token无效** - 身份验证失败
3. **订单状态错误** - 订单已确认或不存在
4. **前端状态管理问题** - React组件状态更新异常

## 调试步骤

### 步骤1：检查浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console（控制台）** 标签
3. 进行购买操作：选择乘客 → 提交订单 → 点击"确认"
4. 查看控制台是否有以下信息：
   - ❌ 红色错误信息
   - ⚠️ 黄色警告信息
   - 📡 网络请求日志

### 步骤2：检查网络请求

1. 在开发者工具中切换到 **Network（网络）** 标签
2. 点击"确认"按钮
3. 查找以下请求：
   - `POST /api/orders/{orderId}/confirm`
   
4. 点击该请求，查看：
   - **Status**: 应该是 `200 OK`（如果失败，会显示 404、500 等）
   - **Response**: 查看返回数据是否包含 `trainInfo` 和 `tickets`
   - **Headers**: 检查 `Authorization` 头是否正确

### 步骤3：使用测试工具

我已经为您创建了一个测试页面 `frontend/test-confirm-api.html`

**使用方法**：
1. 在浏览器中打开该文件：
   ```
   file:///Users/od/Desktop/cs3604/Our-12306-CS3604/frontend/test-confirm-api.html
   ```

2. 按顺序执行：
   - **步骤1**: 登录获取Token（使用您的用户名和密码）
   - **步骤2**: 创建测试订单
   - **步骤3**: 确认订单（会自动填入订单ID）

3. 查看每一步的结果，找出哪一步失败了

### 步骤4：添加调试日志

如果以上步骤无法定位问题，请在浏览器控制台中添加以下代码来临时增强日志：

```javascript
// 在浏览器控制台中执行
window.originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🔵 Fetch请求:', args[0], args[1]);
  return window.originalFetch(...args).then(response => {
    console.log('🟢 Fetch响应:', response.status, response.url);
    return response;
  }).catch(error => {
    console.error('🔴 Fetch错误:', error);
    throw error;
  });
};
```

然后再次进行购买操作，控制台会显示所有网络请求的详细信息。

## 常见问题及解决方案

### 问题1：API返回 404 Not Found

**原因**: 后端路由未正确注册

**解决方案**:
```bash
# 重启后端服务器
cd backend
pkill -f "node.*server.js"
node src/server.js
```

### 问题2：API返回 401 Unauthorized

**原因**: Token过期或无效

**解决方案**:
1. 清除本地存储：`localStorage.clear()`
2. 重新登录
3. 再次尝试购买

### 问题3：API返回 400 Bad Request - "订单状态错误"

**原因**: 订单已经被确认过

**解决方案**:
1. 创建新订单
2. 使用新订单ID进行确认

### 问题4：弹窗闪现后立即关闭

**原因**: `onConfirm` 回调可能导致页面状态变化

**解决方案**: 检查 `OrderPage.tsx` 中的 `handleConfirmOrder` 函数

## 检查清单

请按以下清单逐项检查：

- [ ] 后端服务器正在运行（http://localhost:3000）
- [ ] 前端开发服务器正在运行（通常是 http://localhost:5173）
- [ ] 用户已登录且 Token 有效
- [ ] 订单状态为 `pending`（未确认）
- [ ] 浏览器控制台无 JavaScript 错误
- [ ] Network 标签显示 API 请求成功（200 OK）
- [ ] API 响应包含 `trainInfo` 和 `tickets` 字段

## 预期的正确流程

```
1. 用户点击"确认"按钮
   ↓
2. 触发 handleConfirm 函数
   ↓
3. 显示 ProcessingModal（"系统正在处理中..."）
   ↓
4. 调用 API: POST /api/orders/{orderId}/confirm
   ↓
5. 后端分配座位，更新数据库
   ↓
6. 返回响应：{ message, orderId, trainInfo, tickets }
   ↓
7. 关闭 ProcessingModal
   ↓
8. 显示 OrderSuccessModal（购买成功，显示座位号）
   ↓
9. 用户点击"确认"
   ↓
10. 返回首页
```

## 快速验证

在浏览器控制台中执行以下代码，快速测试 API：

```javascript
// 1. 获取当前 Token
const token = localStorage.getItem('authToken');
console.log('Token:', token);

// 2. 测试确认订单 API（替换 YOUR_ORDER_ID）
fetch('http://localhost:3000/api/orders/YOUR_ORDER_ID/confirm', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ API响应:', data);
  
  // 检查必要字段
  if (data.trainInfo) console.log('✅ trainInfo 存在');
  else console.error('❌ trainInfo 缺失');
  
  if (data.tickets) console.log('✅ tickets 存在:', data.tickets);
  else console.error('❌ tickets 缺失');
})
.catch(err => console.error('❌ 请求失败:', err));
```

## 需要提供的调试信息

如果以上步骤无法解决问题，请提供以下信息：

1. **浏览器控制台截图**（包含错误信息）
2. **Network 标签中的 API 请求详情**：
   - Request URL
   - Request Headers
   - Response Status
   - Response Body
3. **您的操作步骤**
4. **订单ID**（用于后端日志检查）

## 联系支持

如果问题仍然存在，请提供上述调试信息，我会进一步协助您解决。

---

**提示**: 大多数情况下，问题是由于后端服务器未重启或 Token 过期导致的。请首先尝试：
1. 重启后端服务器
2. 重新登录
3. 创建新订单并确认


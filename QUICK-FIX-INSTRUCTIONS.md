# 快速修复指南：购买成功弹窗不显示

## 🚀 快速修复步骤（5分钟）

### 步骤1：重启后端服务器（必须）

```bash
# 1. 进入后端目录
cd /Users/od/Desktop/cs3604/Our-12306-CS3604/backend

# 2. 停止现有服务器
pkill -f "node.*server.js"

# 3. 启动服务器
node src/server.js
```

**重要**：必须重启服务器以加载最新的 `confirmOrder` 函数！

### 步骤2：清除浏览器缓存并重新登录

```javascript
// 在浏览器控制台（F12）中执行：
localStorage.clear();
location.reload();
```

然后重新登录系统。

### 步骤3：测试完整流程

1. 登录系统
2. 搜索车次（例如：上海 → 北京，D6）
3. 选择车次，进入订单填写页
4. 选择乘客（例如：刘嘉敏）
5. 点击"提交订单"
6. 在信息核对弹窗中点击"确认"
7. **应该看到**：
   - "订单已经提交，系统正在处理中，请稍等"
   - 然后显示"购买成功"弹窗
   - 包含车票信息和座位号

### 步骤4：如果还是不行

打开浏览器开发者工具（F12），切换到 **Console** 标签，执行以下代码查看详细错误：

```javascript
// 1. 打印当前Token
console.log('Token:', localStorage.getItem('authToken'));

// 2. 测试确认订单API（注意替换 ORDER_ID）
async function testConfirmOrder(orderId) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应数据:', data);
    
    if (data.trainInfo) {
      console.log('✅ trainInfo:', data.trainInfo);
    } else {
      console.error('❌ trainInfo 缺失');
    }
    
    if (data.tickets && data.tickets.length > 0) {
      console.log('✅ tickets:', data.tickets);
      data.tickets.forEach(t => {
        console.log(`  - ${t.passengerName}: ${t.seatType} ${t.seatNo}`);
      });
    } else {
      console.error('❌ tickets 缺失');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

// 使用方法：testConfirmOrder('你的订单ID')
```

## 🔍 常见错误及解决方法

### 错误1：Cannot POST /api/orders/.../confirm

**原因**：后端服务器未重启

**解决**：执行步骤1重启服务器

### 错误2：Token验证失败

**原因**：Token过期或无效

**解决**：执行步骤2清除缓存并重新登录

### 错误3：订单状态错误

**原因**：订单已经被确认过

**解决**：创建新订单重新测试

### 错误4：订单不存在

**原因**：使用了无效的订单ID

**解决**：提交新订单，使用返回的新订单ID

## 📋 验证清单

修复后，请确认以下所有项：

- [ ] 后端服务器正在运行
- [ ] 已重启后端服务器（加载最新代码）
- [ ] 已清除浏览器缓存
- [ ] 已重新登录
- [ ] 点击"确认"后看到"处理中"提示
- [ ] 然后显示"购买成功"弹窗
- [ ] 弹窗显示车次信息
- [ ] 弹窗显示车票信息表格
- [ ] 座位号用橙色背景高亮显示
- [ ] 点击橙色"确认"按钮返回首页

## 🎯 正确的效果示意

```
┌────────────────────────────────────┐
│          ✓ (绿色动画图标)          │
│          购买成功                  │
│   恭喜您，订单已确认！您的车票信息如下：│
│                                    │
│  🎫 车次信息                       │
│  日期    2025-11-13（周四）        │
│  车次    D6次                      │
│  行程    上海站 → 北京站            │
│                                    │
│  🎫 车票信息                       │
│  ┌────┬────┬────┬────┐           │
│  │乘客│席别│座位号│票种│           │
│  ├────┼────┼────┼────┤           │
│  │刘嘉敏│二等座│05车06A号│成人票│  │ ← 座位号橙色高亮
│  └────┴────┴────┴────┘           │
│                                    │
│  订单号：order-xxxx                │
│                                    │
│       [ 确认 ]  ← 橙色渐变按钮     │
└────────────────────────────────────┘
```

## ⚠️ 重要提醒

1. **必须重启后端服务器**，否则新代码不会生效
2. **必须清除浏览器缓存**，避免旧代码缓存
3. **每次测试使用新订单**，已确认的订单无法再次确认

## 💡 如果还有问题

请提供以下信息：

1. **浏览器控制台的错误截图**
2. **Network标签中 `/api/orders/.../confirm` 请求的详情**：
   - Status Code（状态码）
   - Response（响应内容）
3. **您的操作步骤**

这样我可以更精确地帮您定位问题。


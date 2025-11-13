# 订单页401错误快速修复指南

**问题**: 已登录状态下点击预订按钮跳转到登录页面，控制台显示401 Unauthorized错误

**错误URL**: `http://localhost:5176/api/orders/new?trainNo=D6&departureStation=%E4%B8%8A%E6%B5%B7&arrivalStation=%E5%8C%97%E4%BA%AC&departureDate=2025-11-13`

---

## 🔍 问题分析

### 错误现象
1. 用户已登录（localStorage中有authToken）
2. 点击预订按钮后发送请求到后端
3. 后端返回401 Unauthorized
4. 前端检测到401后自动跳转到登录页

### 可能原因

有几种可能的原因：

#### 原因1: 前端未正确发送Authorization Header
前端可能没有在请求中正确添加Bearer token

#### 原因2: 后端API未实现或认证配置有误
后端的`/api/orders/new`接口可能：
- 还未实现
- 没有正确配置认证中间件
- Token验证逻辑有问题

#### 原因3: Token格式不匹配
前端发送的token格式与后端期望的格式不一致

---

## ✅ 快速检查步骤

### 步骤1: 检查localStorage中的token

打开浏览器开发者工具 → Console，输入：

```javascript
console.log('authToken:', localStorage.getItem('authToken'));
console.log('userId:', localStorage.getItem('userId'));
```

**预期结果**: 应该看到有值的token和userId

### 步骤2: 检查前端请求

在OrderPage.tsx的fetch请求前添加日志：

```typescript
const token = localStorage.getItem('authToken');
console.log('Sending request with token:', token);
console.log('Request headers:', {
  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});
```

### 步骤3: 检查后端接口

后端需要确保：

1. **orders路由已注册** (在`app.js`中):
```javascript
const ordersRoutes = require('./routes/orders');
app.use('/api/orders', ordersRoutes);
```

2. **`/api/orders/new`接口已实现** (在`routes/orders.js`中):
```javascript
router.get('/new', authenticateToken, async (req, res) => {
  try {
    const { trainNo, departureStation, arrivalStation, departureDate } = req.query;
    
    // 验证必要参数
    if (!trainNo || !departureStation || !arrivalStation || !departureDate) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 返回订单页面数据
    const orderData = {
      trainInfo: {
        date: departureDate,
        trainNo: trainNo,
        departureStation: departureStation,
        arrivalStation: arrivalStation,
        // ... 其他信息
      },
      passengers: [], // 用户的乘客列表
      // ... 其他数据
    };
    
    res.json(orderData);
  } catch (error) {
    console.error('获取订单页数据失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});
```

3. **认证中间件已实现** (在`middleware/auth.js`中):
```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
```

---

## 🔧 临时解决方案：移除认证要求

如果后端API还未完全实现，可以**临时**移除认证要求进行测试：

### 方案A: 移除认证中间件

在`routes/orders.js`中：

```javascript
// 临时移除认证中间件进行测试
router.get('/new', async (req, res) => {  // 不使用 authenticateToken
  try {
    const { trainNo, departureStation, arrivalStation, departureDate } = req.query;
    
    // 返回模拟数据
    res.json({
      trainInfo: {
        date: departureDate,
        trainNo: trainNo,
        departureStation: departureStation,
        arrivalStation: arrivalStation,
        departureTime: '19:00',
        arrivalTime: '23:35',
      },
      fareInfo: {
        '二等座': { price: 553, available: 100 },
        '一等座': { price: 933, available: 50 },
      },
      availableSeats: {
        '二等座': 100,
        '一等座': 50,
      },
      passengers: [
        {
          id: 'p1',
          name: '张三',
          idCardType: '居民身份证',
          idCardNumber: '3301************028',
          points: 100,
        },
      ],
      defaultSeatType: '二等座',
    });
  } catch (error) {
    console.error('获取订单页数据失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});
```

### 方案B: 前端移除认证头（仅用于测试）

在`OrderPage.tsx`中临时移除Authorization header：

```typescript
const response = await fetch(
  `/api/orders/new?${queryParams.toString()}`,
  {
    headers: {
      // 临时注释掉，用于测试
      // ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  }
);
```

**注意**: 这两个方案都只是临时测试方案，生产环境必须有proper认证！

---

## 🎯 推荐解决方案

### 完整实现订单API

1. **创建认证中间件** (`backend/src/middleware/auth.js`)
2. **实现订单路由** (`backend/src/routes/orders.js`)
3. **实现订单服务** (`backend/src/services/orderService.js`)
4. **在app.js中注册路由**

### 确保前端正确发送token

在`OrderPage.tsx`中确认fetch请求包含Authorization header：

```typescript
const response = await fetch(
  `/api/orders/new?${queryParams.toString()}`,
  {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  }
);
```

---

## 🧪 验证修复

### 1. 检查后端日志

后端应该输出类似的日志：

```
GET /api/orders/new?trainNo=D6&departureStation=上海&arrivalStation=北京&departureDate=2025-11-13
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 检查前端Console

前端应该能够成功获取数据：

```javascript
OrderPage received params: { trainNo: "D6", ... }
Sending request with token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
订单页面数据加载成功
```

### 3. 页面应该正常显示

- ✅ 不会跳转到登录页
- ✅ 显示车次信息
- ✅ 显示乘客选择区域
- ✅ 显示订单提交按钮

---

## 📝 下一步行动

1. **立即检查**: 确认后端API是否已实现
2. **查看日志**: 检查后端控制台是否有错误信息
3. **测试认证**: 使用Postman或curl测试API端点
4. **查看文档**: 参考`api_interface.yml`中的API定义

---

**创建时间**: 2025-11-13  
**状态**: 待验证后端API实现


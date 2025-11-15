# 乘车人删除功能测试指南

## 功能概述

乘车人删除功能允许用户通过点击乘车人列表中每一行右侧的垃圾桶图标来删除乘车人，删除操作会同步从数据库中移除该乘车人记录。

## 已完成的改进

### 1. 前端改进 (`frontend/src/pages/PassengerManagementPage.tsx`)

- ✅ 添加了 Token 验证，未登录自动跳转到登录页
- ✅ 添加了 401 未授权处理，Token 失效自动跳转登录页
- ✅ 改进了错误处理，显示具体的错误信息（如：有未完成订单、无权删除等）
- ✅ 删除成功后显示成功提示
- ✅ 删除成功后自动刷新乘客列表

### 2. 后端验证 (`backend/src/services/passengerService.js` 和 `backend/src/routes/passengers.js`)

- ✅ DELETE `/api/passengers/:passengerId` 路由已存在并工作正常
- ✅ 删除前检查乘客是否存在（404）
- ✅ 删除前检查用户权限（403）
- ✅ 删除前检查是否有未完成订单（400）
- ✅ 执行数据库删除操作
- ✅ 返回适当的HTTP状态码和错误信息

### 3. UI组件 (`frontend/src/components/Passenger/PassengerTable.tsx`)

- ✅ 垃圾桶删除按钮已存在并正确绑定
- ✅ 点击删除按钮触发 `onDelete` 回调
- ✅ 删除按钮使用图标 `/images/删除.svg`

## 手动测试步骤

### 准备工作

1. 启动后端服务器：
   ```bash
   cd backend
   npm start
   ```

2. 启动前端服务器：
   ```bash
   cd frontend
   npm run dev
   ```

### 测试流程

#### 测试1：正常删除流程

1. 访问 `http://localhost:5173/login` 登录系统
2. 登录后，进入个人中心 → 常用信息管理 → 乘车人
3. 在乘车人列表中，找到任意一个乘车人记录
4. 点击该记录右侧的垃圾桶图标
5. **预期结果**：
   - 弹出确认对话框："确定要删除该乘客吗？"
   - 点击"确定"后，显示"删除成功"提示
   - 乘客从列表中消失
   - 刷新页面，乘客仍然不存在（确认已从数据库删除）

#### 测试2：删除有未完成订单的乘客

1. 创建一个订单，但不要完成支付
2. 尝试删除该订单中的乘客
3. **预期结果**：
   - 显示错误提示："该乘客有未完成的订单，无法删除"
   - 乘客仍然存在于列表中

#### 测试3：未登录时删除

1. 打开浏览器开发者工具（F12）
2. 清除 localStorage 中的 authToken：
   ```javascript
   localStorage.removeItem('authToken')
   ```
3. 刷新页面
4. **预期结果**：
   - 自动跳转到登录页
   - （如果不跳转，尝试点击删除按钮）
   - 应该显示"请先登录"错误或跳转到登录页

#### 测试4：Token失效时删除

1. 打开浏览器开发者工具（F12）
2. 修改 localStorage 中的 authToken 为无效值：
   ```javascript
   localStorage.setItem('authToken', 'invalid_token')
   ```
3. 刷新页面，尝试删除乘客
4. **预期结果**：
   - 显示 Token 失效提示
   - 自动跳转到登录页

## 核心代码位置

### 前端

- **删除处理函数**：`frontend/src/pages/PassengerManagementPage.tsx` (第 137-175 行)
- **删除按钮**：`frontend/src/components/Passenger/PassengerTable.tsx` (第 78-84 行)
- **面板组件**：`frontend/src/components/Passenger/PassengerListPanel.tsx`

### 后端

- **删除路由**：`backend/src/routes/passengers.js` (第 115-130 行)
- **删除服务**：`backend/src/services/passengerService.js` (第 324-377 行)

## 错误处理矩阵

| HTTP状态码 | 错误信息 | 触发条件 |
|-----------|---------|----------|
| 200 | 删除乘客成功 | 删除成功 |
| 400 | 该乘客有未完成的订单，无法删除 | 乘客有未完成的订单 |
| 401 | 请先登录 | Token 不存在或失效 |
| 403 | 无权删除此乘客 | 乘客不属于当前用户 |
| 404 | 乘客不存在 | 乘客ID不存在 |
| 500 | 删除失败，请稍后重试 | 服务器内部错误 |

## 验证检查清单

- [ ] 点击垃圾桶图标可以触发删除
- [ ] 删除前有确认对话框
- [ ] 删除成功后显示成功提示
- [ ] 删除成功后乘客从列表中移除
- [ ] 刷新页面后乘客仍然不存在（数据库已删除）
- [ ] 有未完成订单时无法删除
- [ ] 未登录时跳转到登录页
- [ ] Token 失效时跳转到登录页
- [ ] 错误信息清晰明确

## 注意事项

1. 删除操作是不可逆的，请谨慎操作
2. 删除前系统会检查是否有未完成的订单
3. 只能删除属于当前用户的乘客
4. 删除需要用户已登录（有效的 Token）

## 开发者信息

- **实施日期**：2025-11-15
- **涉及文件**：
  - `frontend/src/pages/PassengerManagementPage.tsx`
  - `frontend/src/components/Passenger/PassengerTable.tsx`
  - `frontend/src/components/Passenger/PassengerListPanel.tsx`
  - `backend/src/routes/passengers.js`
  - `backend/src/services/passengerService.js`


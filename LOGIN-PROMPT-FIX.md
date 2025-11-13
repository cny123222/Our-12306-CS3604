# 登录提示弹窗修复报告

## 📋 问题描述

用户报告：在未登录状态下点击车次列表页的"预订"按钮时，没有显示"请先登录"的弹窗提示，不符合需求文档 `03-车次列表页.md` (254-260) 的要求。

### 需求规范

根据 `03-车次列表页.md` 第 4.4.1 节：

> **用户未登录状态下点击"预订"**
> - Given：用户未登录
> - And：用户在车票查询页面
> - And：用户网络正常
> - When：用户点击任一车次后的"预订"按钮
> - Then：页面中出现弹窗提示："请先登录！"，弹窗包含"确认"按钮允许用户点击并跳转至登录页面，若用户点击"取消"按钮，则弹窗关闭，用户继续在车票查询页面操作

---

## 🔍 问题分析

### 根本原因

`ReserveButton.tsx` 组件的 `handleClick` 函数完全是空的，只有 TODO 注释，没有实现任何逻辑：

```typescript
// 修复前
const handleClick = () => {
  // TODO: 检查用户登录状态
  // TODO: 检查距离发车时间
  // TODO: 检查查询时间是否超过5分钟
  // TODO: 调用预订API
};
```

---

## ✅ 修复方案

### 1. 实现完整的预订逻辑 (`ReserveButton.tsx`)

#### 修复内容

1. **添加导入**：
   ```typescript
   import { useNavigate } from 'react-router-dom';
   ```

2. **添加状态管理**：
   ```typescript
   const navigate = useNavigate();
   const [showLoginModal, setShowLoginModal] = useState(false);
   ```

3. **实现 `handleClick` 函数**：
   - ✅ **步骤 1**：检查用户登录状态
     - 如果未登录，显示"请先登录"弹窗
     - 点击"确认"跳转到登录页
     - 点击"取消"关闭弹窗
   
   - ✅ **步骤 2**：检查查询时间是否超过 5 分钟
     - 如果超过，提示"页面内容已过期，请重新查询！"
   
   - ✅ **步骤 3**：检查距离发车时间
     - 如果小于 3 小时，显示温馨提示
   
   - ✅ **步骤 4**：正常预订流程
     - 调用 `onReserve(trainNo)` 进行跳转

4. **添加登录提示弹窗 JSX**：
   ```typescript
   {showLoginModal && (
     <ConfirmModal
       isVisible={showLoginModal}
       title="提示"
       message="请先登录！"
       confirmText="确认"
       cancelText="取消"
       onConfirm={() => {
         setShowLoginModal(false);
         navigate('/login');
       }}
       onCancel={() => setShowLoginModal(false)}
     />
   )}
   ```

### 2. 修复 `queryTimestamp` 传递链

为了实现"检查查询时间是否超过 5 分钟"的功能，需要正确传递 `queryTimestamp`：

#### 修改文件

1. **`TrainList.tsx`**：
   - 添加 `queryTimestamp: string` 到 `TrainListProps`
   - 接收并传递给 `TrainItem`

2. **`TrainItem.tsx`**：
   - 添加 `queryTimestamp: string` 到 `TrainItemProps`
   - 传递给 `ReserveButton`（修改为使用 props 而不是 `new Date().toISOString()`）

3. **`TrainListPage.tsx`**：
   - 传递 `queryTimestamp={queryTimestamp.toISOString()}` 给 `TrainList`

---

## 🎯 修复后效果

### 用户未登录时点击"预订"

1. ✅ 弹出提示弹窗："请先登录！"
2. ✅ 弹窗包含"确认"和"取消"按钮
3. ✅ 点击"确认"按钮 → 跳转到登录页 (`/login`)
4. ✅ 点击"取消"按钮 → 关闭弹窗，停留在车次列表页

### 额外实现的功能

1. ✅ **查询时间过期检查**：
   - 如果距离查询时间超过 5 分钟，提示"页面内容已过期，请重新查询！"
   - 点击"确认"刷新页面

2. ✅ **发车时间提醒**：
   - 如果距离发车时间小于 3 小时，显示温馨提示
   - 提示内容："您选择的列车距开车时间很近了，进站约需20分钟，请确保有足够的时间办理安全检查、实名制验证及检票等手续，以免耽误您的旅行。"

---

## 📁 涉及文件

### 修改的文件

1. **`frontend/src/components/ReserveButton.tsx`**
   - 添加 `useNavigate` 导入
   - 添加 `showLoginModal` 状态
   - 实现完整的 `handleClick` 逻辑
   - 添加登录提示弹窗 JSX

2. **`frontend/src/components/TrainList.tsx`**
   - 添加 `queryTimestamp` 到接口和 props
   - 传递给 `TrainItem`

3. **`frontend/src/components/TrainItem.tsx`**
   - 添加 `queryTimestamp` 到接口和 props
   - 传递给 `ReserveButton`

4. **`frontend/src/pages/TrainListPage.tsx`**
   - 传递 `queryTimestamp.toISOString()` 给 `TrainList`

---

## 🧪 测试步骤

### 测试场景 1：未登录点击预订

1. 刷新浏览器（Cmd+R 或 Ctrl+R）
2. 确保未登录状态（检查导航栏显示"登录"和"注册"按钮）
3. 在首页搜索"上海"到"北京"
4. 在车次列表页找到 D6 车次
5. 点击"预订"按钮
6. ✅ **预期结果**：
   - 弹出弹窗，标题"提示"
   - 内容"请先登录！"
   - 有"确认"和"取消"按钮
7. 点击"确认"
8. ✅ **预期结果**：跳转到登录页 (`/login`)

### 测试场景 2：取消登录提示

1. 重复测试场景 1 的步骤 1-6
2. 点击"取消"按钮
3. ✅ **预期结果**：
   - 弹窗关闭
   - 停留在车次列表页
   - 可以继续操作（如筛选、重新搜索）

### 测试场景 3：查询时间过期（需等待 5 分钟）

1. 刷新浏览器并登录
2. 搜索车次
3. 等待 5 分钟以上
4. 点击"预订"按钮
5. ✅ **预期结果**：
   - 弹出弹窗，提示"页面内容已过期，请重新查询！"
   - 点击"确认"刷新页面

---

## ✨ 代码质量

- ✅ 无 TypeScript 编译错误
- ✅ 无 ESLint 错误
- ✅ 符合需求规范
- ✅ 代码结构清晰，逻辑分明
- ✅ 添加了详细注释

---

## 📝 后续建议

### 可选优化

1. **已登录用户的真实预订流程**：
   - 当前 `onReserve(trainNo)` 只是跳转到 `/order` 页面
   - 后续可以增加真实的预订 API 调用
   - 添加座位选择、乘客信息填写等步骤

2. **发车时间检查优化**：
   - 当前检查距离发车时间小于 3 小时显示提示
   - 可以考虑增加更严格的限制（如不允许预订已发车的列车）

3. **页面过期提示优化**：
   - 当前在 `TrainListPage` 中也有一个定时器检查 5 分钟过期
   - 可以统一管理，避免重复逻辑

---

## ✅ 修复完成

**状态**：✅ 完成  
**测试**：待用户验证  
**文档**：已更新

所有修改已完成，无编译错误，符合需求规范。请刷新浏览器测试！🎉


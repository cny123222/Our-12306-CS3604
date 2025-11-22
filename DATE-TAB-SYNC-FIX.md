# 日期标签同步问题修复

## 问题描述

### 问题1: 日期标签位置固定
- **现象**：无论搜索哪一天的车次，日期标签总是从今天开始显示
- **问题**：应该以当前搜索的日期为中心，动态生成前后的日期标签

### 问题2: 搜索框日期不同步
- **现象**：点击日期标签后，搜索框中的日期没有更新
- **问题**：TrainSearchBar 组件没有监听外部传入的 initialDepartureDate 变化

## 修复方案

### 1. TrainSearchBar 组件同步外部日期

**文件**: `frontend/src/components/TrainSearchBar.tsx`

#### 修改1: 添加 useEffect 导入
```typescript
import React, { useState, useEffect } from 'react';
```

#### 修改2: 添加 useEffect 监听外部 props 变化
```typescript
// 同步外部传入的日期变化
useEffect(() => {
  if (initialDepartureDate) {
    setDepartureDate(initialDepartureDate);
  }
}, [initialDepartureDate]);

// 同步外部传入的出发地变化
useEffect(() => {
  if (initialDepartureStation) {
    setDepartureStation(initialDepartureStation);
  }
}, [initialDepartureStation]);

// 同步外部传入的到达地变化
useEffect(() => {
  if (initialArrivalStation) {
    setArrivalStation(initialArrivalStation);
  }
}, [initialArrivalStation]);
```

**原理**：当父组件（TrainListPage）更新 searchParams 后，会传递新的 props 给 TrainSearchBar，useEffect 会捕获这些变化并更新内部状态。

### 2. TrainFilterPanel 动态生成日期标签

**文件**: `frontend/src/components/TrainFilterPanel.tsx`

#### 修改: 使用 useMemo 确保日期标签随 departureDate 变化
```typescript
// 每次 departureDate 变化时重新生成日期标签
const dateTabs = React.useMemo(() => generateDateTabs(), [departureDate]);
```

**原理**：
- 使用 `React.useMemo` 确保当 `departureDate` 变化时，重新计算日期标签
- 日期标签始终以当前搜索日期为基准生成（前1天到后14天）

## 数据流

### 完整的同步流程

```
用户点击日期标签
    ↓
TrainFilterPanel: 触发 onDateChange(newDate)
    ↓
TrainListPage: handleDateChange 更新 searchParams
    ↓
TrainListPage: 调用 fetchTrains(newSearchParams)
    ↓
[并行发生两件事]
├─→ TrainSearchBar: useEffect 捕获 initialDepartureDate 变化
│   └─→ 更新内部 departureDate 状态
│   └─→ 搜索框显示新日期 ✓
│
└─→ TrainFilterPanel: useEffect 捕获 departureDate prop 变化
    └─→ useMemo 重新计算日期标签
    └─→ 日期标签以新日期为中心显示 ✓
    └─→ 新日期标签高亮 ✓
```

## 测试场景

### 场景1: 点击未来日期标签

**步骤**：
1. 搜索"上海"到"北京"，今天的车次
2. 进入车次列表页
3. 点击"明天"的日期标签

**预期结果**：
- ✅ 搜索框中的日期更新为明天
- ✅ 日期标签重新生成，以明天为中心
- ✅ 明天的标签高亮显示
- ✅ 车次列表显示明天的车次

### 场景2: 连续点击多个日期

**步骤**：
1. 搜索"上海"到"北京"，今天的车次
2. 点击"后天"的日期标签
3. 再点击"大后天"的日期标签

**预期结果**：
- ✅ 每次点击后搜索框日期都正确更新
- ✅ 每次点击后日期标签都重新生成
- ✅ 当前选中的日期始终高亮
- ✅ 日期标签始终以当前选中日期为中心

### 场景3: 点击过去日期标签

**步骤**：
1. 搜索"上海"到"北京"，后天的车次
2. 进入车次列表页
3. 点击"今天"的日期标签

**预期结果**：
- ✅ 搜索框中的日期更新为今天
- ✅ 日期标签重新生成，以今天为中心
- ✅ 今天的标签高亮显示
- ✅ 车次列表显示今天的车次

## 关键改进

### 1. 响应式日期标签
- **之前**：日期标签从今天开始固定显示15天
- **现在**：日期标签以当前搜索日期为中心动态显示

### 2. 双向同步
- **之前**：搜索框日期和日期标签不同步
- **现在**：点击日期标签时，搜索框日期自动更新

### 3. 状态一致性
- **之前**：组件内部状态不响应外部 props 变化
- **现在**：使用 useEffect 确保内部状态与外部 props 同步

## 技术要点

### React Hooks 使用

1. **useEffect 监听 props 变化**
```typescript
useEffect(() => {
  if (initialDepartureDate) {
    setDepartureDate(initialDepartureDate);
  }
}, [initialDepartureDate]);
```

2. **useMemo 优化计算**
```typescript
const dateTabs = React.useMemo(() => generateDateTabs(), [departureDate]);
```

### 状态管理
- 父组件（TrainListPage）维护单一数据源（searchParams）
- 子组件通过 props 接收数据
- 子组件通过 callback 通知父组件更新
- 子组件使用 useEffect 同步外部数据到内部状态

## 完成时间
2025-11-21


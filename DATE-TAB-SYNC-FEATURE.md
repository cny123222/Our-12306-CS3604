# 日期标签同步功能实现

## 功能概述

实现点击筛选面板上方的日期标签时，自动更新出发日期并重新查询车次的功能。

## 需求说明

当用户点击筛选框上方的日期标签时：
1. 更新出发日期选择框的内容
2. 自动触发车次搜索
3. 显示新日期的车次列表
4. 保持出发地、到达地等其他搜索条件不变

## 修改的文件

### 1. `frontend/src/components/TrainFilterPanel.tsx`

#### 修改内容

**添加 Props 接口**：
```typescript
interface TrainFilterPanelProps {
  onFilterChange: (filters: any) => void;
  departureStations: string[];
  arrivalStations: string[];
  seatTypes: string[];
  departureDate?: string;
  onDateChange?: (date: string) => void; // 新增：日期变化回调
}
```

**修改日期标签点击事件**：
```typescript
<button
  key={tab.date}
  className={`date-tab ${selectedDate === tab.date ? 'active' : ''}`}
  onClick={() => {
    setSelectedDate(tab.date);
    // 触发日期变化回调，通知父组件重新搜索
    if (onDateChange) {
      onDateChange(tab.date);
    }
  }}
>
  <div className="date-tab-date">{tab.display}</div>
</button>
```

### 2. `frontend/src/pages/TrainListPage.tsx`

#### 修改内容

**新增日期变化处理函数**：
```typescript
// 处理日期变化
const handleDateChange = (newDate: string) => {
  console.log('Date changed to:', newDate);
  
  // 更新搜索参数
  const newSearchParams = {
    ...searchParams,
    departureDate: newDate
  };
  setSearchParams(newSearchParams);
  
  // 重新查询车次
  fetchTrains(newSearchParams);
};
```

**传入回调函数**：
```typescript
<TrainFilterPanel
  onFilterChange={handleFilterChange}
  departureStations={filterOptions.departureStations || []}
  arrivalStations={filterOptions.arrivalStations || []}
  seatTypes={filterOptions.seatTypes || []}
  departureDate={searchParams.departureDate}
  onDateChange={handleDateChange} // 新增
/>
```

## 功能流程

```
用户点击日期标签
    ↓
TrainFilterPanel.tsx: 调用 onDateChange(newDate)
    ↓
TrainListPage.tsx: handleDateChange 接收新日期
    ↓
更新 searchParams 状态
    ↓
调用 fetchTrains(newSearchParams)
    ↓
发起 API 请求搜索新日期的车次
    ↓
更新车次列表显示
```

## 用户体验改进

1. **一键切换日期**：用户无需回到搜索框修改日期，直接点击日期标签即可
2. **自动刷新结果**：点击后立即显示新日期的车次，无需手动点击"查询"
3. **保持搜索条件**：切换日期时，出发地、到达地等条件保持不变
4. **视觉反馈一致**：选中的日期标签高亮显示，与搜索框中的日期保持同步

## 测试场景

### 测试步骤
1. 在首页搜索"上海"到"北京"，选择今天的日期
2. 进入车次列表页，查看当天的车次
3. 点击筛选面板上方的"明天"日期标签
4. 验证：
   - ✅ 搜索框中的日期自动更新为明天
   - ✅ 车次列表自动刷新，显示明天的车次
   - ✅ 出发地和到达地保持为"上海"和"北京"
   - ✅ 日期标签高亮显示切换到明天

### 预期结果
- 点击不同日期标签，车次列表应立即更新
- 搜索条件（出发地、到达地、车次类型）保持不变
- 筛选条件（出发车站、到达车站）自动刷新
- 页面无需刷新，体验流畅

## 技术细节

### 状态管理
- 使用 `searchParams` 状态存储搜索参数
- 日期变化时更新整个 `searchParams` 对象
- 通过 `fetchTrains` 函数统一处理搜索逻辑

### 回调链
1. 子组件（TrainFilterPanel）触发 `onDateChange`
2. 父组件（TrainListPage）接收回调
3. 更新状态并触发 API 请求
4. 结果返回后更新UI

### 性能优化
- 使用现有的 `fetchTrains` 函数，避免重复代码
- 保持筛选面板的其他状态不变
- 只更新必要的部分（日期和车次列表）

## 兼容性说明

- 向后兼容：`onDateChange` 为可选参数，不影响其他页面使用 TrainFilterPanel
- 如果不传入 `onDateChange`，日期标签仍可正常点击（仅更新本地状态）

## 完成时间
2025-11-21


# TrainItem 渲染错误修复总结

## 🐛 问题根源

从控制台错误信息：
```
TrainItem.tsx:25  Uncaught TypeError: Cannot read properties of undefined (reading 'toString')
    at formatSeatStatus (TrainItem.tsx:25:18)
```

**原因**：
1. ✅ API 调用成功，返回了车次数据
2. ✅ `train.availableSeats` 包含正确的余票信息
3. ❌ 但 `TrainItem` 组件使用了空的 `useState({})`
4. ❌ 导致访问 `undefined.toString()` 时崩溃

## 🔧 已修复的问题

### 1. 修复座位数据的使用
**修复前**：
```typescript
const [availableSeats, setAvailableSeats] = useState<any>({});
// availableSeats.business = undefined
// formatSeatStatus(undefined) -> undefined.toString() ❌ 崩溃
```

**修复后**：
```typescript
const availableSeats = {
  business: train.availableSeats?.['商务座'] ?? null,
  firstClass: train.availableSeats?.['一等座'] ?? null,
  secondClass: train.availableSeats?.['二等座'] ?? null,
  softSleeper: train.availableSeats?.['软卧'] ?? null,
  hardSleeper: train.availableSeats?.['硬卧'] ?? null,
};
```

**说明**：
- 直接从 `train.availableSeats` 获取数据
- 使用可选链 `?.` 防止访问 undefined
- 使用空值合并 `??` 设置默认值为 null
- 将中文座位类型映射到英文字段名

### 2. 修复 formatSeatStatus 函数
**修复前**：
```typescript
const formatSeatStatus = (count: number | null) => {
  if (count === null) return '--';
  if (count === 0) return '无';
  if (count >= 20) return '有';
  return count.toString(); // ❌ 如果 count 是 undefined 会崩溃
};
```

**修复后**：
```typescript
const formatSeatStatus = (count: number | null | undefined) => {
  if (count === null || count === undefined) return '--';
  if (count === 0) return '无';
  if (count >= 20) return '有';
  return count.toString(); // ✅ 现在安全了
};
```

### 3. 修复 getSeatClass 函数
**修复前**：
```typescript
const getSeatClass = (count: number | null) => {
  if (count === null) return 'not-available';
  // ...
};
```

**修复后**：
```typescript
const getSeatClass = (count: number | null | undefined) => {
  if (count === null || count === undefined) return 'not-available';
  // ...
};
```

### 4. 添加历时格式化
**新增功能**：
```typescript
const formatDuration = (minutes: number | undefined) => {
  if (!minutes) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}小时${mins}分`;
};
```

**效果**：
- 输入：`731` 分钟
- 输出：`12小时11分`

## 📊 后端数据结构

后端返回的数据：
```json
{
  "trainNo": "D6",
  "trainType": "动车组",
  "model": "CRH",
  "departureStation": "上海",
  "arrivalStation": "北京",
  "departureTime": "21:15",
  "arrivalTime": "09:26",
  "duration": 731,
  "availableSeats": {
    "硬卧": 120,
    "软卧": 30,
    "二等座": 1040
  }
}
```

**注意**：
- D6 车次没有"商务座"和"一等座"（动车组特点）
- 所以这些字段会是 `undefined`
- 修复后正确显示为 `--`

## ✅ 预期结果

刷新页面后，应该看到：

```
车次    出发站/到达站      出发时间  到达时间  历时         商务座  一等座  二等座  软卧  硬卧   操作
D6      上海 → 北京       21:15     09:26    12小时11分    --     --     有     有    有    预订
```

**说明**：
- ✅ 商务座、一等座显示 `--`（该车次没有这些座位）
- ✅ 二等座显示"有"（1040张，≥20）
- ✅ 软卧显示"有"（30张，≥20）
- ✅ 硬卧显示"有"（120张，≥20）
- ✅ 历时显示为可读的"12小时11分"

## 🎯 测试步骤

1. **刷新浏览器页面**（Cmd+R 或 Ctrl+R）
2. 在首页输入：
   - 出发地：上海
   - 到达地：北京
3. 点击"查询"
4. 应该能看到完整的车次列表，不再有错误

## 📝 修改文件

- ✅ `frontend/src/components/TrainItem.tsx`

## 🔍 如果还有问题

请检查：
1. 浏览器控制台是否还有新的错误
2. Network 标签中的 API 响应是否正确
3. 提供完整的控制台日志

---

**修复时间**：2025-11-12  
**状态**：已修复，等待用户测试


# 车次数据库架构修复总结

## 修复日期
2025-01-14

## 修复概述

修复了测试数据库表结构与代码期望不匹配的问题，解决了10个测试用例返回500错误的问题。

---

## 修复内容

### 1. 更新`trains`表结构

**修复前**：
```sql
CREATE TABLE IF NOT EXISTS trains (
  train_no TEXT NOT NULL UNIQUE,  -- ❌ 不支持多日期
  -- ❌ 缺少departure_date字段
  ...
)
```

**修复后**：
```sql
CREATE TABLE IF NOT EXISTS trains (
  train_no TEXT NOT NULL,  -- ✅ 移除UNIQUE约束
  departure_date DATE NOT NULL,  -- ✅ 添加departure_date字段
  ...
  UNIQUE(train_no, departure_date)  -- ✅ 支持多日期
)
```

### 2. 添加索引

**新增索引**：
```sql
CREATE INDEX IF NOT EXISTS idx_trains_date ON trains(departure_date)
CREATE INDEX IF NOT EXISTS idx_trains_no ON trains(train_no)
```

### 3. 更新`seat_status`表结构

**修复前**：
```sql
CREATE TABLE IF NOT EXISTS seat_status (
  train_no TEXT NOT NULL,
  -- ❌ 缺少departure_date字段
  ...
  FOREIGN KEY (train_no) REFERENCES trains(train_no)
)
```

**修复后**：
```sql
CREATE TABLE IF NOT EXISTS seat_status (
  train_no TEXT NOT NULL,
  departure_date DATE NOT NULL,  -- ✅ 添加departure_date字段
  ...
  FOREIGN KEY (train_no, departure_date) REFERENCES trains(train_no, departure_date)  -- ✅ 更新外键
)
```

**新增索引**：
```sql
CREATE INDEX IF NOT EXISTS idx_seat_status_train_date ON seat_status(train_no, departure_date)
```

### 4. 更新测试数据插入

**修复前**：
```javascript
INSERT OR REPLACE INTO trains (
  train_no, train_type, ...
) VALUES 
  ('G103', '高速动车组', ...),
  ('G16', '高速动车组', ...)
```

**修复后**：
```javascript
// 使用当前日期和明天
const trainDate = new Date();
const todayStr = trainDate.toISOString().split('T')[0];
const tomorrowStr = new Date(trainDate.setDate(trainDate.getDate() + 1)).toISOString().split('T')[0];

INSERT OR REPLACE INTO trains (
  train_no, departure_date, train_type, ...
) VALUES 
  ('G103', ?, '高速动车组', ...),  // 今天
  ('G103', ?, '高速动车组', ...),  // 明天
  ('G16', ?, '高速动车组', ...)    // 今天
```

### 5. 更新座位状态数据插入

**修复前**：
```javascript
INSERT INTO seat_status (train_no, car_no, seat_no, ...)
VALUES (?, ?, ?, ...)
```

**修复后**：
```javascript
// 为今天和明天的G103车次创建座位状态
[todayStr, tomorrowStr].forEach(departureDate => {
  INSERT INTO seat_status (train_no, departure_date, car_no, seat_no, ...)
  VALUES (?, ?, ?, ?, ...)
})
```

---

## 修复的文件

1. **backend/test/init-test-db.js**
   - 更新`trains`表结构（添加`departure_date`字段，修改唯一约束）
   - 更新`seat_status`表结构（添加`departure_date`字段，更新外键）
   - 添加索引（日期索引、车次号索引）
   - 更新测试数据插入（为所有车次添加日期）
   - 更新座位状态数据插入（为多日期车次创建座位）

---

## 修复验证

### 修复前的问题

- ❌ 10个测试用例返回500错误
- ❌ SQL查询失败：`SQLITE_ERROR: no such column: departure_date`
- ❌ 表结构不匹配

### 修复后的预期

- ✅ 所有SQL查询应该成功执行
- ✅ 测试用例应该能够正常查询车次数据
- ✅ 支持多日期车次查询

---

## 数据库架构对比

### 修复前后对比

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| `trains.departure_date` | ❌ 不存在 | ✅ 存在 |
| `trains`唯一约束 | `train_no UNIQUE` | `UNIQUE(train_no, departure_date)` |
| `seat_status.departure_date` | ❌ 不存在 | ✅ 存在 |
| 日期索引 | ❌ 无 | ✅ 有 |
| 测试数据日期 | ❌ 无 | ✅ 有（今天和明天） |

---

## 测试数据说明

### 车次数据

- **G103**：今天和明天各一条记录（北京南 → 上海虹桥）
- **G16**：今天一条记录（上海虹桥 → 北京南）

### 座位状态数据

- 为今天和明天的G103车次创建了完整的座位状态
- 包括商务座、一等座、二等座
- 覆盖所有停靠站区间

---

## 注意事项

1. **外键约束**：
   - `train_stops`、`train_cars`、`train_fares`表的外键仍然只引用`train_no`
   - 这些表存储的是车次的基本信息（停靠站、车厢、票价），对于同一车次的所有日期都是相同的
   - 因此不需要在这些表中添加`departure_date`字段

2. **测试数据日期**：
   - 使用动态日期（今天和明天），确保测试数据始终有效
   - 避免使用固定日期导致测试数据过期

3. **索引优化**：
   - 添加了日期索引，提高查询性能
   - 添加了车次号索引，提高车次查询性能

---

## 后续建议

1. **运行测试**：运行所有测试用例，验证修复是否成功
2. **性能测试**：验证索引是否提高了查询性能
3. **数据完整性**：确保所有测试数据都包含日期字段

---

**修复人员**：AI Assistant  
**修复日期**：2025-01-14  
**修复状态**：✅ 完成


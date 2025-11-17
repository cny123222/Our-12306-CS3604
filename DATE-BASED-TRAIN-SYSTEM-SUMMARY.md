# 基于日期的车次系统实施总结

## 项目概述

成功将车次系统重构为基于日期的架构，现在每个车次都维护未来14天（包括今天）的独立记录，并实现了自动清理过期数据和生成新数据的功能。

## 已完成的修改

### 一、数据库结构修改 ✅

#### 1. trains表
- 添加 `departure_date` 字段（DATE类型，NOT NULL）
- 修改唯一约束为 `UNIQUE(train_no, departure_date)`
- 添加索引：`idx_trains_date`、`idx_trains_no`
- 文件：`backend/database/init-trains-data.js`

#### 2. seat_status表
- 添加 `departure_date` 字段（DATE类型，NOT NULL）
- 更新外键引用：`FOREIGN KEY (train_no, departure_date)`
- 添加索引：`idx_seat_status_train_date`、`idx_seat_status_date`
- 文件：`backend/database/init-trains-data.js`

#### 3. 数据生成逻辑
- 修改初始化脚本，为每个车次生成未来14天的记录
- 为每个日期的车次初始化完整的座位状态数据
- 函数：`generateNext14Days()`、`insertTrains()`、`initializeSeatStatus()`

### 二、数据迁移脚本 ✅

#### 1. 迁移脚本 (`migrate-add-date-to-trains.js`)
- 自动备份现有数据库
- 重建表结构并添加日期字段
- 为现有车次生成未来14天的记录
- 迁移订单数据（保持兼容）

#### 2. 每日生成脚本 (`generate-daily-trains.js`)
- 生成第15天（从今天算起第14天后）的车次数据
- 自动复制座位配置和状态
- 用于定时任务

### 三、后端服务修改 ✅

#### 1. trainService.js
- `searchTrains()`: 添加日期过滤，只返回指定日期的车次
- `getTrainDetails()`: 添加日期参数，查询特定日期的车次
- `calculateAvailableSeats()`: 添加日期参数，计算指定日期的余票
- `getAvailableDates()`: 返回未来14天的日期列表（从今天开始）
- 所有查询自动过滤已过期车次

#### 2. orderService.js
- `getAvailableSeatTypes()`: 传递日期参数到余票计算
- `createOrder()`: 查询trains时添加departure_date过滤
- `confirmOrder()`: 所有seat_status查询和更新添加departure_date过滤
- 确保订单关联到正确日期的车次

#### 3. trainCleanupService.js（新建）
- `cleanupExpiredTrains()`: 清理departure_date < 今天的记录
- `cleanupTrainsBefore()`: 清理指定日期之前的记录
- `getExpiredTrainsStats()`: 获取过期车次统计信息
- 同时清理trains和seat_status表

#### 4. 定时任务集成 (app.js)
- 使用node-cron实现定时任务调度
- 每天凌晨2点：清理过期车次
- 每天凌晨3点：生成第15天车次数据
- 服务器启动时自动启用

### 四、前端日历组件 ✅

#### 1. DatePicker组件 (`frontend/src/components/DatePicker.tsx`)
**核心功能：**
- 完整日历UI（月份视图，7×6网格）
- 计算可选日期范围（今天起14天）
- 14天内日期可点击选择
- 14天外日期灰色显示，不可点击
- 支持月份切换（上一月/下一月）
- 显示今天标记
- 显示已选日期高亮
- 点击外部自动关闭
- "回到今天"快捷按钮

**样式特性（DatePicker.css）：**
- 日历下拉框阴影和边框
- 今天：蓝色边框
- 已选：蓝色背景
- 可选：悬停时浅蓝色背景
- 不可选：灰色文字，禁止鼠标
- 其他月份日期：浅灰色

#### 2. 前端页面集成

**首页查询页 (`TrainSearchForm.tsx`)：**
- 默认日期设置为今天
- 使用新的DatePicker组件

**车次列表页 (`TrainSearchBar.tsx`)：**
- 默认日期设置为今天
- 支持修改查询日期
- 返程日期保留（禁用状态）

**订单页面 (`OrderPage.tsx`)：**
- 显示出发日期（已有功能）
- 订单确认后不可修改

**订单历史页 (`OrderSearchFilter.tsx`)：**
- 集成日历组件用于日期范围筛选
- 不限制日期范围（可查询所有历史）
- 默认显示近15天订单

### 五、依赖更新 ✅

#### package.json
- 添加 `node-cron: ^3.0.3` 用于定时任务
- 移动 `sqlite3` 从 devDependencies 到 dependencies

## 技术实现细节

### 日期计算规则
- 使用本地时区
- 日期格式：YYYY-MM-DD (ISO 8601)
- 14天范围：包括今天（第0天）到第13天

### 座位状态管理
- 每个座位在每个日期的每个区间段都有独立记录
- 查询时必须同时指定 train_no 和 departure_date
- 更新时同样需要日期过滤

### 性能优化
- 为departure_date字段添加索引
- 复合索引：(train_no, departure_date)
- 查询时始终使用索引字段

### 数据一致性
- 外键约束确保数据完整性
- 定时清理避免数据积累
- 自动生成确保始终有14天数据

## 文件清单

### 新建文件
1. `backend/database/migrate-add-date-to-trains.js` - 数据库迁移脚本
2. `backend/database/generate-daily-trains.js` - 每日车次生成脚本
3. `backend/src/services/trainCleanupService.js` - 清理服务
4. `DATABASE-MIGRATION-GUIDE.md` - 迁移指南
5. `DATE-BASED-TRAIN-SYSTEM-SUMMARY.md` - 本文档

### 修改文件
1. `backend/database/init-trains-data.js` - 表结构和初始化逻辑
2. `backend/src/services/trainService.js` - 所有查询方法
3. `backend/src/services/orderService.js` - 订单和座位查询
4. `backend/src/app.js` - 定时任务集成
5. `backend/package.json` - 依赖更新
6. `frontend/src/components/DatePicker.tsx` - 完整实现
7. `frontend/src/components/DatePicker.css` - 日历样式
8. `frontend/src/components/TrainSearchForm.tsx` - 默认日期
9. `frontend/src/components/TrainSearchBar.tsx` - 默认日期
10. `frontend/src/components/Order/OrderSearchFilter.tsx` - 日历集成

## 使用说明

### 初始化/迁移
```bash
# 安装依赖
cd backend && npm install

# 方式1：迁移现有数据库
node backend/database/migrate-add-date-to-trains.js

# 方式2：全新初始化
node backend/database/init-trains-data.js
```

### 启动服务
```bash
# 后端
cd backend && npm start

# 前端
cd frontend && npm run dev
```

### 手动维护
```bash
# 清理过期车次
node -e "require('./backend/src/services/trainCleanupService').cleanupExpiredTrains()"

# 生成第15天数据
node backend/database/generate-daily-trains.js
```

## 测试验证

### 数据库验证
```sql
-- 检查记录数量
SELECT COUNT(*) as total, COUNT(DISTINCT departure_date) as unique_dates FROM trains;

-- 检查日期范围
SELECT MIN(departure_date) as min, MAX(departure_date) as max FROM trains;

-- 检查某个车次的日期
SELECT train_no, departure_date, departure_time FROM trains WHERE train_no = 'G1' ORDER BY departure_date;
```

### 前端验证
1. 打开首页，检查日期选择器默认为今天
2. 点击日期输入框，验证日历正确显示
3. 尝试点击14天内和14天外的日期
4. 切换月份，验证日期可选性
5. 在车次列表页修改日期，验证查询结果

### API验证
```bash
# 搜索今天的车次
curl -X POST http://localhost:3000/api/trains/search \
  -H "Content-Type: application/json" \
  -d '{"departureStation":"北京南","arrivalStation":"上海虹桥","departureDate":"2025-11-15"}'

# 获取可选日期
curl http://localhost:3000/api/trains/available-dates
```

## 注意事项

1. **首次运行**：必须先执行迁移或初始化脚本
2. **数据备份**：迁移前请务必备份数据库
3. **时区**：确保服务器时区设置正确
4. **定时任务**：服务器需要持续运行以执行定时任务
5. **性能**：初次生成数据可能需要几分钟

## 后续优化建议

1. 添加数据库连接池
2. 实现分布式锁（多实例部署时）
3. 添加监控和告警
4. 优化大量数据的批量插入
5. 考虑使用数据库分区

## 支持与维护

如有问题，请参考：
- `DATABASE-MIGRATION-GUIDE.md` - 详细迁移指南
- 后端日志：检查定时任务执行情况
- 数据库日志：检查表结构和数据

---

**实施完成日期**：2025年11月
**实施状态**：✅ 全部完成
**测试状态**：待用户验证










# 数据库迁移指南：基于日期的车次系统

本指南说明如何将现有数据库迁移到新的基于日期的车次系统。

## 概述

新系统为每个车次维护未来14天的记录，每天自动清理过期车次并生成第15天的数据。

## 迁移步骤

### 步骤1：安装依赖

确保安装了node-cron包：

```bash
cd backend
npm install
```

### 步骤2：备份现有数据库

在执行迁移前，强烈建议备份现有数据库：

```bash
cp backend/database/railway.db backend/database/railway.db.backup
```

### 步骤3：执行数据库迁移

运行迁移脚本，为现有车次生成未来14天的记录：

```bash
cd backend/database
node migrate-add-date-to-trains.js
```

迁移脚本会：
1. 自动备份数据库
2. 重建trains和seat_status表（添加departure_date字段）
3. 为每个车次生成未来14天的记录
4. 为每个日期的车次初始化座位状态

### 步骤4（可选）：全新初始化

如果您希望从头开始初始化数据库（会删除现有数据），可以运行：

```bash
cd backend/database
node init-trains-data.js
```

这将创建新的数据库结构并为所有车次生成未来14天的记录。

## 定时任务

系统会自动运行以下定时任务：

- **每天凌晨2点**：清理过期车次（departure_date < 今天）
- **每天凌晨3点**：生成第15天的车次数据

这些任务在服务器启动时自动启动，无需手动配置。

## 手动清理和生成

### 手动清理过期车次

```bash
cd backend
node -e "require('./src/services/trainCleanupService').cleanupExpiredTrains().then(r => console.log(r))"
```

### 手动生成第15天车次

```bash
cd backend/database
node generate-daily-trains.js
```

## 验证迁移

### 检查trains表

```bash
sqlite3 backend/database/railway.db "SELECT COUNT(*) as total, COUNT(DISTINCT departure_date) as unique_dates FROM trains;"
```

应该显示：
- total: 车次数量 × 14（例如，如果有10个车次，应该有140条记录）
- unique_dates: 14

### 检查seat_status表

```bash
sqlite3 backend/database/railway.db "SELECT COUNT(DISTINCT departure_date) as unique_dates FROM seat_status;"
```

应该显示：unique_dates = 14

### 检查日期范围

```bash
sqlite3 backend/database/railway.db "SELECT MIN(departure_date) as min, MAX(departure_date) as max FROM trains;"
```

应该显示从今天到第13天之后的日期范围。

## 日历组件功能

前端DatePicker组件已完整实现：
- 显示完整日历（月份视图）
- 未来14天内的日期可点击选择
- 14天外的日期灰色显示，不可点击
- 支持月份切换
- 显示今天标记

## 故障排除

### 迁移失败

如果迁移失败，可以从备份恢复：

```bash
cp backend/database/railway.db.backup backend/database/railway.db
```

### 定时任务未运行

检查服务器日志，确认看到以下消息：

```
定时任务已启动：
  - 每天凌晨2点：清理过期车次
  - 每天凌晨3点：生成第15天车次数据
```

### 前端日期选择问题

如果日期选择器没有正确显示可选日期，请检查：
1. DatePicker组件是否正确导入
2. 浏览器控制台是否有错误
3. CSS文件是否正确加载

## 注意事项

1. **时区**：所有日期计算使用本地时区
2. **数据量**：迁移会为每个车次×14天×每个座位×每个区间创建记录，可能需要一些时间
3. **订单数据**：现有订单数据会被保留，但请确保orders表中包含departure_date字段
4. **性能**：已为departure_date字段添加索引，查询性能应该良好

## 更多信息

- 数据库结构修改：`backend/database/init-trains-data.js`
- 迁移脚本：`backend/database/migrate-add-date-to-trains.js`
- 清理服务：`backend/src/services/trainCleanupService.js`
- 定时任务配置：`backend/src/app.js`
- DatePicker组件：`frontend/src/components/DatePicker.tsx`


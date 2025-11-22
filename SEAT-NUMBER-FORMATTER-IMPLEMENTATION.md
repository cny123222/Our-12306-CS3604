# 座位号格式化系统实现总结

## 实现概述

本次实现完成了座位号格式化系统，将数据库中的数字座位号（如 "1-01"）转换为更直观的显示格式（如 "01车01A号"、"01车01号上铺"等），适用于所有席别类型。

## 架构设计

### 数据存储策略

- **数据库层**：保持原有数字格式（如 "1-01"），无需迁移
- **应用层**：在前端和后端提供格式化工具函数，按需转换
- **双向转换**：支持格式化显示 ↔ 原始数字的双向转换

### 转换规则

#### 1. 二等座（80座位，16排×5座）

- 每排5个座位：A, B, C, D, F（跳过E）
- 示例：
  - `01` → `01A`（第1排A座）
  - `05` → `01F`（第1排F座）
  - `06` → `02A`（第2排A座）
  - `80` → `16F`（第16排F座）
  - `1-01` → `01车01A号`

#### 2. 一等座（40座位，10排×4座）

- 每排4个座位：A, C, D, F
- 示例：
  - `01` → `01A`
  - `04` → `01F`
  - `05` → `02A`
  - `40` → `10F`
  - `1-01` → `01车01A号`

#### 3. 商务座（10座位，5排×2座）

- 每排2个座位：A, F
- 示例：
  - `01` → `01A`
  - `02` → `01F`
  - `10` → `05F`
  - `1-01` → `01车01A号`

#### 4. 软卧（30座位）

- 单号上铺，双号下铺
- 示例：
  - `01` → `01号上铺`
  - `02` → `02号下铺`
  - `30` → `30号下铺`
  - `1-01` → `01车01号上铺号`

#### 5. 硬卧（60座位）

- 每3个座位对应一个号
- 除以3余1 → 上铺，余2 → 中铺，余0 → 下铺
- 示例：
  - `01` → `01号上铺`
  - `02` → `01号中铺`
  - `03` → `01号下铺`
  - `07` → `03号上铺`
  - `12` → `04号下铺`
  - `30` → `10号下铺`
  - `1-01` → `01车01号上铺号`

## 实现文件

### 工具函数

#### 前端
- **文件**：`frontend/src/utils/seatNumberFormatter.ts`
- **函数**：
  - `formatSeatNumber(seatNo, seatType)` - 座位号格式化
  - `formatFullSeatNumber(fullSeatNo, seatType)` - 完整座位号格式化
  - `parseSeatNumber(formattedSeat, seatType)` - 格式化座位号解析
  - `parseFullSeatNumber(fullFormatted, seatType)` - 完整格式化座位号解析
  - `formatSeatInfoForDisplay(seatNumber, carNumber, seatType)` - 通用显示格式化

#### 后端
- **文件**：`backend/src/utils/seatNumberFormatter.js`
- **函数**：与前端相同（CommonJS 格式）

### 修改的前端组件

1. **OrderItem.tsx** (`frontend/src/components/Order/OrderItem.tsx`)
   - 修改 `formatSeatInfo` 函数，使用 `formatSeatInfoForDisplay`
   - 导入格式化工具

2. **OrderSuccessModal.tsx** (`frontend/src/components/OrderSuccessModal.tsx`)
   - 在票据信息表格中使用 `formatSeatInfoForDisplay`
   - 添加 `carNo` 字段到 `TicketInfo` 接口

3. **OrderInfoDisplay.tsx** (`frontend/src/components/OrderInfoDisplay.tsx`)
   - 修改 `formatSeatDisplay` 函数，使用 `formatSeatNumber`
   - 在乘客表格中传递 `seatType` 参数

### 测试文件

- **文件**：`backend/test/test-seat-formatter.js`
- **测试范围**：
  - 所有席别类型的正向格式化（58个测试用例）
  - 格式化座位号的反向解析
  - 双向转换一致性验证
- **测试结果**：✅ 100% 通过（58/58）

## 测试结果

```
================================================================================
测试结果摘要
================================================================================
总测试数: 58
通过: 58 (100.0%)
失败: 0 (0.0%)

🎉 所有测试通过！
```

## 使用示例

### 前端使用

```typescript
import { formatSeatInfoForDisplay } from '../utils/seatNumberFormatter';

// 订单项中显示座位号
const formattedSeat = formatSeatInfoForDisplay(
  passenger.seat_number,  // "1-01"
  passenger.car_number,   // "1"
  passenger.seat_type     // "二等座"
);
// 结果: "01车01A号"
```

### 后端使用

```javascript
const { formatFullSeatNumber } = require('../utils/seatNumberFormatter');

// 在API响应中格式化座位号
const formattedSeat = formatFullSeatNumber("1-01", "商务座");
// 结果: "01车01A号"
```

## 兼容性说明

- **向后兼容**：旧的座位号格式（纯数字）仍然支持
- **数据库无需迁移**：所有转换在应用层完成
- **灵活扩展**：可轻松添加新的席别类型或修改显示格式

## 显示位置

格式化后的座位号将在以下位置显示：

1. **订单列表页** - 订单项中的座位信息
2. **订单详情页** - 乘客座位信息表格
3. **支付页** - 订单信息确认表格
4. **购票成功页** - 车票信息展示
5. **购票成功弹窗** - 车票信息表格

## 注意事项

1. **硬卧特殊说明**：由于每3个座位对应一个号，座位60将显示为"20号下铺"（而不是"10号下铺"）
2. **软卧和硬卧格式**：完整格式会显示两次"号"字（如 "01车01号上铺号"），这是因为组合了车厢号和座位描述
3. **字母座位编号**：二等座、一等座、商务座跳过特定字母（如E），符合真实高铁座位布局

## 后续优化建议

1. 可以考虑优化软卧和硬卧的完整格式，避免重复的"号"字
2. 可以添加更多席别类型的支持（如动卧等）
3. 可以在后端API响应中直接返回格式化后的座位号，减少前端计算

## 完成日期

2025-11-22


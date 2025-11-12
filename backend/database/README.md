# 数据库初始化说明

## 数据库结构

本项目使用SQLite数据库，包含以下表：

### 1. stations（站点表）
存储所有铁路站点信息
- id: 主键
- name: 站点名称
- code: 站点代码
- pinyin: 站点拼音
- short_pinyin: 站点简拼
- created_at: 创建时间

### 2. trains（车次表）
存储车次基本信息
- id: 主键
- train_no: 车次号（唯一）
- train_type: 车次类型（高速动车组、动车组等）
- model: 车型
- is_direct: 是否直达
- has_air_conditioning: 是否有空调
- origin_station: 始发站
- destination_station: 终点站
- distance_km: 总里程
- planned_duration_min: 计划历时（分钟）
- departure_time: 出发时间
- arrival_time: 到达时间
- created_at: 创建时间

### 3. train_stops（车次停靠站表）
存储车次的所有停靠站信息
- id: 主键
- train_no: 车次号（外键）
- seq: 停靠序号
- station: 站点名称
- arrive_time: 到达时间
- depart_time: 出发时间
- stop_min: 停靠时长（分钟）

### 4. train_cars（车厢配置表）
存储车次的车厢配置
- id: 主键
- train_no: 车次号（外键）
- car_no: 车厢号
- seat_type: 席别类型（商务座、一等座、二等座、软卧、硬卧、餐车）

### 5. train_fares（票价表）
存储车次各区间的票价信息
- id: 主键
- train_no: 车次号（外键）
- from_station: 起始站
- to_station: 终点站
- distance_km: 区间里程
- second_class_price: 二等座票价
- first_class_price: 一等座票价
- business_price: 商务座票价
- hard_sleeper_price: 硬卧票价
- soft_sleeper_price: 软卧票价

### 6. seat_status（座位状态表）
存储每个座位在各区间的状态
- id: 主键
- train_no: 车次号（外键）
- car_no: 车厢号
- seat_no: 座位号
- seat_type: 席别类型
- from_station: 起始站
- to_station: 终点站
- status: 状态（available/booked）
- booked_by: 预订用户ID
- booked_at: 预订时间

## 初始化步骤

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 运行初始化脚本
```bash
node database/init-trains-data.js
```

该脚本会：
1. 创建必要的数据库表
2. 从 `requirements/03-车次列表页/车次信息.json` 读取车次数据
3. 初始化站点信息
4. 插入车次基本信息
5. 插入车次停靠站信息
6. 插入车厢配置信息
7. 插入票价信息
8. 初始化所有座位的状态为可用

### 3. 验证数据
初始化完成后，可以使用SQLite客户端工具查看数据：

```bash
sqlite3 database/railway.db
```

查看表数据：
```sql
SELECT * FROM trains;
SELECT * FROM stations;
SELECT COUNT(*) FROM seat_status;
```

## 余票计算逻辑

根据需求文档4.4.2节，余票数的计算规则：

1. **相邻两站**：直接统计该区间内状态为 `available` 的座位数
2. **非相邻两站**：只有座位在出发站到到达站的所有区间都是 `available` 状态时，才计入余票
3. **售罄情况**：如果某席别的所有座位在任一中间区间都被预订，则该席别余票数为0

## 注意事项

1. 初始化脚本会清空并重建数据，谨慎在生产环境使用
2. 座位状态表会为每个车次、每个座位、每个区间段创建记录，数据量较大
3. 票价计算遵循需求4.4.3节：某两站之间某席位票价 = 途经站点之间该席位票价之和
4. 数据库文件位置：`backend/database/railway.db`


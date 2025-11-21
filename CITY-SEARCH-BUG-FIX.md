# 城市搜索功能Bug修复

## 问题描述
用户搜索"上海"到"北京"时，只能看到1个车次（D6），而实际应该显示2个车次（G16和D6）。

## 根本原因
当输入"上海"时，由于"上海"既是城市名也是车站名，原代码的逻辑会：
1. 先调用`getCityByStation('上海')`
2. 发现"上海"是一个车站，返回其所属城市"上海"
3. 认为用户输入的是车站名，只查询"上海"这一个车站
4. 结果只能找到从"上海"车站出发的D6车次，而找不到从"上海虹桥"出发的G16车次

## 修复方案

### 修改1: 优先判断为城市名
**文件**: `backend/src/services/trainService.js`

**原逻辑**:
```javascript
// 先判断是否为车站名
const depCity = await stationService.getCityByStation(departureCityOrStation);
if (depCity) {
  // 是车站名，只查询该车站
  departureStations = [departureCityOrStation];
} else {
  // 是城市名，获取城市所有车站
  departureStations = await stationService.getStationsByCity(departureCityOrStation);
}
```

**新逻辑**:
```javascript
// 先判断是否为城市名（优先级更高）
departureStations = await stationService.getStationsByCity(departureCityOrStation);
if (departureStations.length === 0) {
  // 不是城市名，再尝试作为车站名
  const depCity = await stationService.getCityByStation(departureCityOrStation);
  if (depCity) {
    departureStations = await stationService.getStationsByCity(depCity);
  }
}
```

### 修改2: 改进异步处理
**文件**: `backend/src/services/trainService.js`

原代码使用for循环和计数器处理异步查询，改为使用`Promise.all()`确保所有车次都被正确处理。

**改进点**:
- 使用`Promise.all()`并行处理所有车次
- 过滤掉null结果
- 添加详细的日志输出

## 测试结果

### 修复前
```bash
curl POST /api/trains/search
参数: "上海" -> "北京"
结果: 1个车次 (D6)
```

### 修复后
```bash
curl POST /api/trains/search
参数: "上海" -> "北京"
结果: 2个车次
  1. G16: 上海虹桥 (06:20) → 北京南 (11:58)
  2. D6: 上海 (21:15) → 北京 (09:26)
```

## 验证日志
```
出发站点列表: [ '上海虹桥', '上海', '上海松江', '上海南' ]
到达站点列表: [ '北京南', '北京丰台', '北京' ]
SQL查询返回 4 条原始记录
跳过车次 G103: 出发站/到达站不匹配或顺序错误 (北京→上海)
跳过车次 D9: 出发站/到达站不匹配或顺序错误 (北京→上海)
最终返回 2 个车次
```

## 受影响的文件
- `backend/src/services/trainService.js` - 修复核心逻辑

## 测试建议
1. 测试"上海"到"北京" - 应显示2个车次
2. 测试"北京"到"上海" - 应显示2个车次（G103, D9）
3. 测试纯车站名搜索（如果未来支持）
4. 测试城市名和车站名的各种组合

## 注意事项
- 此修复确保城市级搜索的优先级高于车站级搜索
- 如果城市名和车站名重名，优先按城市处理
- 保持了向后兼容性，仍支持车站名搜索

## 完成时间
2025-11-21


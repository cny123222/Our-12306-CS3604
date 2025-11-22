# 城市级车次搜索功能实施总结

## 实施日期
2025-01-XX

## 功能概述
将车次搜索从基于车站改为基于城市，用户搜索时输入城市名，系统返回该城市所有车站的车次，筛选面板显示城市下所有车站供用户进一步筛选。

## 实施的更改

### 1. 后端更改

#### 1.1 新增文件
- **backend/src/config/cityStationMapping.js**
  - 创建城市-车站映射配置
  - 初始配置包含：
    - 上海：上海虹桥、上海、上海松江、上海南
    - 北京：北京南、北京丰台、北京
  - 提供方法：
    - `getAllCities()` - 获取所有城市列表
    - `getStationsByCity(cityName)` - 获取城市的所有车站
    - `isCityValid(cityName)` - 验证城市是否有效
    - `getCityByStation(stationName)` - 根据车站反查城市
    - `getCityStationMapping()` - 获取完整映射

#### 1.2 修改文件

**backend/src/services/stationService.js**
- 引入cityStationMapping配置
- 新增方法：
  - `getAllCities()` - 获取所有支持的城市
  - `getStationsByCity(cityName)` - 根据城市获取车站列表
  - `validateCity(cityName)` - 验证城市名是否有效
  - `getCityByStation(stationName)` - 根据车站名反查城市

**backend/src/services/trainService.js**
- 修改 `searchTrains()` 方法：
  - 支持城市级搜索
  - 当传入城市名时，自动获取该城市所有车站
  - 使用IN子句查询多个车站的车次
  - 返回结果中包含实际的车站名（而非城市名）
- 修改 `getFilterOptions()` 方法：
  - 返回出发城市和到达城市的所有车站
  - 不再仅限于有车次的车站

**backend/src/routes/trains.js**
- 新增API端点：
  - `GET /api/trains/cities` - 获取所有支持的城市列表
  - `GET /api/trains/cities/:cityName/stations` - 获取指定城市的车站列表
- 修改 `POST /api/trains/search` 端点：
  - 使用validateCity替代validateStation
  - 错误提示改为"请选择出发城市"/"无法匹配该出发城市"

### 2. 前端更改

#### 2.1 新增文件
- **frontend/src/components/CityInput.tsx**
  - 城市输入组件
  - 类似StationInput但专门用于城市选择
  - 从后端API获取城市列表
  - 支持城市名搜索和下拉选择

#### 2.2 修改文件

**frontend/src/services/stationService.ts**
- 新增接口类型：
  - `CityValidationResult` - 城市验证结果
- 新增方法：
  - `getAllCities()` - 获取所有支持的城市
  - `getStationsByCity(cityName)` - 根据城市获取车站列表
  - `validateCity(cityName)` - 验证城市名是否有效

**frontend/src/components/TrainSearchForm.tsx** (首页搜索表单)
- 将StationInput替换为CityInput
- 修改placeholder为"请选择城市"
- 将validateStation改为validateCity
- 更新错误提示为"请选择出发城市"/"无法匹配该出发城市"
- 更新标签为"出发城市"/"到达城市"

**frontend/src/components/TrainSearchBar.tsx** (车次列表页搜索栏)
- 将StationInput替换为CityInput
- 修改placeholder为"请选择城市"
- 更新错误提示为"请输入出发城市"/"请输入到达城市"
- 更新标签为"出发城市"/"目的城市"

**frontend/src/pages/TrainListPage.tsx**
- 引入 `getStationsByCity` 方法
- 修改筛选选项获取逻辑：
  - 从后端API获取城市的所有车站
  - 不再仅从车次列表中提取车站
  - 确保筛选面板显示城市的所有车站

### 3. 数据流说明

#### 3.1 搜索流程
1. 用户在首页或车次列表页输入城市名（如"上海"、"北京"）
2. 前端调用 `validateCity` 验证城市是否有效
3. 验证通过后，调用 `/api/trains/search` API
4. 后端接收到城市名，通过cityStationMapping获取该城市所有车站
5. 后端使用IN子句查询所有车站的车次
6. 返回车次列表，每个车次包含实际的车站名

#### 3.2 筛选流程
1. 搜索完成后，前端调用 `getStationsByCity` 获取城市的所有车站
2. 筛选面板显示出发城市和到达城市的所有车站（包括无车次的车站）
3. 用户勾选特定车站后，前端在本地过滤车次列表
4. 只显示从选中车站出发或到达选中车站的车次

## 测试要点

### 1. 基本功能测试
- [ ] 首页搜索框只显示城市选项（上海、北京）
- [ ] 车次列表页搜索框只显示城市选项
- [ ] 搜索"上海"到"北京"显示所有相关车次
- [ ] 车次列表中显示准确的车站名（如"上海虹桥"、"北京南"）

### 2. 筛选功能测试
- [ ] 筛选面板显示上海的所有车站（上海虹桥、上海、上海松江、上海南）
- [ ] 筛选面板显示北京的所有车站（北京南、北京丰台、北京）
- [ ] 勾选"上海虹桥"后，只显示从上海虹桥出发的车次
- [ ] 勾选多个车站后，显示符合任一条件的车次

### 3. 错误处理测试
- [ ] 输入无效城市名显示"无法匹配该城市"
- [ ] 未输入城市时显示"请选择出发城市"

### 4. 边界情况测试
- [ ] 搜索的两个城市之间没有车次时，显示空列表
- [ ] 城市只有一个车站时，功能正常
- [ ] 筛选掉所有车站时，显示空列表

## 配置扩展说明

要添加新城市，只需修改 `backend/src/config/cityStationMapping.js`：

```javascript
const CITY_STATION_MAPPING = {
  '上海': ['上海虹桥', '上海', '上海松江', '上海南'],
  '北京': ['北京南', '北京丰台', '北京'],
  '深圳': ['深圳北', '深圳', '深圳东'],  // 新增城市
  '广州': ['广州南', '广州东', '广州北'],  // 新增城市
};
```

无需修改其他代码，系统会自动识别新城市。

## 兼容性说明

- 后端API保持向后兼容，仍然接受车站名作为参数
- 如果传入车站名，系统会自动识别并查询该车站所在城市的所有车站
- 前端组件完全迁移到城市级搜索

## 已知限制

1. 目前只支持两个城市：上海和北京
2. 城市-车站映射是静态配置，需要手动添加新城市
3. 不支持跨城市车站归属（每个车站只能属于一个城市）

## 后续优化建议

1. 将城市-车站映射存储在数据库中
2. 提供管理界面用于添加/修改城市配置
3. 支持城市别名和拼音搜索
4. 添加城市热度排序


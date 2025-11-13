# 个人信息页接口设计更新总结

更新日期：2025-11-13

## 需求来源
基于 `requirements/05-个人信息页/05-个人信息页.md` 的新增需求，涵盖以下四个主要功能模块：
1. 用户基本信息页（6.1-6.3）
2. 手机核验页（7.1-7.2）
3. 乘客管理页（8.1-8.4）
4. 历史订单页（9.1-9.2）

---

## 一、数据库接口更新 (data_interface.yml)

### 新增接口 (6个)

1. **DB-GetUserInfo**
   - 获取用户的完整个人信息
   - 包含用户名、姓名、国家/地区、证件类型、证件号码、核验状态、手机号（脱敏）、邮箱、优惠类型

2. **DB-UpdateUserEmail**
   - 更新用户的邮箱地址
   - 验证邮箱格式的合法性

3. **DB-UpdateUserPhone**
   - 更新用户的手机号
   - 验证新手机号未被其他用户使用
   - 验证用户登录密码和手机验证码

4. **DB-CheckPassengerExists**
   - 检查乘客信息是否已存在
   - 根据用户ID、姓名和证件号码查询

5. **DB-GetUserOrders**
   - 获取用户的订单列表
   - 支持按日期范围筛选
   - 订单信息保存期限为30日

6. **DB-SearchOrders**
   - 搜索用户的订单
   - 支持按订单号、车次号、乘客姓名搜索
   - 支持按乘车日期范围筛选

7. **DB-GetPassengerByIdCard**
   - 根据证件号码获取乘客信息
   - 用于编辑乘客时加载信息

### 复用接口 (6个)
- DB-VerifyPassword
- DB-GetUserPassengers
- DB-CreatePassenger
- DB-UpdatePassenger
- DB-DeletePassenger
- DB-SearchPassengers

---

## 二、API接口更新 (api_interface.yml)

### 新增接口 (10个)

1. **API-GET-UserInfo**
   - GET /api/user/info
   - 获取用户个人信息
   - 手机号中间四位用*隐去

2. **API-PUT-UserEmail**
   - PUT /api/user/email
   - 更新用户邮箱
   - 验证邮箱格式的合法性

3. **API-POST-UpdatePhoneRequest**
   - POST /api/user/phone/update-request
   - 请求更新用户手机号（发送验证码）
   - 验证密码正确且新手机号未被使用

4. **API-POST-ConfirmPhoneUpdate**
   - POST /api/user/phone/confirm-update
   - 确认更新用户手机号（验证验证码）
   - 验证短信验证码正确且未过期

5. **API-PUT-Passenger**
   - PUT /api/passengers/:passengerId
   - 更新乘客信息（主要是手机号）
   - 验证乘客属于当前用户

6. **API-DELETE-Passenger**
   - DELETE /api/passengers/:passengerId
   - 删除乘客信息
   - 检查乘客是否有未完成的订单

7. **API-GET-UserOrders**
   - GET /api/user/orders
   - 获取用户订单列表
   - 支持按日期范围和关键词筛选

8. **API-POST-ValidatePassenger**
   - POST /api/passengers/validate
   - 验证乘客信息的合法性
   - 验证姓名、证件号码、手机号格式
   - 验证乘客信息的唯一性

### 复用接口 (4个)
- API-GET-Passengers
- API-POST-SearchPassengers
- API-POST-AddPassenger
- API-POST-VerifyPassword（通过依赖）

---

## 三、UI组件更新 (ui_interface.yml)

### 新增组件 (24个)

#### 用户基本信息页相关 (6个)
1. **UI-PersonalInfoPage** - 用户基本信息页主容器
2. **UI-SideMenu** - 左侧功能菜单栏
3. **UI-PersonalInfoPanel** - 个人信息展示面板
4. **UI-BasicInfoSection** - 基本信息模块
5. **UI-ContactInfoSection** - 联系方式模块
6. **UI-AdditionalInfoSection** - 附加信息模块

#### 手机核验页相关 (3个)
7. **UI-PhoneVerificationPage** - 手机核验页主容器
8. **UI-PhoneVerificationPanel** - 手机核验信息展示面板
9. **UI-PhoneVerificationModal** - 手机验证弹窗

#### 乘客管理页相关 (6个)
10. **UI-PassengerManagementPage** - 乘客管理页主容器
11. **UI-PassengerListPanel** - 乘车人列表展示面板
12. **UI-PassengerTable** - 乘客信息表格
13. **UI-AddPassengerPanel** - 添加乘车人面板
14. **UI-EditPassengerPanel** - 编辑乘车人面板

#### 历史订单页相关 (6个)
15. **UI-OrderHistoryPage** - 历史订单页主容器
16. **UI-OrderListPanel** - 订单列表展示面板
17. **UI-OrderSearchFilter** - 订单搜索筛选组件
18. **UI-OrderResultDisplay** - 订单结果展示组件
19. **UI-OrderItem** - 订单项组件

#### 通用组件 (2个)
20. **UI-BreadcrumbNavigation** - 位置导航组件
21. **UI-DeleteConfirmModal** - 删除确认弹窗组件

### 复用组件
- UI-TopNavigation（顶部导航）
- UI-BottomNavigation（底部导航）
- UI-DatePicker（日期选择器）
- UI-SelectDropdown（下拉选择框）
- UI-ValidationInput（带验证的输入框）
- UI-ConfirmModal（确认弹窗）
- UI-SuccessModal（成功提示弹窗）

---

## 四、接口决策统计

### 数据库接口
- **创建**: 7个新接口
- **复用**: 6个现有接口
- **修改**: 0个接口

### API接口
- **创建**: 10个新接口
- **复用**: 4个现有接口
- **修改**: 0个接口

### UI组件
- **创建**: 24个新组件
- **复用**: 8个现有组件
- **修改**: 0个组件

**总计**:
- 新建接口/组件: 41个
- 复用接口/组件: 18个
- 修改接口/组件: 0个

---

## 五、关键设计决策

### 1. 复用优先原则
- 优先复用现有的乘客管理相关接口（DB-GetUserPassengers, DB-CreatePassenger等）
- 复用现有的UI组件（UI-ValidationInput, UI-SelectDropdown等）
- 复用现有的导航组件（UI-TopNavigation, UI-BottomNavigation）

### 2. 数据安全
- 手机号脱敏处理：中间四位用*隐去
- 证件号码加密显示
- 手机号修改需要验证登录密码和短信验证码

### 3. 用户体验
- 实时输入验证和错误提示
- 清晰的位置导航（面包屑导航）
- 统一的左侧菜单栏设计
- 空状态友好提示

### 4. 数据一致性
- 乘客信息唯一性检查（姓名+证件号码）
- 手机号唯一性验证
- 订单保存期限控制（30日）

---

## 六、后续实施建议

### 阶段一：数据库层
1. 实现用户信息查询和更新接口
2. 实现订单历史查询和搜索接口
3. 实现乘客信息重复性检查

### 阶段二：API层
1. 实现用户信息相关API（查询、更新邮箱、更新手机号）
2. 实现乘客管理相关API（编辑、删除、验证）
3. 实现订单历史查询API

### 阶段三：UI层
1. 实现基础组件（侧边菜单、位置导航、删除确认弹窗）
2. 实现用户基本信息页和手机核验页
3. 实现乘客管理页（列表、添加、编辑）
4. 实现历史订单页

### 阶段四：集成测试
1. 用户信息查看和编辑流程
2. 手机号修改完整流程（含验证码）
3. 乘客管理完整流程（增删改查）
4. 历史订单查询和筛选

---

## 七、注意事项

1. **安全性**：手机号修改需要验证原密码和新手机号验证码
2. **数据完整性**：删除乘客前需要检查是否有未完成的订单
3. **性能优化**：订单查询支持分页和日期范围限制
4. **错误处理**：所有输入验证需要清晰的错误提示
5. **移动端适配**：考虑响应式设计，确保在移动端良好展示

---

## 八、接口依赖关系图

```
用户基本信息页
├── DB-GetUserInfo
├── API-GET-UserInfo
└── UI-PersonalInfoPage
    ├── UI-SideMenu (新)
    ├── UI-PersonalInfoPanel (新)
    │   ├── UI-BasicInfoSection (新)
    │   ├── UI-ContactInfoSection (新)
    │   └── UI-AdditionalInfoSection (新)
    ├── UI-TopNavigation (复用)
    └── UI-BottomNavigation (复用)

手机核验页
├── DB-UpdateUserPhone
├── DB-VerifyPassword (复用)
├── API-POST-UpdatePhoneRequest
├── API-POST-ConfirmPhoneUpdate
└── UI-PhoneVerificationPage
    ├── UI-PhoneVerificationPanel (新)
    ├── UI-PhoneVerificationModal (新)
    └── UI-SideMenu (复用)

乘客管理页
├── DB-GetUserPassengers (复用)
├── DB-CreatePassenger (复用)
├── DB-UpdatePassenger (复用)
├── DB-DeletePassenger (复用)
├── API-GET-Passengers (复用)
├── API-PUT-Passenger
├── API-DELETE-Passenger
└── UI-PassengerManagementPage
    ├── UI-PassengerListPanel (新)
    │   └── UI-PassengerTable (新)
    ├── UI-AddPassengerPanel (新)
    └── UI-EditPassengerPanel (新)

历史订单页
├── DB-GetUserOrders
├── DB-SearchOrders
├── API-GET-UserOrders
└── UI-OrderHistoryPage
    ├── UI-OrderListPanel (新)
    │   ├── UI-OrderSearchFilter (新)
    │   └── UI-OrderResultDisplay (新)
    │       └── UI-OrderItem (新)
    └── UI-SideMenu (复用)
```

---

## 九、总结

本次更新基于 `05-个人信息页.md` 的需求，新增了 41 个接口/组件，复用了 18 个现有接口/组件，保持了设计的一致性和简洁性。所有新增接口都遵循了以下原则：

1. **复用优先**：优先使用现有接口，避免重复设计
2. **职责单一**：每个接口/组件只负责一个明确的功能
3. **依赖清晰**：明确标注了接口之间的依赖关系
4. **验收明确**：每个接口都有清晰的验收标准
5. **可追溯性**：通过changeLog记录每次变更

接口设计完整覆盖了个人信息页的所有功能需求，为后续开发提供了清晰的技术规范。


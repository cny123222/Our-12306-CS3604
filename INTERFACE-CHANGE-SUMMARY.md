# 个人信息页接口变更摘要

## 变更概述
新增个人信息页功能模块，包括用户基本信息、手机核验、乘客管理和历史订单四大页面。

## 新增UI组件（共13个）

### 1. 用户基本信息页
- **UI-UserProfilePage**: 用户基本信息页主容器
- **UI-LeftSidebar**: 左侧功能菜单栏
- **UI-UserInfoPanel**: 用户信息展示面板

### 2. 手机核验页
- **UI-PhoneVerificationPage**: 手机核验页主容器
- **UI-PhoneVerificationPanel**: 手机核验信息展示面板
- **UI-PhoneVerificationModal**: 手机验证弹窗

### 3. 乘客管理页
- **UI-PassengerManagementPage**: 乘客管理页主容器
- **UI-PassengerListPanel**: 乘车人信息展示面板
- **UI-AddPassengerPanel**: 添加乘车人面板
- **UI-EditPassengerPanel**: 编辑乘车人面板

### 4. 历史订单页
- **UI-OrderHistoryPage**: 历史订单页主容器
- **UI-OrderFilterPanel**: 订单筛选区域
- **UI-OrderList**: 订单列表组件
- **UI-OrderItem**: 订单列表项组件

## 新增API接口（共10个）

1. **API-GET-UserProfile**: 获取用户个人信息
2. **API-PUT-UserContactInfo**: 更新用户联系方式（邮箱）
3. **API-POST-VerifyPhoneChange**: 验证并更新用户手机号
4. **API-GET-UserOrders**: 获取用户历史订单列表
5. **API-PUT-UpdatePassenger**: 更新乘客信息
6. **API-DELETE-Passenger**: 删除乘客信息
7. **API-POST-CheckPassengerDuplicate**: 检查乘客是否已存在

## 新增数据库操作（共7个）

1. **DB-GetUserProfile**: 获取用户完整个人信息
2. **DB-UpdateUserPhone**: 更新用户手机号
3. **DB-UpdateUserEmail**: 更新用户邮箱
4. **DB-GetUserOrders**: 获取用户订单列表
5. **DB-CheckPassengerDuplicate**: 检查乘客是否重复

## 核心功能测试点

### 用户基本信息页
- 页面布局和导航
- 基本信息展示（用户名、姓名、证件、核验状态）
- 联系方式展示和编辑（手机号脱敏、邮箱）
- 附加信息展示（优惠类型）
- 左侧菜单栏交互

### 手机核验页
- 手机号格式验证（11位数字）
- 手机号脱敏显示
- 密码验证
- 验证码发送和验证
- 手机号更新成功

### 乘客管理页
- 乘客列表展示（表格）
- 乘客搜索功能
- 添加乘客（姓名、证件、手机号验证）
- 编辑乘客（联系方式）
- 删除乘客（单个/批量）
- 重复乘客检查

### 历史订单页
- 订单列表展示
- 日期筛选（起始日期、结束日期）
- 关键词搜索（订单号/车次/姓名）
- 无订单提示
- 温馨提示区域

## 测试策略

1. **单元测试**: 为每个组件生成独立的单元测试
2. **集成测试**: 测试前后端API通信
3. **E2E测试**: 测试完整的用户流程
4. **验证测试**: 测试各种输入验证规则
5. **UI元素测试**: 验证所有UI元素的存在性和可交互性

## 边界情况和错误处理

1. 手机号格式验证（过短、过长、非数字）
2. 姓名格式验证（长度、特殊字符）
3. 证件号码验证（长度、格式、重复）
4. 数据库操作失败处理
5. 网络请求失败处理
6. 登录状态检查
7. 权限验证

生成时间: 2025-11-14


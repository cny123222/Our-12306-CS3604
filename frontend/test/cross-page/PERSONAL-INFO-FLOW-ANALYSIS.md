# 个人信息页跨页流程分析

## 📋 流程梳理目标

根据05-个人信息页需求文档，梳理所有与个人信息页相关的跨页面流程。

## 🔄 核心跨页流程列表

### 1. 导航到个人信息页流程

#### 1.1 从首页进入个人信息页
```
路径：HomePage -> 个人中心按钮 -> PersonalInfoPage
前置条件：用户已登录
关键数据：token存在于localStorage
验证点：
- 顶部导航显示个人中心入口
- 点击后正确跳转到/personal-info
- 页面加载用户信息
```

#### 1.2 从其他页面通过顶部导航进入
```
路径：TrainListPage/OrderPage -> 个人中心按钮 -> PersonalInfoPage
前置条件：用户已登录
验证点：
- 任何页面都可以通过顶部导航访问个人中心
```

#### 1.3 未登录访问个人中心
```
路径：HomePage -> 个人中心按钮 -> LoginPage
前置条件：用户未登录
验证点：
- 提示需要登录
- 跳转到登录页
- 登录成功后跳转回个人中心
```

### 2. 个人信息页内部导航流程

#### 2.1 侧边菜单导航
```
路径：PersonalInfoPage -> 侧边菜单选择 -> 不同子页面
子页面：
- 查看个人信息（PersonalInfoPage）
- 手机核验（PhoneVerificationPage）
- 火车票订单（OrderHistoryPage）
- 乘车人（PassengerManagementPage）

验证点：
- 侧边菜单高亮正确
- 页面内容正确切换
- URL正确更新
- 面包屑导航正确显示
```

### 3. 手机核验流程

#### 3.1 进入手机核验页
```
路径：PersonalInfoPage -> 联系方式模块-编辑 -> 去手机核验修改 -> PhoneVerificationPage
前置条件：用户已登录
验证点：
- 联系方式模块显示编辑按钮
- 点击编辑后显示"去手机核验修改"链接
- 正确跳转到手机核验页
- 原手机号正确显示（脱敏）
```

#### 3.2 完成手机核验流程
```
路径：PhoneVerificationPage -> 输入新手机号和密码 -> 手机验证弹窗 -> 输入验证码 -> PersonalInfoPage
数据流：
- 请求发送验证码（API-POST-UpdatePhoneRequest）
- 获取sessionId
- 确认验证码（API-POST-ConfirmPhoneUpdate）
- 更新成功提示
- 返回个人信息页

验证点：
- 新手机号验证（11位）
- 密码验证（非空）
- 验证码弹窗正确显示
- 验证码验证（6位）
- 成功后手机号更新
- 返回个人信息页后显示新手机号
```

#### 3.3 取消手机核验
```
路径：PhoneVerificationPage -> 取消按钮 -> PersonalInfoPage
验证点：
- 取消按钮正确工作
- 返回个人信息页
- 手机号未更改
```

### 4. 乘客管理流程

#### 4.1 进入乘客管理页
```
路径：PersonalInfoPage -> 侧边菜单-乘车人 -> PassengerManagementPage
前置条件：用户已登录
验证点：
- 乘客列表正确加载
- 显示所有乘客信息（脱敏）
```

#### 4.2 添加乘客流程
```
路径：PassengerManagementPage -> 添加按钮 -> AddPassengerPanel -> 填写表单 -> 保存 -> 乘客列表
数据流：
- 输入证件类型、姓名、证件号码、手机号、优惠类型
- 前端验证（格式、长度）
- API调用（API-POST-AddPassenger）
- 成功后返回列表
- 列表中显示新乘客

验证点：
- 表单验证正确工作
- API调用成功
- 新乘客显示在列表中
- 数据脱敏正确
```

#### 4.3 编辑乘客流程
```
路径：PassengerManagementPage -> 编辑按钮 -> EditPassengerPanel -> 修改手机号 -> 保存 -> 乘客列表
数据流：
- 显示乘客基本信息（只读）
- 允许修改手机号
- API调用（API-PUT-Passenger）
- 成功后返回列表
- 列表中显示更新后的手机号

验证点：
- 乘客信息正确加载
- 手机号验证工作
- API调用成功
- 更新后的信息正确显示
```

#### 4.4 删除乘客流程
```
路径：PassengerManagementPage -> 删除按钮 -> 确认对话框 -> 乘客列表更新
数据流：
- 点击删除按钮
- 显示确认对话框
- API调用（API-DELETE-Passenger）
- 成功后从列表中移除

验证点：
- 确认对话框显示
- 取消删除时不执行
- 确认删除后乘客被移除
- 列表正确更新
```

#### 4.5 搜索乘客流程
```
路径：PassengerManagementPage -> 搜索框输入 -> 查询按钮 -> 筛选后的列表
验证点：
- 搜索框正常工作
- 按姓名筛选正确
- 清空搜索后显示所有乘客
```

### 5. 历史订单查询流程

#### 5.1 进入历史订单页
```
路径：PersonalInfoPage -> 侧边菜单-火车票订单 -> OrderHistoryPage
前置条件：用户已登录
验证点：
- 订单列表正确加载
- 显示历史订单
```

#### 5.2 搜索订单流程
```
路径：OrderHistoryPage -> 设置日期范围和关键词 -> 查询按钮 -> 筛选后的订单列表
数据流：
- 输入开始日期、结束日期
- 输入订单号/车次/姓名
- API调用（API-GET-UserOrders-Search）
- 显示匹配的订单

验证点：
- 日期选择器工作正常
- 关键词搜索正确
- API调用成功
- 筛选结果正确显示
```

#### 5.3 无订单状态
```
路径：OrderHistoryPage -> 空订单列表 -> 点击"车票预订" -> TrainListPage
验证点：
- 空状态提示正确显示
- "车票预订"链接可点击
- 正确跳转到车次列表页
```

### 6. 邮箱编辑流程

#### 6.1 编辑邮箱
```
路径：PersonalInfoPage -> 联系方式模块-编辑 -> 编辑邮箱输入框 -> 保存
数据流：
- 点击编辑按钮
- 显示邮箱输入框
- 输入新邮箱
- API调用（API-PUT-UserEmail）
- 成功后更新显示

验证点：
- 编辑模式正确切换
- 邮箱格式验证
- API调用成功
- 新邮箱正确显示
- 可以取消编辑
```

### 7. 返回首页流程

#### 7.1 Logo点击返回首页
```
路径：PersonalInfoPage/PhoneVerificationPage/PassengerManagementPage/OrderHistoryPage -> Logo点击 -> HomePage
验证点：
- Logo可点击
- 正确跳转到首页
- 登录状态保持
```

## 🎯 优先级分级

### P0 - 核心流程（必须实现）
1. ✅ 登录后进入个人信息页
2. ✅ 未登录访问个人中心跳转到登录页
3. ✅ 侧边菜单导航到各子页面
4. ✅ 手机核验完整流程
5. ✅ 添加乘客完整流程
6. ✅ 编辑乘客完整流程
7. ✅ 删除乘客流程

### P1 - 重要流程（应该实现）
8. ✅ 搜索乘客流程
9. ✅ 历史订单查询流程
10. ✅ 邮箱编辑流程
11. ✅ Logo点击返回首页

### P2 - 次要流程（可选）
12. 从订单页快速进入乘客管理
13. 从乘客管理返回订单页
14. 批量删除乘客

## 📝 测试文件规划

### 文件1: PersonalInfoNavigation.cross.spec.tsx
- 进入个人信息页的各种路径
- 未登录拦截测试
- 侧边菜单导航测试

### 文件2: PhoneVerificationFlow.cross.spec.tsx
- 完整的手机核验流程
- 取消流程
- 验证码错误处理
- 返回个人信息页

### 文件3: PassengerManagementFlow.cross.spec.tsx
- 添加乘客流程
- 编辑乘客流程
- 删除乘客流程
- 搜索乘客流程

### 文件4: OrderHistoryFlow.cross.spec.tsx
- 订单查询流程
- 搜索订单流程
- 空状态跳转流程

### 文件5: PersonalInfoEditing.cross.spec.tsx
- 邮箱编辑流程
- 取消编辑
- 保存成功后验证

## 🔍 关键验证点汇总

### 导航验证
- URL正确更新
- 面包屑正确显示
- 侧边菜单高亮正确
- 页面标题正确

### 数据验证
- API调用成功
- 请求参数正确
- 响应数据正确
- 本地状态更新
- UI显示更新

### 安全验证
- Token验证
- 未授权访问拦截
- 数据脱敏正确

### 用户体验验证
- 加载状态显示
- 错误提示正确
- 成功反馈明确
- 取消操作正确

## 📊 流程关系图

```
                      HomePage
                         |
                         v
              [登录检查] LoginPage
                         |
                  [已登录] ↓
              PersonalInfoPage (主页)
                    /    |    \
                   /     |     \
                  /      |      \
                 /       |       \
    PhoneVerification  OrderHistory  PassengerManagement
         |                  |              /    |    \
    [验证码弹窗]        [搜索筛选]        /     |     \
         |                  |          Add   Edit  Delete
    [成功返回]          [空状态跳转]      |     |     |
         ↓                  ↓          [保存返回]
    PersonalInfoPage   TrainListPage       ↓
                                    PassengerList
```

## ✅ 下一步行动

1. 生成5个跨页测试文件
2. 每个文件覆盖对应的流程分类
3. 使用Vitest + React Testing Library
4. Mock所有API调用
5. 验证所有关键点
6. 确保测试100%通过

---

**分析完成时间：** 2025-01-14
**分析工程师：** AI跨页流程测试工程师
**下一步：** 生成跨页测试代码


# 测试文档 - 12306注册功能

## 📋 概述

本文档说明如何运行测试，以及测试的组织结构。

## 🏗️ 测试架构

### 测试分层
1. **单元测试** - 测试独立的函数和组件
2. **集成测试** - 测试API路由和数据库交互
3. **系统验证** - 验证整个系统的连通性

### 技术栈
- **前端测试**: Vitest + React Testing Library
- **后端测试**: Jest + Supertest
- **系统验证**: Node.js原生http模块

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 运行测试

#### 后端测试
```bash
cd backend
npm test -- --verbose --bail --forceExit
```

#### 前端测试
```bash
cd frontend
npm test -- --run --reporter=verbose --bail=1
```

#### 系统验证
```bash
# 从项目根目录运行
node verify-system.js
```

## 📁 测试文件结构

```
Our-12306-CS3604/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── registrationDbService.js      # 数据库服务实现
│   │   └── routes/
│   │       └── register.js                    # 注册API路由
│   └── test/
│       ├── services/
│       │   └── registrationDbService.test.js  # 数据库服务测试
│       └── routes/
│           └── register.test.js               # API路由测试
├── frontend/
│   ├── src/
│   │   └── components/
│   │       ├── RegisterForm.tsx               # 注册表单组件
│   │       ├── ValidationInput.tsx            # 验证输入框组件
│   │       ├── SelectDropdown.tsx             # 下拉选择组件
│   │       └── SuccessModal.tsx               # 成功弹窗组件
│   └── test/
│       └── components/
│           ├── RegisterForm.test.tsx          # 注册表单测试
│           ├── ValidationInput.test.tsx       # 验证输入框测试
│           ├── SelectDropdown.test.tsx        # 下拉选择测试
│           └── SuccessModal.test.tsx          # 成功弹窗测试
└── verify-system.js                            # 系统验证脚本
```

## 🧪 测试覆盖范围

### 后端测试 (backend/test/)

#### 数据库服务测试 (registrationDbService.test.js)
- ✅ `DB-FindUserByUsername` - 根据用户名查找用户
- ✅ `DB-FindUserByIdCardNumber` - 根据证件号查找用户
- ✅ `DB-CreateUser` - 创建新用户
- ✅ `DB-CreateEmailVerificationCode` - 创建邮箱验证码
- ✅ `DB-VerifyEmailCode` - 验证邮箱验证码

#### API路由测试 (register.test.js)
- ✅ `API-POST-ValidateUsername` - 验证用户名
- ✅ `API-POST-ValidatePassword` - 验证密码
- ✅ `API-POST-ValidateName` - 验证姓名
- ✅ `API-POST-ValidateIdCard` - 验证证件号
- ✅ `API-POST-ValidateEmail` - 验证邮箱
- ✅ `API-POST-ValidatePhone` - 验证手机号
- ✅ `API-POST-Register` - 用户注册
- ✅ `API-POST-SendRegistrationVerificationCode` - 发送验证码
- ✅ `API-POST-CompleteRegistration` - 完成注册
- ✅ `API-GET-ServiceTerms` - 获取服务条款
- ✅ `API-GET-PrivacyPolicy` - 获取隐私政策

### 前端测试 (frontend/test/)

#### RegisterForm组件测试
覆盖需求文档中的所有验证场景：
- ✅ UI元素存在性检查（所有输入框、按钮、标签）
- ✅ 用户名验证（长度、格式、唯一性）
- ✅ 密码验证（长度、复杂度）
- ✅ 确认密码验证（一致性）
- ✅ 证件类型选择（8种证件类型）
- ✅ 姓名验证（长度、字符类型）
- ✅ 证件号码验证（长度、格式、唯一性）
- ✅ 优惠类型选择（4种优惠类型）
- ✅ 邮箱验证（格式）
- ✅ 手机号验证（长度、格式）
- ✅ 用户协议勾选和表单提交

#### ValidationInput组件测试
- ✅ UI元素渲染（必填标识、输入框）
- ✅ 输入和验证功能
- ✅ 不同输入类型支持
- ✅ 最大长度限制
- ✅ 实时验证
- ✅ 错误提示显示
- ✅ 绿色勾勾显示

#### SelectDropdown组件测试
- ✅ UI元素渲染（占位符、选中值、箭头）
- ✅ 展开和收起功能
- ✅ 选项选择功能
- ✅ 禁用状态
- ✅ 边界条件处理

#### SuccessModal组件测试
- ✅ 弹窗显示和隐藏
- ✅ 消息内容显示
- ✅ 确认按钮功能
- ✅ 弹窗尺寸和位置（30%页面大小，居中）
- ✅ 遮罩层功能
- ✅ 可访问性

### 系统验证 (verify-system.js)
- ✅ 后端服务启动验证
- ✅ 前端服务启动验证
- ✅ CORS配置验证
- ✅ 注册相关API端点可访问性验证
- ✅ 数据库连接验证
- ✅ 完整注册流程验证

## ⚙️ 配置说明

### 前端测试配置 (vitest.config.ts)
```typescript
export default {
  test: {
    testTimeout: 10000,      // 测试超时10秒
    hookTimeout: 10000,      // 钩子超时10秒
    teardownTimeout: 10000,  // 清理超时10秒
    bail: 1,                 // 遇到第一个失败立即停止
    reporters: ['verbose'],  // 详细输出
  }
}
```

### 后端测试配置 (jest.config in package.json)
```json
{
  "testTimeout": 10000,
  "bail": 1,
  "verbose": true,
  "forceExit": true,
  "detectOpenHandles": true
}
```

## 📊 运行测试的推荐顺序

### 1. 首先运行后端测试
```bash
cd backend
npm test
```
这将验证：
- 数据库操作正确
- API路由配置正确
- 验证逻辑正确

### 2. 然后运行前端测试
```bash
cd frontend
npm test
```
这将验证：
- 组件渲染正确
- 用户交互正确
- 验证逻辑正确

### 3. 最后运行系统验证
```bash
# 确保后端和前端服务都在运行
# 终端1: cd backend && npm run dev
# 终端2: cd frontend && npm run dev
# 终端3: node verify-system.js
node verify-system.js
```

## 🐛 常见问题

### 测试超时
**问题**: 测试运行超时
**解决**: 
- 检查数据库连接
- 确保测试环境配置正确
- 增加超时时间配置

### 端口冲突
**问题**: 系统验证脚本无法连接到服务
**解决**:
- 确保后端服务运行在3000端口
- 确保前端服务运行在5173端口
- 检查防火墙设置

### 数据库锁定
**问题**: SQLite数据库被锁定
**解决**:
- 使用 `forceExit: true` 配置
- 确保测试后正确清理连接
- 使用独立的测试数据库

## 📝 测试编写规范

### 1. 测试命名
- 使用描述性的测试名称
- 使用Given-When-Then格式
- 明确测试的验收标准

### 2. 测试数据
- 使用真实有效的测试数据
- 避免使用占位符（如"test@test.com"）
- 每个测试使用不同的数据避免冲突

### 3. 测试隔离
- 每个测试独立运行
- 使用beforeEach/afterEach清理数据
- 不依赖测试执行顺序

### 4. 断言
- 使用精确的断言
- 验证所有关键行为
- 包含错误场景测试

## 🎯 测试成功标准

测试被认为成功当且仅当：
1. ✅ 所有单元测试通过
2. ✅ 所有集成测试通过
3. ✅ 系统验证脚本所有检查通过
4. ✅ 测试覆盖率达到要求
5. ✅ 没有警告或错误信息

## 📚 相关文档

- [需求文档](./requirements/02-登录注册页/02-2-注册页.md)
- [接口定义](./.artifacts/)
- [系统架构](./AGENTS.md)

## 🤝 贡献

如果发现测试问题或需要添加新测试，请：
1. 查看对应的需求文档
2. 确保测试覆盖所有acceptanceCriteria
3. 遵循测试编写规范
4. 运行所有测试确保通过

---

**记住：测试是确保代码质量的第一道防线！**


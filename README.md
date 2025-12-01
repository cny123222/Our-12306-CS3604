# Our-12306-CS3604

**Group ID:** 1

**Group Member:** Nuoyan Chen, Jiamin Liu, Yuxin Wang

## 项目简介

基于测试驱动开发(TDD)的12306铁路订票系统，采用前后端分离架构。

---

## ⚠️ 重要提示：给贡献者的开发指南

**如果您计划基于本项目继续开发新功能并提交 Pull Request，请务必仔细阅读以下内容：**

### 📋 我们的开发流程

本项目遵循严格的开发流程，确保代码质量和可维护性：

1. **需求文档** → 在 `requirements/` 目录下编写详细的需求文档
2. **测试用例** → 基于需求文档编写完整的测试用例（单元测试、集成测试）
3. **代码生成** → 在测试驱动下实现功能代码
4. **验证页面实现效果** → 确保前端UI与需求文档一致
5. **手动调试UI界面** → 精细调整界面样式和交互体验
6. **验收** → 通过所有测试用例并完成功能验收

### 🔍 Pull Request 要求

**在提交 Pull Request 之前，请确保您已经：**

1. **充分理解现有代码架构**
   - 熟悉项目的目录结构和代码组织方式
   - 理解前后端分离架构的设计理念
   - 了解现有的服务层、控制器层、路由层的职责划分
   - 遵循项目既定的代码规范和命名约定

2. **提供完整的测试脚本**
   - 所有新增功能必须包含对应的测试用例
   - 测试脚本应放在相应的 `test/` 目录下
   - 确保测试用例能够独立运行并通过

3. **编写明确的说明文档**
   - **测试脚本运行说明**：详细说明如何运行测试，包括：
     - 测试命令
     - 前置条件（如需要初始化数据）
     - 预期输出
   - **功能实现说明**：清晰描述：
     - 实现了哪些功能
     - 功能的使用方式
     - 技术实现要点
   - **需求文档位置**：明确指出对应的需求文档路径（`requirements/` 目录下的具体文件）

### 📝 Pull Request 模板

提交 Pull Request 时，请在描述中包含以下信息：

```markdown
## 功能描述
[简要描述新增的功能]

## 需求文档位置
[requirements/XX-功能名称/XX-功能名称.md]

## 测试脚本运行说明
### 后端测试
```bash
cd backend
npm test -- [测试文件路径]
```

### 前端测试
```bash
cd frontend
npm test -- [测试文件路径]
```

## 功能实现情况
- [ ] 已完成功能1
- [ ] 已完成功能2
- [ ] 测试用例全部通过
- [ ] UI界面已调试完成


### ✅ 验收标准

您的 Pull Request 将被评估以下方面：

- ✅ **代码符合项目架构和规范**
- ✅ **所有现有测试必须全部通过**（后端和前端）
  - 在 `backend/` 目录运行 `npm test` 必须全部通过（17个测试套件，371个测试用例）
  - 在 `frontend/` 目录运行 `npm test` 必须全部通过（48个测试文件，674个测试用例）
- ✅ **必须通过 GitHub Actions 自动化测试**
  - **后端测试工作流**（`.github/workflows/backend-tests.yml`）必须全部通过
  - **前端测试工作流**（`.github/workflows/frontend-tests.yml`）必须全部通过
  - Pull Request 页面会显示测试状态，所有测试必须显示 ✅ 绿色通过状态
  - 如果任何测试失败，Pull Request 将无法合并
- ✅ **新功能必须包含完整的测试用例**
  - 后端新功能需添加对应的测试文件到 `backend/test/` 目录
  - 前端新功能需添加对应的测试文件到 `frontend/test/` 目录
  - 测试应覆盖正常流程、异常流程和边界条件
- ✅ **功能实现与需求文档一致**
- ✅ **提供了完整的测试脚本和说明文档**
- ✅ **UI界面实现效果符合设计要求**

**⚠️ 重要：如果您的代码导致任何现有测试失败，或者没有为新功能添加测试用例，或者 GitHub Actions 测试未通过，Pull Request 将被要求修改或拒绝合并。**

**测试验证步骤：**
```bash
# 1. 确保所有现有测试通过
cd backend && npm test
cd ../frontend && npm test

# 2. 运行新功能的测试
# 确保新增的测试用例也能通过

# 3. 提交前再次验证
# 确保没有引入任何测试失败

# 4. 提交 Pull Request 后检查 GitHub Actions
# - 在 Pull Request 页面查看测试状态
# - 确保 "Backend Tests" 和 "Frontend Tests" 都显示 ✅ 通过
# - 如果测试失败，请查看详细错误信息并修复后重新提交
```

---

## 技术栈

### 前端
- React 18 + TypeScript
- React Router DOM
- Vite (构建工具)
- Vitest + React Testing Library (测试框架)

### 后端
- Node.js + Express.js
- SQLite (数据库)
- Jest + Supertest (测试框架)
- JWT (身份认证)

### CI/CD
- GitHub Actions (自动化测试和持续集成)
  - 后端测试工作流：自动运行 Jest 测试并生成覆盖率报告
  - 前端测试工作流：自动运行 Vitest 测试并生成覆盖率报告
  - 触发条件：push 到 main 分支和 Pull Request
  - 测试结果和覆盖率报告自动上传为 artifacts

## 项目结构

```
├── backend/                     # 后端代码
│   ├── src/                    # 源代码
│   │   ├── app.js             # Express应用配置
│   │   ├── server.js          # 服务器启动入口
│   │   ├── routes/            # 路由定义
│   │   ├── controllers/       # 控制器
│   │   ├── services/          # 业务逻辑服务
│   │   ├── middleware/        # 中间件
│   │   ├── config/            # 配置文件
│   │   ├── database/          # 数据库模块
│   │   └── utils/             # 工具函数
│   ├── database/              # 数据库相关
│   │   ├── railway.db         # SQLite数据库文件
│   │   ├── init-trains-data.js    # 初始化列车数据
│   │   ├── init-passengers-orders.js  # 初始化乘客订单
│   │   └── migrations/        # 数据库迁移脚本
│   ├── scripts/               # 工具脚本
│   │   ├── test-*.js          # 各种测试脚本
│   │   └── fix-*.js           # 数据修复脚本
│   ├── test/                  # 测试文件
│   │   ├── routes/            # 路由测试
│   │   ├── services/          # 服务测试
│   │   ├── integration/       # 集成测试
│   │   └── setup.js           # 测试环境配置
│   ├── coverage/              # 测试覆盖率报告
│   └── package.json           # 依赖配置
├── frontend/                   # 前端代码
│   ├── src/                   # 源代码
│   │   ├── components/        # React组件
│   │   ├── pages/             # 页面组件
│   │   ├── App.tsx            # 应用主组件
│   │   └── main.tsx           # 应用入口
│   ├── public/                # 静态资源
│   ├── test/                  # 测试文件
│   ├── vite.config.ts         # Vite配置
│   ├── vitest.config.ts       # Vitest配置
│   └── package.json           # 依赖配置
├── requirements/              # 需求文档
│   ├── 00-规范与约定.md
│   ├── 01-首页查询页/
│   ├── 02-登录注册页/
│   ├── 03-车次列表页/
│   ├── 04-订单填写页/
│   ├── 05-个人信息页/
│   └── 06-支付页和购票成功页/
├── .github/                   # GitHub 配置
│   └── workflows/             # GitHub Actions 工作流
│       ├── backend-tests.yml  # 后端测试工作流
│       └── frontend-tests.yml  # 前端测试工作流
├── system_prompt/             # AI开发提示词
├── user_pronpt.md             # agent使用流程及用户提示词
├── README.md                  # 项目说明
└── AGENTS.md                  # （cursor平台使用），agent系统提示词放置处
```

## 环境要求

- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **SQLite3**: 3.x（Node.js sqlite3包已包含）
- **操作系统**: Windows / macOS / Linux
- **浏览器**: Chrome、Firefox、Safari、Edge（推荐使用最新版本）

## 端口配置

- **前端开发服务器**: 5173（Vite默认端口）
- **后端API服务器**: 3000
- **数据库**: SQLite（本地文件数据库，无需额外端口）

## 快速开始

### 1. 安装依赖

```bash
# 安装根目录依赖（可选，用于集成测试）
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 初始化数据库

**首次运行前必须执行此步骤：**

```bash
cd backend/database
node init-database.js
node init-from-json-test.js
#node init-from-json.js
```

该脚本将：
- 从 `requirements/03-车次列表页/车次信息.json` 读取车次数据
- 生成从当前日期开始的前5个车次(大部分为北京与上海之间)，前3天数据的测试数据集
- 执行时间约2-3分钟
- 若需生成完整车次信息数据库，使用node init-from-json.js，执行时间会较长
- init-from-json.js 和 init-from-json-test.js会删除所有车次相关数据再进行添加；

**输出示例：**
```
✅ 测试数据初始化完成！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 统计信息:
   - 车次总数: 15 条
   - 座位记录: 107592 条
   - 日期范围: 2025-11-30 ~ 2025-12-02
   - 每日车次: 5 个
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. 启动开发服务器

在**两个独立的终端窗口**中分别运行：

**终端1 - 启动后端服务**（端口: 3000）：
```bash
cd backend
npm run dev
```

**终端2 - 启动前端服务**（端口: 5173）：
```bash
cd frontend
npm run dev
```

### 4. 访问应用

在浏览器中打开：http://localhost:5173

## 生产环境部署

### 构建前端
```bash
cd frontend
npm run build
# 生成的静态文件在 frontend/dist/ 目录
```

### 启动生产环境后端
```bash
cd backend
npm start
```

### 使用进程管理器（PM2）
```bash
# 安装PM2
npm install -g pm2

# 启动后端服务
cd backend
pm2 start src/server.js --name "12306-backend"

# 常用命令
pm2 status          # 查看服务状态
pm2 logs 12306-backend  # 查看日志
pm2 stop 12306-backend  # 停止服务
```

## 测试驱动开发流程

本项目遵循TDD原则：

1. **红色阶段**: 编写失败的测试用例
2. **绿色阶段**: 编写最小化代码使测试通过
3. **重构阶段**: 优化代码结构和性能

### 📊 当前测试状态

#### 后端测试（Backend）
在 `backend/` 目录下运行 `npm test` 的结果：
```
Test Suites: 17 passed, 17 total
Tests:       10 skipped, 371 passed, 381 total
Snapshots:   0 total
Time:        ~29s
```

**测试覆盖范围：**
- ✅ 路由层测试（API端点）
- ✅ 服务层测试（业务逻辑）
- ✅ 数据库操作测试
- ✅ 集成测试（完整业务流程）
- ✅ 错误处理测试
- ✅ 边界条件测试

#### 前端测试（Frontend）
在 `frontend/` 目录下运行 `npm test` 的结果：
```
Test Files:  48 passed | 1 skipped (49)
Tests:       674 passed | 19 skipped (693)
Duration:    ~7s
```

**测试覆盖范围：**
- ✅ 跨页面测试场景（Cross-page tests）
- ✅ 前端组件单元测试（Component tests）
- ✅ 页面级集成测试（Page tests）
- ✅ 用户交互测试（User interaction tests）
- ✅ UI渲染测试（UI rendering tests）
- ✅ 表单验证测试（Form validation tests）

### 🎯 测试覆盖完整性

本项目已实现**完整的测试覆盖**，包括：

1. **跨页面测试场景**
   - 完整的用户流程测试（注册→登录→查询→订票→支付）
   - 页面间导航和数据传递测试
   - 状态管理测试

2. **前端组件测试**
   - 所有React组件的渲染测试
   - 组件交互逻辑测试
   - 表单组件验证测试
   - UI组件样式和布局测试

3. **后端组件测试**
   - API路由测试
   - 服务层业务逻辑测试
   - 数据库操作测试
   - 中间件测试
   - 错误处理测试

### ⚠️ 提交代码的测试要求

**所有 Pull Request 必须满足以下测试要求：**

1. **必须通过所有现有测试**
   ```bash
   # 后端测试必须全部通过
   cd backend
   npm test
   # 预期结果：所有测试通过，无失败用例
   
   # 前端测试必须全部通过
   cd frontend
   npm test
   # 预期结果：所有测试通过，无失败用例
   ```

2. **必须通过 GitHub Actions 自动化测试**
   - 提交 Pull Request 后，GitHub Actions 会自动运行后端和前端测试
   - **后端测试工作流**（`Backend Tests`）必须显示 ✅ 绿色通过状态
   - **前端测试工作流**（`Frontend Tests`）必须显示 ✅ 绿色通过状态
   - 如果任何工作流失败，Pull Request 将无法合并
   - 可以在 Pull Request 页面的"Checks"标签页查看详细的测试结果和覆盖率报告
   - 测试覆盖率报告会自动上传为 artifacts，可从 GitHub Actions 页面下载

3. **必须为新功能添加测试用例**
   - 新增的后端功能必须包含对应的测试文件（放在 `backend/test/` 目录下）
   - 新增的前端功能必须包含对应的测试文件（放在 `frontend/test/` 目录下）
   - 测试用例应覆盖正常流程、异常流程和边界条件

3. **测试命名规范**
   - 测试文件命名：`*.test.js`（后端）或 `*.test.tsx`（前端）
   - 测试用例应清晰描述测试场景和预期行为

4. **测试独立性**
   - 每个测试用例应独立运行，不依赖其他测试的执行顺序
   - 测试前后应自动清理数据，避免测试间相互影响

### 🧪 运行测试

#### 运行所有测试
```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

#### 运行特定测试文件
```bash
# 后端
cd backend
npm test -- test/routes/auth.test.js

# 前端
cd frontend
npm test -- test/components/LoginForm.test.tsx
```

#### 运行测试并查看覆盖率
```bash
# 后端
cd backend
npm run test:coverage

# 前端
cd frontend
npm run test:coverage
```

### 测试最佳实践
- 每个功能模块都有对应的测试文件
- 测试用例命名清晰，描述预期行为
- 使用独立的测试数据库，避免污染开发数据
- 测试前后自动清理数据
- 优先编写测试用例，再实现功能代码（TDD）
- 确保测试用例的可读性和可维护性

### 📚 测试用例文档

**重要**: 项目根目录下的 [`现有测试用例说明文档.md`](现有测试用例说明文档.md) 详细记录了所有测试用例文件的种类和状态。

**文档内容**：
- ✅ **测试文件清单**: 列出所有测试文件及其作用
- ✅ **状态标记**: 标记为 `✅ success` 的测试文件表示已通过所有测试用例；未标记的测试文件表示尚未开始修复或验证
- ✅ **测试覆盖范围**: 详细说明每个测试文件覆盖的功能点
- ✅ **测试用例统计**: 统计各类测试的文件数量和测试用例数

**文档维护要求**：
- ⚠️ **必须同步更新**: 当添加新的测试用例文件时，请同步更新 `现有测试用例说明文档.md`
- ⚠️ **状态更新**: 修复测试用例后，请在文档中标记为 `✅ success`
- ⚠️ **格式统一**: 新增测试文件说明时，请遵循文档中的统一格式

**查看测试文档**：
```bash
# 在项目根目录查看
cat 现有测试用例说明文档.md
```

## 主要功能模块

### 用户管理
- 用户注册与登录
- 短信验证码
- 身份证验证
- 会话管理（JWT）

### 车票查询与预订
- 车次查询（支持日期、出发地、目的地筛选）
- 实时余票查询
- 座位选择（商务座、一等座、二等座）
- 订单创建与支付

### 订单管理
- 订单查询
- 订单详情
- 订单状态管理（待支付、已支付、已取消、已过期）
- 自动过期订单清理（定时任务）

### 乘客管理
- 添加常用乘客
- 编辑乘客信息
- 乘客身份验证

## 数据库管理

### 数据库位置
- **开发数据库**: `backend/database/railway.db`
- **测试数据库**: `backend/test/test.db`（自动创建和清理）
- **数据库备份**: `backend/database/railway_backup_*.db`

### 数据库初始化脚本
```bash
cd backend/database

# 初始化车次数据（推荐使用）
node init-from-json.js

# 旧版初始化脚本（已弃用）
# node init-trains-data.js
# node init-passengers-orders.js
```

**数据库初始化说明：**
- 从 `requirements/03-车次列表页/车次信息.json` 读取车次配置
- 自动生成指定天数的车次数据
- 座位号格式：`车厢号-座位序号`（如 `1-01`, `4-25`）
- 数据库文件（railway.db）不提交到git，团队成员需本地运行此脚本生成

### 数据库迁移
```bash
cd backend/database/migrations

# 运行迁移脚本
node <migration-file>.js
```

## 环境配置(可选)

### 后端环境变量（可选）
在 `backend/` 目录下创建 `.env` 文件：
```env
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### 前端环境变量（可选）
在 `frontend/` 目录下创建 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3000
```

## 故障排除

### 端口被占用
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# macOS/Linux
lsof -i :3000
lsof -i :5173

# 终止占用端口的进程
kill -9 <PID>
```

### 数据库锁定问题
```bash
# 停止所有服务
pkill -f "node.*server.js"

# 删除测试数据库
rm backend/test/test.db

# 重新启动服务
./FULL-RESTART.sh
```

### 清除浏览器缓存
```javascript
// 在浏览器控制台执行
localStorage.clear();
sessionStorage.clear();
location.reload();
```

或使用快捷键：
- **macOS**: `Command + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

### npm依赖问题
```bash
# 清除npm缓存并重新安装
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

## 测试覆盖率

运行测试覆盖率命令后，可以查看详细报告：
```bash
# 后端测试覆盖率
cd backend
npm run test:coverage
# 报告位置: backend/coverage/index.html

# 前端测试覆盖率
cd frontend
npm run test:coverage
# 报告位置: frontend/coverage/index.html
```

用浏览器打开相应的HTML文件查看详细的测试覆盖率报告。

## 开发指南

### 代码规范
- **JavaScript/TypeScript**: 使用ESLint进行代码检查
- **命名规范**: 
  - 文件名使用kebab-case（如`user-service.js`）
  - 类名使用PascalCase（如`UserService`）
  - 函数和变量使用camelCase（如`getUserById`）
- **注释**: 关键业务逻辑必须添加注释说明

### Git工作流
```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送到远程
git push origin feature/your-feature-name
```

### 提交信息规范
- `feat`: 新功能
- `fix`: 修复bug
- `test`: 添加或修改测试
- `refactor`: 代码重构
- `docs`: 文档更新
- `style`: 代码格式调整
- `chore`: 构建或辅助工具变动

## 常见问题 (FAQ)

### 1. 启动后端时提示端口3000已被占用？
```bash
# 查找占用端口的进程
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 终止进程或使用 RESTART-BACKEND.sh 脚本
./RESTART-BACKEND.sh
```

### 2. 前端无法连接到后端API？
- 确认后端服务已启动（访问 http://localhost:3000 查看）
- 检查浏览器控制台的网络错误
- 确认前端API配置正确（应指向 http://localhost:3000）
- 检查CORS配置（后端已配置允许跨域）

### 3. 测试失败怎么办？
```bash
# 清理测试环境
rm backend/test/test.db

# 重新运行测试
cd backend
npm test -- --verbose
```

### 4. 数据库文件损坏？
```bash
# 使用备份文件恢复
cd backend/database
cp railway_backup_*.db railway.db

# 或重新初始化数据库
node init-database.js
node init-from-json-test.js
```

### 5. 如何调试代码？
- **后端调试**: 使用VS Code调试器或查看终端输出
- **前端调试**: 使用浏览器开发者工具（F12）
- **测试调试**: 使用 `npm test -- --verbose` 查看详细输出

## 注意事项

- ✅ 测试数据库会在每次测试运行时自动创建和清理
- ✅ 所有敏感信息（如JWT密钥）应通过环境变量配置
- ✅ 生产环境部署前请修改默认的JWT密钥
- ✅ 定时任务（如订单过期清理）在后端启动时自动运行
- ✅ 首次运行前必须执行数据库初始化脚本
- ✅ 支持Windows、macOS和Linux系统，部分脚本（如.sh文件）在Windows下需要Git Bash或WSL环境

## 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- **项目地址**: https://github.com/cny123222/Our-12306-CS3604
- **问题反馈**: https://github.com/cny123222/Our-12306-CS3604/issues

---

**最后更新**: 2025年11月

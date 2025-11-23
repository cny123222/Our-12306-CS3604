# Our-12306-CS3604

**Group ID:** 1

**Group Member:** Nuoyan Chen, Jiamin Liu, Yuxin Wang

## 项目简介

基于测试驱动开发(TDD)的12306铁路订票系统，采用前后端分离架构。

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

### 2. 初始化数据库（首次运行）

```bash
cd backend/database

# 初始化列车数据
node init-trains-data.js

# 初始化乘客和订单数据
node init-passengers-orders.js
```

### 3. 启动开发服务器

在**两个独立的终端窗口**中分别运行：

**终端1 - 启动后端服务**（端口: 3000）：
```bash
cd backend
npm run dev
# 或者使用 npm start 启动生产模式
```

**终端2 - 启动前端服务**（端口: 5173）：
```bash
cd frontend
npm run dev
```

### 4. 访问应用

在浏览器中打开：http://localhost:5173

## 生产环境部署（暂时无需）

### 构建前端
```bash
cd frontend
npm run build
# 生成的静态文件在 frontend/dist/ 目录
```

### 生产环境启动后端
```bash
cd backend
npm start
```

### 使用进程管理器（推荐）
使用 PM2 管理后端服务：
```bash
# 安装PM2
npm install -g pm2

# 启动后端服务
cd backend
pm2 start src/server.js --name "12306-backend"

# 查看服务状态
pm2 status

# 查看日志
pm2 logs 12306-backend

# 停止服务
pm2 stop 12306-backend
```

### 反向代理配置（Nginx示例）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 测试驱动开发流程

本项目遵循TDD原则：

1. **红色阶段**: 编写失败的测试用例
2. **绿色阶段**: 编写最小化代码使测试通过
3. **重构阶段**: 优化代码结构和性能

### 测试覆盖范围
- **单元测试**: 服务层、工具函数
- **集成测试**: API路由、数据库操作
- **端到端测试**: 完整用户流程

### 测试最佳实践
- 每个功能模块都有对应的测试文件
- 测试用例命名清晰，描述预期行为
- 使用独立的测试数据库，避免污染开发数据
- 测试前后自动清理数据

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

# 初始化车次数据（包含G1-G30等列车）
node init-trains-data.js

# 初始化测试用户和订单数据
node init-passengers-orders.js

# 生成每日车次（定时任务）
node generate-daily-trains.js
```

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

## 项目日志

启动脚本会将日志输出到：
- **后端日志**: `/tmp/backend.log` (Unix) 或查看终端输出 (Windows)
- **前端日志**: `/tmp/frontend.log` (Unix) 或查看终端输出 (Windows)

查看实时日志：
```bash
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

## 测试覆盖率

运行测试覆盖率后，可以查看详细报告：
- **后端覆盖率**: `backend/coverage/index.html`
- **前端覆盖率**: `frontend/coverage/index.html`

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

# 或重新初始化
node init-trains-data.js
node init-passengers-orders.js
```

### 5. 如何添加新的测试用户？
```bash
# 使用注册API或运行初始化脚本
cd backend/database
node init-passengers-orders.js
```

### 6. 如何调试后端代码？
```bash
# 使用VS Code调试器
# 或添加 console.log 后查看日志
tail -f /tmp/backend.log
```

## 注意事项

- 测试数据库会在每次测试运行时自动创建和清理
- 所有敏感信息（如JWT密钥）应通过环境变量配置
- 生产环境部署前请修改默认的JWT密钥
- 数据库文件包含在版本控制中，便于开发测试
- 定时任务（如订单过期清理）在后端启动时自动运行
- 首次运行前建议先执行数据库初始化脚本
- 支持Windows、macOS和Linux系统，但部分脚本（如.sh文件）在Windows下需要Git Bash或WSL环境

## 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- **项目地址**: https://github.com/cny123222/Our-12306-CS3604
- **问题反馈**: https://github.com/cny123222/Our-12306-CS3604/issues

---

**最后更新**: 2025年11月

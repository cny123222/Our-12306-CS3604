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
├── backend/                 # 后端代码
│   ├── src/                # 源代码
│   │   ├── app.js         # 应用入口
│   │   ├── routes/        # 路由定义
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   └── config/        # 配置文件
│   ├── test/              # 测试文件
│   └── package.json       # 依赖配置
├── frontend/               # 前端代码
│   ├── src/               # 源代码
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   └── test/          # 测试配置
│   ├── test/              # 测试文件
│   └── package.json       # 依赖配置
└── .artifacts/            # 接口定义文件
    ├── ui_interface.yml
    ├── api_interface.yml
    └── data_interface.yml
```

## 环境要求

- Node.js 18+ 
- npm 或 yarn
- SQLite3

## 安装和运行

### 1. 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

### 2. 运行测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd ../frontend
npm test
```

### 3. 启动开发服务器

```bash
# 启动后端服务 (端口: 3000)
cd backend
npm run dev

# 启动前端服务 (端口: 5173)
cd ../frontend
npm run dev
```

## 测试驱动开发流程

本项目遵循TDD原则：

1. **红色阶段**: 编写失败的测试用例
2. **绿色阶段**: 编写最小化代码使测试通过
3. **重构阶段**: 优化代码结构和性能

当前项目处于**红色阶段**，所有测试用例都已编写完成，但功能实现为空骨架，测试会失败。这为后续开发提供了明确的目标和验收标准。

## 主要功能模块

- 用户认证 (登录/注册)
- 短信验证
- 身份证验证
- 会话管理
- 密码找回

## 注意事项

- 测试数据库会在每次测试运行时自动创建和清理
- 所有敏感信息都通过环境变量配置
- 代码骨架仅用于测试框架，不包含实际业务逻辑

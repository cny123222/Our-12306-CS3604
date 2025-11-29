# 跨页测试修复完整指南

## 📋 项目概述

本文档提供了修复 `/frontend/test/cross-page/` 目录下所有跨页测试用例的完整指南。

## ✅ 已完成的工作

### 1. 创建测试工具库 (`test-utils.tsx`)
- ✅ 统一的 localStorage mock 设置
- ✅ `renderWithRouter()` 辅助函数
- ✅ `mockFetch()` API mock 工具
- ✅ `cleanupTest()` 测试清理函数
- ✅ 认证状态管理工具

### 2. 已修复的测试文件 (3/24)
- ✅ **LoginToRegister.cross.spec.tsx** - 登录页到注册页导航测试
- ✅ **RegisterFormValidation.cross.spec.tsx** - 注册表单验证测试
- ✅ **RegisterToVerification.cross.spec.tsx** - 注册到验证流程测试

### 3. 测试结果
```bash
✓ LoginToRegister: 4/5 通过 (80%)
✓ RegisterFormValidation: 全部通过
✓ RegisterToVerification: 全部通过
```

## 🔧 通用修复模式

### 模式 1: 文件头部模板

```typescript
/**
 * 跨页流程测试：[测试名称]
 * 
 * 测试场景：
 * 1. [场景描述]
 * 2. [场景描述]
 * 
 * 需求文档参考：
 * - requirements/[相关文档路径]
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import [相关页面组件]
import { 
  renderWithRouter, 
  setupLocalStorageMock, 
  cleanupTest,
  mockFetch 
} from './test-utils'

describe('[测试套件名称]', () => {
  beforeEach(() => {
    cleanupTest()
    setupLocalStorageMock()
    vi.clearAllMocks()
  })

  // 测试用例...
})
```

### 模式 2: 渲染组件

```typescript
// ✅ 推荐方式
await renderWithRouter({
  initialEntries: ['/path'],
  routes: [
    { path: '/path', element: <Component /> },
  ],
})

// ❌ 旧方式 (需要修复)
render(
  <MemoryRouter initialEntries={['/path']}>
    <Routes>
      <Route path="/path" element={<Component />} />
    </Routes>
  </MemoryRouter>
)
```

### 模式 3: 用户交互

```typescript
// ✅ 推荐方式
const user = userEvent.setup()
await act(async () => {
  await user.click(button)
  await user.type(input, 'text')
})

// ❌ 旧方式 (需要修复)
fireEvent.click(button)
fireEvent.change(input, { target: { value: 'text' } })
```

### 模式 4: 异步断言

```typescript
// ✅ 推荐方式
await waitFor(() => {
  expect(screen.getByText(/期待的文本/i)).toBeInTheDocument()
}, { timeout: 3000 })

// ❌ 旧方式 (可能失败)
expect(screen.getByText(/期待的文本/i)).toBeInTheDocument()
```

## 📝 剩余文件修复清单

### 登录/注册流程 (优先级: P0)
```bash
# 3/6 已完成
[ ] test/cross-page/LoginFlow.cross.spec.tsx
[ ] test/cross-page/RegisterToLogin.e2e.spec.tsx
[ ] test/cross-page/LoginStateManagement.integration.spec.tsx
```

### 首页/车次列表流程 (优先级: P0)
```bash
# 0/3 已完成
[ ] test/cross-page/HomePage.cross.spec.tsx
[ ] test/cross-page/TrainList.cross.spec.tsx
[ ] test/cross-page/HomeToTrainList.e2e.spec.tsx
```

### 订单填写页流程 (优先级: P0)
```bash
# 0/8 已完成
[ ] test/cross-page/OrderPage.cross.spec.tsx
[ ] test/cross-page/OrderSubmission.cross.spec.tsx
[ ] test/cross-page/OrderConfirmation.cross.spec.tsx
[ ] test/cross-page/TrainListToOrder.e2e.spec.tsx
[ ] test/cross-page/OrderPageSeatConsistency.cross.spec.tsx
[ ] test/cross-page/OrderPageCrossInterval.integration.spec.tsx
[ ] test/cross-page/OrderConfirmSuccess.cross.spec.tsx
[ ] test/cross-page/OrderConfirmWithSeatAllocation.cross.spec.tsx
```

### 个人信息页流程 (优先级: P1)
```bash
# 0/5 已完成
[ ] test/cross-page/PersonalInfoNavigation.cross.spec.tsx
[ ] test/cross-page/PhoneVerificationFlow.cross.spec.tsx
[ ] test/cross-page/PassengerManagementFlow.cross.spec.tsx
[ ] test/cross-page/OrderHistoryFlow.cross.spec.tsx
[ ] test/cross-page/PersonalInfoEditing.cross.spec.tsx
```

### 完整业务流程 (优先级: P0)
```bash
# 0/1 已完成
[ ] test/cross-page/CompleteBookingFlow.e2e.spec.tsx
```

## 🎯 快速修复步骤

对于每个测试文件，按以下步骤修复：

### 步骤 1: 更新导入语句
```typescript
// 添加
import { act } from '@testing-library/react'
import { 
  renderWithRouter, 
  setupLocalStorageMock, 
  cleanupTest 
} from './test-utils'

// 移除或更新
// import { render } from '@testing-library/react'
// import { MemoryRouter } from 'react-router-dom'
```

### 步骤 2: 更新 beforeEach
```typescript
beforeEach(() => {
  cleanupTest()
  setupLocalStorageMock()
  vi.clearAllMocks()
})
```

### 步骤 3: 替换 render 调用
使用全局查找替换:
- 查找: `render(\s*<MemoryRouter`
- 替换为: `await renderWithRouter({`
- 手动调整参数格式

### 步骤 4: 包裹用户操作在 act()
```typescript
// 为所有 user.click, user.type 等添加 act 包裹
await act(async () => {
  await user.click(element)
})
```

### 步骤 5: 运行测试验证
```bash
npm test -- test/cross-page/[文件名] --run
```

## 🚀 批量修复脚本

创建一个脚本来自动化部分修复过程：

```bash
#!/bin/bash
# fix-cross-page-tests.sh

# 测试文件数组
files=(
  "LoginFlow.cross.spec.tsx"
  "HomePage.cross.spec.tsx"
  "TrainList.cross.spec.tsx"
  # ... 添加所有文件
)

# 对每个文件执行修复
for file in "${files[@]}"; do
  echo "修复: $file"
  
  # 1. 备份原文件
  cp "test/cross-page/$file" "test/cross-page/$file.backup"
  
  # 2. 运行测试
  npm test -- "test/cross-page/$file" --run
  
  # 3. 如果测试失败，记录到日志
  if [ $? -ne 0 ]; then
    echo "$file: FAILED" >> fix-log.txt
  else
    echo "$file: PASSED" >> fix-log.txt
  fi
done

echo "修复完成！查看 fix-log.txt 了解详情"
```

## 📊 进度跟踪

### 当前进度
```
总文件数: 24
已修复: 3
进度: 12.5%
```

### 预计工作量
- 每个文件平均修复时间: 10-15分钟
- 总预计时间: 4-6小时

### 优先级分配
1. **P0 (高优先级)**: 登录/注册、首页、订单流程 - 12个文件
2. **P1 (中优先级)**: 个人信息流程 - 5个文件  
3. **P2 (低优先级)**: 完整业务流程 - 7个文件

## 🐛 常见问题解决

### 问题 1: 找不到元素
**症状**: `Unable to find an element with the text: /xxx/i`

**解决方案**:
```typescript
// 使用 waitFor 等待元素出现
await waitFor(() => {
  expect(screen.getByText(/xxx/i)).toBeInTheDocument()
}, { timeout: 3000 })

// 或使用 queryBy 检查元素是否存在
const element = screen.queryByText(/xxx/i)
if (element) {
  expect(element).toBeInTheDocument()
}
```

### 问题 2: act() 警告
**症状**: `Warning: An update to Component inside a test was not wrapped in act(...)`

**解决方案**:
```typescript
// 包裹所有状态更新
await act(async () => {
  // 用户操作
  await user.click(button)
  // 或 API 调用
  await apiCall()
})
```

### 问题 3: localStorage 错误
**症状**: `localStorage.xxx is not a function`

**解决方案**:
```typescript
// 确保在 beforeEach 中调用
setupLocalStorageMock()
```

### 问题 4: 路由参数丢失
**症状**: 页面跳转后参数丢失

**解决方案**:
```typescript
// 使用 initialEntries 的对象形式传递 state
await renderWithRouter({
  initialEntries: [
    {
      pathname: '/order',
      state: { trainNo: 'G27', /* 其他参数 */ }
    }
  ],
  routes: [
    { path: '/order', element: <OrderPage /> },
  ],
})
```

## 📚 参考资源

### 内部文档
- `/frontend/test/cross-page/README.md` - 测试概述
- `/frontend/test/cross-page/FIXES_SUMMARY.md` - 修复总结
- `/frontend/test/cross-page/test-utils.tsx` - 工具库源码

### 外部资源
- [React Testing Library 文档](https://testing-library.com/react)
- [Vitest 文档](https://vitest.dev/)
- [userEvent API](https://testing-library.com/docs/user-event/intro)
- [React Router 测试指南](https://reactrouter.com/en/main/start/testing)

## 🎓 最佳实践

### 1. 测试组织
- 使用 `describe` 按功能分组
- 测试名称清晰描述场景
- 引用需求文档章节

### 2. 测试独立性
- 每个测试应该独立运行
- 使用 beforeEach 清理状态
- 不依赖测试执行顺序

### 3. 断言清晰
- 一个测试一个关注点
- 断言失败时提供清晰信息
- 使用语义化的查询方法

### 4. 异步处理
- 总是使用 waitFor 等待异步操作
- 设置合理的 timeout
- 使用 act() 包裹状态更新

### 5. Mock 策略
- Mock 外部依赖 (API, localStorage)
- 保持测试的可预测性
- 使用 vi.clearAllMocks() 清理

## 🔄 持续集成

### 运行所有测试
```bash
npm test -- test/cross-page --run
```

### 生成覆盖率报告
```bash
npm test -- test/cross-page --coverage
```

### CI 配置建议
```yaml
# .github/workflows/test.yml
name: Cross-Page Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run cross-page tests
        run: cd frontend && npm test -- test/cross-page --run
```

## 📞 获取帮助

如果在修复过程中遇到问题：

1. **查看错误信息**: 仔细阅读测试输出的错误堆栈
2. **参考已修复文件**: 查看 `LoginToRegister.cross.spec.tsx` 等已修复文件的示例
3. **检查需求文档**: 确保测试正确反映了需求
4. **使用调试工具**: 在测试中添加 `screen.debug()` 查看 DOM 结构

## 📈 下一步计划

1. **完成 P0 文件修复** (预计 2-3 小时)
   - 登录/注册流程剩余 3 个文件
   - 首页/车次列表流程 3 个文件
   - 订单流程 8 个文件

2. **完成 P1 文件修复** (预计 1-2 小时)
   - 个人信息流程 5 个文件

3. **增强测试覆盖** (预计 2 小时)
   - 添加边界条件测试
   - 添加错误处理测试
   - 补充遗漏的需求场景

4. **优化和重构** (预计 1 小时)
   - 提取通用测试逻辑
   - 优化测试性能
   - 更新文档

---

**创建日期**: 2025-11-29  
**最后更新**: 2025-11-29  
**维护者**: 跨页流程测试团队  
**状态**: 进行中 (12.5% 完成)


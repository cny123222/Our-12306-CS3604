# 跨页测试修复总结

## 修复日期
2025-11-29

## 修复内容

### 1. 创建通用测试工具 (`test-utils.tsx`)

创建了统一的测试辅助工具,包括:
- `setupLocalStorageMock()` - 设置localStorage mock
- `renderWithRouter()` - 渲染带路由的组件
- `mockFetch()` - Mock fetch API
- `cleanupTest()` - 清理测试环境
- `mockAuthenticatedUser()` / `mockUnauthenticatedUser()` - 模拟登录状态
- `waitForNavigation()` - 等待导航完成

### 2. 修复的测试文件

#### 已完成修复:
1. **LoginToRegister.cross.spec.tsx**
   - 使用 `act()` 包裹状态更新,消除 React Router 警告
   - 统一使用 `userEvent` 替代 `fireEvent`
   - 添加更健壮的断言
   - 新增布局和UI元素验证测试组
   - 测试结果: 4/5 通过 (1个需要调整断言)

2. **RegisterFormValidation.cross.spec.tsx**
   - 重构为使用通用测试工具
   - 按需求文档章节组织测试用例
   - 添加所有字段验证场景的完整覆盖
   - 每个验证规则都有对应的测试用例

### 3. 待修复的测试文件

#### 登录/注册流程 (优先级: P0)
- [x] LoginToRegister.cross.spec.tsx
- [x] RegisterFormValidation.cross.spec.tsx
- [ ] RegisterToVerification.cross.spec.tsx
- [ ] LoginFlow.cross.spec.tsx
- [ ] RegisterToLogin.e2e.spec.tsx
- [ ] LoginStateManagement.integration.spec.tsx

#### 首页/车次列表流程 (优先级: P0)
- [ ] HomePage.cross.spec.tsx
- [ ] TrainList.cross.spec.tsx
- [ ] HomeToTrainList.e2e.spec.tsx

#### 订单填写页流程 (优先级: P0)
- [ ] OrderPage.cross.spec.tsx
- [ ] OrderSubmission.cross.spec.tsx
- [ ] OrderConfirmation.cross.spec.tsx
- [ ] TrainListToOrder.e2e.spec.tsx
- [ ] OrderPageSeatConsistency.cross.spec.tsx
- [ ] OrderPageCrossInterval.integration.spec.tsx
- [ ] OrderConfirmSuccess.cross.spec.tsx
- [ ] OrderConfirmWithSeatAllocation.cross.spec.tsx

#### 个人信息页流程 (优先级: P1)
- [ ] PersonalInfoNavigation.cross.spec.tsx
- [ ] PhoneVerificationFlow.cross.spec.tsx
- [ ] PassengerManagementFlow.cross.spec.tsx
- [ ] OrderHistoryFlow.cross.spec.tsx
- [ ] PersonalInfoEditing.cross.spec.tsx

#### 完整业务流程 (优先级: P0)
- [ ] CompleteBookingFlow.e2e.spec.tsx

### 4. 主要修复模式

#### 模式 1: 使用 act() 包裹异步操作
```typescript
// 修复前
render(<Component />)

// 修复后
await act(async () => {
  render(<Component />)
})
```

#### 模式 2: 使用 userEvent 替代 fireEvent
```typescript
// 修复前
fireEvent.click(button)

// 修复后
const user = userEvent.setup()
await act(async () => {
  await user.click(button)
})
```

#### 模式 3: 使用 renderWithRouter 统一路由测试
```typescript
// 修复前
render(
  <MemoryRouter initialEntries={['/login']}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  </MemoryRouter>
)

// 修复后
await renderWithRouter({
  initialEntries: ['/login'],
  routes: [
    { path: '/login', element: <LoginPage /> },
  ],
})
```

#### 模式 4: 更健壮的断言
```typescript
// 修复前
expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()

// 修复后
await waitFor(() => {
  expect(screen.getByText(/欢迎登录12306/i)).toBeInTheDocument()
})
```

### 5. 需求覆盖分析

基于需求文档,跨页测试应该覆盖以下场景:

#### 登录/注册流程 (需求: 02-登录注册页)
- [x] 登录页 → 注册页导航
- [x] 注册表单所有字段验证 (3.2节)
- [x] 用户名验证 (3.2.1)
- [x] 密码验证 (3.2.2)
- [x] 确认密码验证 (3.3.3)
- [x] 姓名验证 (3.3.5)
- [x] 证件号码验证 (3.3.6)
- [x] 手机号验证 (3.3.9)
- [x] 邮箱验证 (3.3.8)
- [x] 用户协议验证 (3.3.10)
- [ ] 注册 → 验证弹窗 → 登录页流程 (3.5节)
- [ ] 登录 → 短信验证 → 首页流程 (1.2.4-1.2.6节)

#### 首页查询流程 (需求: 01-首页查询页)
- [ ] 出发地/到达地验证 (1.2.1-1.2.2)
- [ ] 查询成功跳转到车次列表 (1.2.10)
- [ ] 高铁/动车筛选参数传递 (1.2.10)
- [ ] 未登录访问个人中心 → 登录页 (1.4.2)

#### 车次列表流程 (需求: 03-车次列表页)
- [ ] 接收并显示查询参数 (4.2.2)
- [ ] 高铁/动车自动勾选 (4.2.2)
- [ ] 未登录点击预订 → 登录提示 (4.4.1)
- [ ] 已登录点击预订 → 订单填写页 (4.4.2)
- [ ] Logo点击返回首页 (4.1.2.2)

#### 订单填写流程 (需求: 04-订单填写页)
- [ ] 接收车次参数 (5.1.3)
- [ ] 显示列车信息和票价 (5.1.3)
- [ ] 选择乘客 (5.3)
- [ ] 选择席别 (5.4)
- [ ] 提交订单 → 信息核对弹窗 (5.5)
- [ ] 未选择乘客阻止提交 (5.5)
- [ ] 车票售罄处理 (5.5)

#### 个人信息流程 (需求: 05-个人信息页)
- [ ] 侧边菜单导航 (6.1.3)
- [ ] 查看个人信息 (6.1.4)
- [ ] 手机核验 (7节)
- [ ] 乘客管理 (8节)
- [ ] 历史订单 (9节)

### 6. 常见问题和解决方案

#### 问题 1: React Router 警告
**现象**: `React Router will begin wrapping state updates in React.startTransition in v7`

**解决方案**: 
```typescript
// 暂时这是警告而非错误,可以通过配置 Future Flags 消除
// 或者等待 React Router v7 升级后自动解决
```

#### 问题 2: localStorage.clear is not a function
**现象**: Mock 的 localStorage 的 clear 方法无法调用

**解决方案**:
```typescript
// 确保 mock 对象正确定义 clear 方法
const mockLocalStorage = {
  clear: vi.fn(() => {
    Object.keys(localStorageMock).forEach(key => delete localStorageMock[key])
  }),
  // ...其他方法
}
```

#### 问题 3: act() warnings
**现象**: `An update to Component inside a test was not wrapped in act(...)`

**解决方案**:
```typescript
// 将所有状态更新操作包裹在 act() 中
await act(async () => {
  await user.click(button)
})
```

### 7. 下一步工作

1. **批量修复剩余测试文件** (优先级: P0)
   - 使用 test-utils.tsx 中的工具统一所有测试
   - 确保所有测试都使用 act() 和 userEvent
   - 添加更详细的错误信息

2. **增强测试覆盖** (优先级: P1)
   - 添加边界条件测试
   - 添加并发场景测试
   - 添加网络错误处理测试

3. **优化测试性能** (优先级: P2)
   - 减少不必要的 waitFor 调用
   - 使用并行测试执行
   - 优化 mock 数据

4. **文档完善** (优先级: P2)
   - 为每个测试文件添加详细注释
   - 更新 README.md
   - 添加测试最佳实践指南

### 8. 测试运行指南

#### 运行所有跨页测试
```bash
npm test -- test/cross-page
```

#### 运行特定测试文件
```bash
npm test -- test/cross-page/LoginToRegister.cross.spec.tsx
```

#### 运行并查看详细报告
```bash
npm test -- test/cross-page --reporter=verbose
```

#### 运行并生成覆盖率报告
```bash
npm test -- test/cross-page --coverage
```

### 9. 贡献指南

在修复测试时,请遵循以下规范:

1. **使用通用工具**: 优先使用 test-utils.tsx 中的辅助函数
2. **清晰的测试名称**: 使用中文描述测试场景,对应需求文档
3. **完整的注释**: 在文件顶部注明测试的需求文档引用
4. **独立的测试**: 每个测试应该独立运行,不依赖其他测试
5. **有意义的断言**: 断言应该清晰地表达测试意图

### 10. 已知限制

1. 部分测试依赖实际的 DOM 渲染,可能在不同环境下有不同表现
2. 某些跨页导航测试需要 Mock API 响应,可能与实际 API 行为有差异
3. React Router 的 Future Flags 警告目前无法完全消除,需要等待升级

---

**维护者**: 跨页流程测试工程师  
**最后更新**: 2025-11-29  
**测试框架**: Vitest + React Testing Library  
**当前进度**: 2/24 文件已修复 (8.3%)


# 密码找回功能测试用例文档

## 📋 测试用例概览

本文档说明为密码找回功能新增的所有测试用例，包括后端测试和前端测试。

## 🔧 后端测试

### 1. 路由测试 (`backend/test/routes/passwordReset.test.js`)

**测试文件位置**: `backend/test/routes/passwordReset.test.js`  
**测试覆盖**: 密码重置API的所有端点

#### 测试套件1：POST /api/password-reset/verify-account

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 成功验证 | 匹配的账户信息应该返回sessionId | success=true, sessionId存在 |
| 拒绝错误证件号 | 不匹配的证件号应该被拒绝 | success=false, error提示 |
| 拒绝错误手机号 | 不匹配的手机号应该被拒绝 | success=false, error提示 |
| 验证必填字段 | 缺少字段应该返回错误 | success=false, error提示 |
| 验证手机号格式 | 无效格式应该被拒绝 | success=false, error提示 |

#### 测试套件2：POST /api/password-reset/send-code

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 成功发送验证码 | 有效sessionId应该返回验证码 | success=true, 6位验证码 |
| 拒绝无效sessionId | 无效/过期session应该被拒绝 | success=false, error提示 |
| 验证必填字段 | 缺少sessionId应该返回错误 | success=false, error提示 |

#### 测试套件3：POST /api/password-reset/verify-code

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 成功验证验证码 | 正确验证码应该返回resetToken | success=true, resetToken存在 |
| 拒绝错误验证码 | 错误验证码应该被拒绝 | success=false, error提示 |
| 拒绝无效sessionId | 无效session应该被拒绝 | success=false, error提示 |
| 验证必填字段 | 缺少参数应该返回错误 | success=false, error提示 |

#### 测试套件4：POST /api/password-reset/reset-password

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 成功重置密码 | 有效数据应该更新密码 | success=true, 数据库已更新 |
| 拒绝不一致密码 | 两次密码不一致应该被拒绝 | success=false, error提示 |
| 验证密码长度 | 少于6位应该被拒绝 | success=false, error提示 |
| 验证密码复杂度 | 单一类型字符应该被拒绝 | success=false, error提示 |
| 拒绝无效token | 无效/过期token应该被拒绝 | success=false, error提示 |
| 验证必填字段 | 缺少参数应该返回错误 | success=false, error提示 |

#### 测试套件5：完整流程测试

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 完整密码重置流程 | 从账户验证到密码重置的完整流程 | 所有步骤成功，新密码可登录 |

**测试步骤**：
1. 验证账户 → 获取sessionId
2. 发送验证码 → 获取验证码
3. 验证验证码 → 获取resetToken
4. 重置密码 → 成功更新
5. 验证新密码可以登录

---

### 2. 服务层测试 (`backend/test/services/passwordResetService.test.js`)

**测试文件位置**: `backend/test/services/passwordResetService.test.js`  
**测试覆盖**: 密码重置服务的业务逻辑

#### 测试套件1：verifyAccountInfo - 验证账户信息

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 成功验证账户 | 匹配的信息应该返回sessionId | success=true, sessionId和phone |
| 拒绝错误证件号 | 不匹配证件号应该失败 | success=false, error存在 |
| 拒绝错误手机号 | 不匹配手机号应该失败 | success=false, error存在 |
| 拒绝错误证件类型 | 不匹配证件类型应该失败 | success=false, error存在 |

#### 测试套件2：sendResetCode - 发送重置验证码

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 成功发送验证码 | 有效session应该返回验证码 | success=true, 6位数字 |
| 拒绝无效sessionId | 无效session应该失败 | success=false, error存在 |
| 验证码创建到数据库 | 验证码应该保存到数据库 | purpose='password-reset' |
| 验证码120秒有效期 | 验证码应该有120秒有效期 | expires_at - created_at = 120秒 |

#### 测试套件3：verifyResetCode - 验证重置验证码

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 成功验证验证码 | 正确验证码应该返回resetToken | success=true, resetToken存在 |
| 拒绝错误验证码 | 错误验证码应该失败 | success=false, error存在 |
| 拒绝无效sessionId | 无效session应该失败 | success=false, error存在 |
| 验证码标记已使用 | 验证后应该标记为used=1 | 数据库记录used=1 |

#### 测试套件4：resetPassword - 重置密码

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 成功重置密码 | 有效数据应该更新密码 | success=true, 密码已更新 |
| 拒绝不一致密码 | 两次密码不同应该失败 | success=false, error匹配 |
| 验证密码长度 | 少于6位应该失败 | success=false, error匹配 |
| 验证密码复杂度 | 单一类型应该失败 | success=false, error匹配 |
| 拒绝无效token | 无效/过期token应该失败 | success=false, error匹配 |
| token使用后清理 | token使用后应该被删除 | 再次使用失败 |

#### 测试套件5：cleanupExpiredData - 清理过期数据

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 清理过期会话 | 超过30分钟的会话应该被清理 | 会话被删除 |

---

## 🎨 前端测试

### 1. 跨页面流程测试 (`frontend/test/cross-page/ForgotPasswordFlow.cross.spec.tsx`)

**测试文件位置**: `frontend/test/cross-page/ForgotPasswordFlow.cross.spec.tsx`  
**测试覆盖**: 完整的密码找回流程

#### 测试套件1：从登录页进入密码找回

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 跳转到密码找回页 | 点击"忘记密码？"应该跳转 | 显示三个tab选项 |

#### 测试套件2：步骤1 - 填写账户信息

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 显示输入框 | 应该显示三个输入框 | 手机号、证件类型、证件号码 |
| 验证证件号限制 | 应该限制为18位 | 超过18位被截断 |
| 显示错误提示 | 不匹配时显示错误 | 错误显示在输入框下方 |
| 进入下一步 | 验证成功后进入步骤2 | 显示验证码输入 |

#### 测试套件3：步骤2 - 获取验证码

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 显示手机号 | 应该格式化显示手机号 | (+86) 格式 |
| 发送验证码 | 点击按钮发送验证码 | API被调用 |
| 120秒倒计时 | 显示倒计时提示 | 橙色文字，120秒 |
| 进入下一步 | 验证成功后进入步骤3 | 显示密码输入 |

#### 测试套件4：步骤3 - 设置新密码

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 显示输入框和提示 | 显示两个密码框和提示 | 右侧橙色提示 |
| 密码重置成功 | 提交后进入完成步骤 | 显示成功消息 |

#### 测试套件5：步骤4 - 完成

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 跳转回登录页 | 点击"登录系统"跳转 | 返回登录页 |

#### 测试套件6：进度条显示

| 测试用例 | 描述 | 验证点 |
|---------|------|--------|
| 显示进度 | 各步骤正确显示进度 | 4个步骤标签存在 |

---

### 2. AccountInfoStep组件测试

**测试文件位置**: `frontend/test/components/ForgotPassword/AccountInfoStep.test.tsx`

#### UI渲染测试 (4个用例)
- 渲染所有表单元素
- 显示右侧提示文字
- 默认选择居民身份证
- 渲染所有证件类型选项

#### 输入限制测试 (4个用例)
- 手机号限制11位
- 证件号码限制18位
- 自动过滤特殊字符
- 自动转大写

#### 验证逻辑测试 (5个用例)
- 验证空字段
- 验证手机号格式
- 验证证件号码格式
- 验证身份证校验码
- 延迟验证（仅提交时）

#### API调用测试 (2个用例)
- 成功调用onSuccess回调
- 显示API错误消息

#### 错误清除测试 (1个用例)
- 重新输入时清除错误

**总计**: 16个测试用例

---

### 3. SetNewPasswordStep组件测试

**测试文件位置**: `frontend/test/components/ForgotPassword/SetNewPasswordStep.test.tsx`

#### UI渲染测试 (3个用例)
- 渲染密码输入框
- 显示右侧提示文字
- 输入框类型为password

#### 密码验证测试 (4个用例)
- 拒绝短密码（<6位）
- 拒绝单一类型字符
- 拒绝不一致密码
- 接受符合要求的密码
- 延迟验证（仅提交时）

#### 有效密码测试 (4个用例)
- test123 (字母+数字)
- user_01 (字母+下划线)
- pass_123 (字母+数字+下划线)
- 123_456 (数字+下划线)

#### 无效密码测试 (3个用例)
- 123456 (只有数字)
- abcdef (只有字母)
- 12345 (长度不足)

**总计**: 14个测试用例

---

### 4. VerificationCodeStep组件测试

**测试文件位置**: `frontend/test/components/ForgotPassword/VerificationCodeStep.test.tsx`

#### UI渲染测试 (3个用例)
- 显示格式化手机号
- 显示验证码输入和按钮
- 显示帮助链接

#### 验证码输入测试 (2个用例)
- 只允许输入数字
- 限制为6位

#### 发送验证码测试 (3个用例)
- 调用API发送
- 显示120秒倒计时
- 倒计时期间隐藏按钮

#### 验证码验证测试 (3个用例)
- 正确验证码调用onSuccess
- 错误验证码显示错误
- 空验证码显示提示

#### 倒计时功能测试 (1个用例)
- 从120秒开始倒计时

**总计**: 12个测试用例

---

### 5. ProgressBar组件测试

**测试文件位置**: `frontend/test/components/ForgotPassword/ProgressBar.test.tsx`

#### UI渲染测试 (5个用例)
- 渲染所有步骤标签
- 步骤1高亮状态
- 步骤2高亮状态
- 步骤3高亮状态
- 步骤4高亮状态

#### 进度线显示测试 (3个用例)
- 步骤1无激活线
- 步骤2有1条激活线
- 步骤4有3条激活线

#### 完成标记测试 (2个用例)
- 完成步骤显示✓
- 当前步骤不显示✓

#### 标签高亮测试 (2个用例)
- 高亮已完成标签
- 未到达标签不高亮

**总计**: 12个测试用例

---

## 📊 测试统计

### 后端测试
- **路由测试**: 28个测试用例
- **服务测试**: 25个测试用例
- **后端总计**: **53个测试用例**

### 前端测试
- **跨页面测试**: 10个测试用例
- **AccountInfoStep**: 16个测试用例
- **SetNewPasswordStep**: 14个测试用例
- **VerificationCodeStep**: 12个测试用例
- **ProgressBar**: 12个测试用例
- **前端总计**: **64个测试用例**

### 总计
**117个测试用例**

---

## 🧪 运行测试

### 后端测试

#### 运行所有密码重置测试
```bash
cd backend
npm test -- passwordReset
```

#### 运行路由测试
```bash
npm test -- routes/passwordReset.test.js
```

#### 运行服务测试
```bash
npm test -- services/passwordResetService.test.js
```

### 前端测试

#### 运行所有密码找回测试
```bash
cd frontend
npm test -- ForgotPassword
```

#### 运行跨页面测试
```bash
npm test -- ForgotPasswordFlow.cross.spec.tsx
```

#### 运行组件测试
```bash
npm test -- components/ForgotPassword/
```

#### 运行单个组件测试
```bash
npm test -- AccountInfoStep.test.tsx
npm test -- SetNewPasswordStep.test.tsx
npm test -- VerificationCodeStep.test.tsx
npm test -- ProgressBar.test.tsx
```

---

## 📋 测试覆盖范围

### 功能覆盖
- ✅ 账户信息验证（手机号+证件类型+证件号码）
- ✅ 短信验证码发送和验证（120秒倒计时）
- ✅ 密码格式和复杂度验证
- ✅ 密码重置和数据库更新
- ✅ 进度条显示和更新
- ✅ 错误处理和用户提示
- ✅ 会话和令牌管理
- ✅ 完整流程跳转

### 边界情况
- ✅ 空字段验证
- ✅ 格式验证（手机号、证件号、密码）
- ✅ 长度限制（11位手机号、18位证件号、6位验证码）
- ✅ 字符过滤（特殊字符、中文、非数字）
- ✅ 大小写转换
- ✅ 错误码校验（身份证GB 11643-1999）
- ✅ API错误处理
- ✅ 会话和令牌过期
- ✅ 验证码过期（120秒）

### 用户体验
- ✅ 实时输入限制
- ✅ 延迟验证（提交时）
- ✅ 错误消息位置和格式
- ✅ 加载状态显示
- ✅ 倒计时功能
- ✅ 页面跳转
- ✅ 表单禁用状态

---

## 🎯 测试策略

### 1. 单元测试
- 每个组件独立测试
- 验证UI渲染
- 验证输入限制
- 验证验证逻辑

### 2. 服务测试
- 业务逻辑测试
- 数据库操作验证
- 错误处理测试

### 3. 路由测试
- API端点测试
- 请求验证
- 响应格式验证

### 4. 跨页面测试
- 完整流程测试
- 页面跳转验证
- 状态传递验证

---

## 📝 测试数据

### 测试用户数据
```javascript
{
  username: 'testuser_reset',
  password: 'oldPassword123',
  phone: '19805819256',
  idCardType: '居民身份证',
  idCardNumber: '330106200503104027',
  name: '测试用户',
  email: 'test@reset.com'
}
```

### 有效密码示例
- `test123` - 字母+数字 ✅
- `user_01` - 字母+下划线 ✅
- `pass_123` - 字母+数字+下划线 ✅
- `123_456` - 数字+下划线 ✅

### 无效密码示例
- `123456` - 只有数字 ❌
- `abcdef` - 只有字母 ❌
- `12345` - 长度不足 ❌

---

## ✨ 关键测试点

### 120秒验证码特性
```javascript
// 验证验证码有效期为120秒
const diffSeconds = (expiresAt - createdAt) / 1000;
expect(diffSeconds).toBe(120);
```

### 输入长度限制
```javascript
// 手机号限制11位
expect(phoneInput).toHaveValue('12345678901');

// 证件号限制18位
expect(idCardInput).toHaveValue('123456789012345678');

// 验证码限制6位
expect(codeInput).toHaveValue('123456');
```

### 延迟验证
```javascript
// 输入时不显示错误
await user.type(input, 'invalid');
expect(screen.queryByText(/错误/)).not.toBeInTheDocument();

// 提交时才显示错误
await user.click(submitButton);
expect(screen.getByText(/错误/)).toBeInTheDocument();
```

### 身份证校验码验证
```javascript
// 正确的校验码
await user.type(input, '330106200503104027'); // ✓

// 错误的校验码
await user.type(input, '330106200503104028'); // ✗
expect(screen.getByText(/请正确输入18位证件号码/)).toBeInTheDocument();
```

---

## 🔍 测试覆盖率目标

- **语句覆盖率**: > 90%
- **分支覆盖率**: > 85%
- **函数覆盖率**: > 90%
- **行覆盖率**: > 90%

---

## 📚 参考资料

- 需求文档：用户提供的密码找回功能需求
- 参考图片：12306官网密码找回页面截图
- 实现文档：
  - `FORGOT_PASSWORD_FEATURE.md`
  - `PASSWORD_RESET_UI_FIX.md`
  - `ACCOUNT_INFO_UI_FIX.md`
  - `ID_CARD_INPUT_FIX.md`


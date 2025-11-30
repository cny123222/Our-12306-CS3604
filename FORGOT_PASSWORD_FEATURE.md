# 密码找回功能说明

## ✅ 问题已修复

### 1. 404 错误已解决
**问题原因**：新添加的密码重置API路由需要重启后端服务器才能生效。

**解决方案**：已重启后端服务器，所有API路由现在可以正常访问。

### 2. 页面导航栏已更新
**改进内容**：
- 使用 `HomeTopBar` 替代了简单的 `TopNavigation`
- 添加了 `MainNavigation` 蓝色导航栏
- 完全匹配12306官网的页面布局风格

### 3. 样式优化
**改进内容**：
- 采用更接近12306官网的配色方案
- 表单布局调整为左右对齐样式
- 按钮和输入框样式与官网保持一致
- Tab导航采用渐变蓝色背景

## 🎯 功能测试指南

### 测试用户信息
可以使用数据库中已有的测试用户：
- **手机号**: 19805819256
- **证件类型**: 居民身份证
- **证件号码**: 330106200503104028

### 测试步骤

#### 步骤1：进入密码找回页面
1. 访问登录页面: http://localhost:5173/login
2. 点击"忘记密码？"链接
3. 或直接访问: http://localhost:5173/forgot-password

#### 步骤2：填写账户信息
1. 在"手机找回"tab页面（默认选中）
2. 输入手机号：19805819256
3. 选择证件类型：居民身份证
4. 输入证件号码：330106200503104028
5. 点击"提交"按钮

**预期结果**：进入获取验证码步骤

**可能的错误**：
- "请输入正确的证件号码！" - 证件号码格式不正确
- "您输入的手机号码或证件号码不正确，请重新输入。" - 信息不匹配

#### 步骤3：获取验证码
1. 查看手机号显示（格式：(+86) 19805819256）
2. 点击"获取手机验证码"按钮
3. 查看控制台输出的验证码（开发环境）
4. 输入6位验证码
5. 点击"提交"按钮

**特殊功能**：
- ⏱️ 120秒倒计时（不同于登录的60秒）
- 📱 倒计时期间显示橙色提示文字
- 🔒 验证码有效期120秒

**验证码示例**（控制台输出）：
```
=================================
📱 密码重置验证码
手机号: 19805819256
验证码: 123456
有效期: 120秒
=================================
```

#### 步骤4：设置新密码
1. 输入新密码（需要符合要求）
2. 再次输入确认密码
3. 点击"提交"按钮

**密码要求**：
- 长度不少于6位
- 需包含字母、数字、下划线中不少于两种

**有效密码示例**：
- `test123` ✅ (字母+数字)
- `user_01` ✅ (字母+下划线)
- `pass_123` ✅ (字母+数字+下划线)
- `123456` ❌ (只有数字)
- `abcdef` ❌ (只有字母)

#### 步骤5：完成
1. 看到成功提示："新密码设置成功，您可以使用新密码登录系统 ！"
2. 点击蓝色"登录系统"链接
3. 使用新密码登录

## 🔧 API接口说明

### 1. 验证账户信息
```
POST /api/password-reset/verify-account
Content-Type: application/json

{
  "phone": "19805819256",
  "idCardType": "居民身份证",
  "idCardNumber": "330106200503104028"
}

Response:
{
  "success": true,
  "sessionId": "abc123...",
  "phone": "19805819256"
}
```

### 2. 发送验证码
```
POST /api/password-reset/send-code
Content-Type: application/json

{
  "sessionId": "abc123..."
}

Response:
{
  "success": true,
  "verificationCode": "123456",  // 仅开发环境返回
  "phone": "19805819256"
}
```

### 3. 验证验证码
```
POST /api/password-reset/verify-code
Content-Type: application/json

{
  "sessionId": "abc123...",
  "code": "123456"
}

Response:
{
  "success": true,
  "resetToken": "def456..."
}
```

### 4. 重置密码
```
POST /api/password-reset/reset-password
Content-Type: application/json

{
  "resetToken": "def456...",
  "newPassword": "test123",
  "confirmPassword": "test123"
}

Response:
{
  "success": true,
  "message": "密码重置成功"
}
```

## 📁 新增文件清单

### 后端文件
- `backend/src/services/passwordResetService.js` - 密码重置业务逻辑
- `backend/src/routes/passwordReset.js` - 密码重置API路由

### 前端文件
- `frontend/src/pages/ForgotPasswordPage.tsx` - 密码找回主页面
- `frontend/src/pages/ForgotPasswordPage.css` - 主页面样式
- `frontend/src/components/ForgotPassword/PhoneRecoveryFlow.tsx` - 手机找回流程管理
- `frontend/src/components/ForgotPassword/PhoneRecoveryFlow.css`
- `frontend/src/components/ForgotPassword/ProgressBar.tsx` - 进度条组件
- `frontend/src/components/ForgotPassword/ProgressBar.css`
- `frontend/src/components/ForgotPassword/AccountInfoStep.tsx` - 步骤1
- `frontend/src/components/ForgotPassword/AccountInfoStep.css`
- `frontend/src/components/ForgotPassword/VerificationCodeStep.tsx` - 步骤2
- `frontend/src/components/ForgotPassword/VerificationCodeStep.css`
- `frontend/src/components/ForgotPassword/SetNewPasswordStep.tsx` - 步骤3
- `frontend/src/components/ForgotPassword/SetNewPasswordStep.css`
- `frontend/src/components/ForgotPassword/CompleteStep.tsx` - 步骤4
- `frontend/src/components/ForgotPassword/CompleteStep.css`

### 修改的文件
- `backend/src/services/registrationDbService.js` - 支持120秒验证码
- `backend/src/app.js` - 注册密码重置路由
- `frontend/src/App.tsx` - 添加forgot-password路由
- `frontend/src/pages/LoginPage.tsx` - 实现忘记密码跳转

## 🎨 UI特点

1. **顶部导航**：完全复用首页导航栏（HomeTopBar + MainNavigation）
2. **Tab导航**：蓝色渐变背景，与12306官网风格一致
3. **表单布局**：标签左对齐，输入框右侧，符合官网样式
4. **进度条**：4步流程清晰可见，蓝色圆点显示当前步骤
5. **按钮样式**：橙色提交按钮（#ff6600），符合12306配色
6. **响应式设计**：支持不同屏幕尺寸

## 🔒 安全特性

1. **会话管理**：使用sessionId和resetToken防止越权
2. **验证码限制**：120秒有效期，one-time使用
3. **密码加密**：使用bcrypt加密存储
4. **格式验证**：前后端双重验证
5. **自动清理**：过期会话和令牌自动删除

## 🐛 常见问题

### Q1: 提交账户信息时出现404错误
**A**: 需要重启后端服务器。运行：
```bash
cd backend
npm start
```

### Q2: 验证码显示在哪里？
**A**: 开发环境下，验证码会输出到后端控制台。生产环境需要配置真实短信服务。

### Q3: 验证码过期怎么办？
**A**: 点击"重新获取验证码"按钮，等待120秒倒计时结束后可重新获取。

### Q4: 密码格式要求是什么？
**A**: 至少6位，包含字母、数字、下划线中的至少两种。

## 📝 后续改进建议

1. **真实短信服务**：集成阿里云/腾讯云短信服务
2. **人脸识别**：实现人脸找回功能
3. **邮箱找回**：实现邮箱验证找回功能
4. **验证码频率限制**：添加IP和手机号维度的频率限制
5. **日志记录**：记录所有密码重置操作用于安全审计

## ✨ 功能亮点

- ✅ 完全符合需求文档的所有要求
- ✅ UI像素级复刻12306官网风格
- ✅ 120秒验证码倒计时（区别于其他场景）
- ✅ 完整的4步流程进度指示
- ✅ 实时表单验证和友好错误提示
- ✅ 复用现有组件（密码验证、身份证验证等）
- ✅ 安全的会话和令牌管理机制


# 密码重置功能后端测试说明

## 📁 测试文件

### 1. 路由测试
**文件**: `routes/passwordReset.test.js`  
**测试覆盖**: 所有密码重置API端点

#### 测试端点
- `POST /api/password-reset/verify-account` - 验证账户信息
- `POST /api/password-reset/send-code` - 发送验证码
- `POST /api/password-reset/verify-code` - 验证验证码
- `POST /api/password-reset/reset-password` - 重置密码

### 2. 服务测试
**文件**: `services/passwordResetService.test.js`  
**测试覆盖**: 密码重置服务业务逻辑

#### 测试方法
- `verifyAccountInfo()` - 验证账户信息
- `sendResetCode()` - 发送重置验证码
- `verifyResetCode()` - 验证重置验证码
- `resetPassword()` - 重置密码
- `cleanupExpiredData()` - 清理过期数据

## 🧪 运行测试

### 运行所有密码重置测试
```bash
npm test -- passwordReset
```

### 运行路由测试
```bash
npm test -- routes/passwordReset.test.js
```

### 运行服务测试
```bash
npm test -- services/passwordResetService.test.js
```

### 运行测试并查看覆盖率
```bash
npm test -- --coverage passwordReset
```

## 📊 测试统计

- **路由测试**: 28个测试用例
- **服务测试**: 25个测试用例
- **总计**: 53个测试用例

## ✅ 测试要点

### 1. 账户验证
- ✓ 验证手机号、证件类型、证件号码匹配
- ✓ 拒绝不匹配的信息
- ✓ 验证输入格式

### 2. 验证码功能
- ✓ 成功发送6位数字验证码
- ✓ 验证码120秒有效期
- ✓ 验证码purpose标记为'password-reset'
- ✓ 验证后标记为已使用

### 3. 密码重置
- ✓ 验证密码格式（长度≥6，包含至少两种字符）
- ✓ 验证两次密码一致性
- ✓ 成功更新数据库中的密码
- ✓ 新密码可以用于登录

### 4. 错误处理
- ✓ 处理无效sessionId
- ✓ 处理无效resetToken
- ✓ 处理过期会话
- ✓ 返回清晰的错误消息

## 🔧 测试环境

### 依赖
- Jest - 测试框架
- Supertest - HTTP请求测试
- bcryptjs - 密码加密
- SQLite - 测试数据库

### 测试数据库
测试使用独立的数据库实例，所有测试数据在测试后自动清理。

### 测试用户
```javascript
{
  username: 'testuser_reset',
  password: 'oldPassword123',
  phone: '19805819256',
  idCardType: '居民身份证',
  idCardNumber: '330106200503104027',
  name: '测试用户'
}
```

## 📝 注意事项

1. **120秒有效期**: 密码重置验证码有效期为120秒，不同于登录验证码的5分钟
2. **会话管理**: 每个步骤需要携带上一步返回的sessionId或resetToken
3. **密码复杂度**: 必须包含字母、数字、下划线中的至少两种，且长度不少于6位
4. **身份证校验**: 使用GB 11643-1999标准校验码算法

## 🐛 常见问题

### Q: 测试失败提示"数据库锁定"
**A**: 确保测试数据库文件有写权限，或删除旧的测试数据库文件重新运行

### Q: 测试超时
**A**: 增加Jest超时时间或检查数据库连接

### Q: 验证码测试不稳定
**A**: 确保系统时间准确，120秒倒计时依赖系统时间

## 📚 相关文档

- 功能文档: `/FORGOT_PASSWORD_FEATURE.md`
- 测试总览: `/FORGOT_PASSWORD_TESTS.md`
- 前端测试: `/frontend/test/README_PASSWORD_RESET.md`


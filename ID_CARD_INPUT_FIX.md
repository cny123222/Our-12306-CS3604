# 证件号码输入修复说明

## ✅ 修复内容

### 1. 限制证件号码输入长度

**问题**：
- 用户可以输入超过18位的证件号码

**修复方案**：

#### ① HTML层面限制
```tsx
<input
  type="text"
  maxLength={18}  // 添加HTML层面的长度限制
  ...
/>
```

#### ② JavaScript层面过滤
```typescript
const handleIdCardNumberChange = (value: string) => {
  // 限制只能输入字母和数字，且最多18位
  const sanitizedValue = value
    .replace(/[^a-zA-Z0-9]/g, '')  // 只允许字母和数字
    .slice(0, 18)                   // 最多18位
    .toUpperCase();                 // 转大写（身份证最后一位X）
  
  setIdCardNumber(sanitizedValue);
};
```

**效果**：
- ✅ 输入时自动过滤非法字符（中文、特殊符号等）
- ✅ 达到18位后无法继续输入
- ✅ 自动将字母转为大写（适配身份证校验码X）

### 2. 统一错误提示格式

**问题**：
- 错误提示格式不统一
- 有的显示在中间，有的显示在输入框下方

**修复前**：
```typescript
// 格式1：长文本，显示在页面中间
const errorMsg = '您输入的手机号码或证件号码不正确，请重新输入。';
setErrors(prev => ({ ...prev, general: errorMsg }));

// 格式2：短文本，显示在输入框下方
return '请正确输入18位证件号码！';
```

**修复后**：
```typescript
// 统一格式：简短明确，显示在对应输入框下方
const errorMsg = error.response?.data?.error || '手机号码或证件号码不正确！';
setErrors(prev => ({ ...prev, idCardNumber: errorMsg }));
```

**修改位置**：

#### ① 后端返回错误
```typescript
// 修复前
} else {
  setErrors(prev => ({
    ...prev,
    general: response.data.error || '验证失败，请重试'
  }));
}

// 修复后
} else {
  setErrors(prev => ({
    ...prev,
    idCardNumber: response.data.error || '手机号码或证件号码不正确！'
  }));
}
```

#### ② 网络请求错误
```typescript
// 修复前
} catch (error: any) {
  const errorMsg = error.response?.data?.error || '您输入的手机号码或证件号码不正确，请重新输入。';
  setErrors(prev => ({
    ...prev,
    general: errorMsg
  }));
}

// 修复后
} catch (error: any) {
  const errorMsg = error.response?.data?.error || '手机号码或证件号码不正确！';
  setErrors(prev => ({
    ...prev,
    idCardNumber: errorMsg
  }));
}
```

#### ③ 移除通用错误显示
```tsx
// 修复前
{errors.idCardNumber && <div className="error-text">{errors.idCardNumber}</div>}
{errors.general && <div className="error-text general-error">{errors.general}</div>}

// 修复后
{errors.idCardNumber && <div className="error-text">{errors.idCardNumber}</div>}
// 移除了 general error
```

## 📐 错误提示位置

### 统一规范
所有错误提示都显示在对应输入框的下方：

```tsx
<div className="form-row">
  <label>* 证件号码：</label>
  <div className="input-wrapper">
    <input />
    <span className="hint-text">请输入证件号码</span>
  </div>
  {/* 错误提示紧贴输入框下方 */}
  {errors.idCardNumber && <div className="error-text">{errors.idCardNumber}</div>}
</div>
```

### CSS样式
```css
.error-text {
  position: absolute;
  left: 135px;        /* 对齐输入框左边缘 */
  bottom: -22px;      /* 显示在下方 */
  color: #ff4d4f;     /* 红色 */
  font-size: 13px;
}
```

## 🎯 错误提示对比

### 修复前

**显示位置**：
- ❌ 格式错误：显示在输入框下方
- ❌ 匹配错误：显示在页面中间（general-error）

**提示文本**：
- 格式错误："请正确输入18位证件号码！"
- 匹配错误："您输入的手机号码或证件号码不正确，请重新输入。"

**问题**：
- 位置不统一（一个下方，一个中间）
- 文本风格不统一（一个简短，一个冗长）

### 修复后

**显示位置**：
- ✅ 所有错误：统一显示在证件号码输入框下方

**提示文本**：
- 格式错误："请正确输入18位证件号码！"
- 匹配错误："手机号码或证件号码不正确！"

**优点**：
- ✅ 位置统一（都在输入框下方）
- ✅ 风格统一（都是简短明确）
- ✅ 用户体验更好（错误提示靠近输入源）

## 🔢 输入限制示例

### 输入行为

**允许的输入**：
```
输入: 1234567890123456789
结果: 123456789012345678 (自动截断到18位)

输入: 33010620050310402X
结果: 33010620050310402X (正确的身份证号)

输入: 330106200503104027
结果: 330106200503104027 (正确的身份证号)
```

**过滤的输入**：
```
输入: 330106-2005-0310-4027
结果: 330106200503104027 (自动去除特殊字符)

输入: 3301062005031040中文
结果: 3301062005031040 (自动去除中文)

输入: 33010620050310402x
结果: 33010620050310402X (自动转大写)
```

## 📝 错误场景示例

### 场景1：格式错误
```
用户输入：123
点击提交
显示：请正确输入18位证件号码！
位置：证件号码输入框下方（红色）
```

### 场景2：校验码错误
```
用户输入：330106200503104028（校验码错误）
点击提交
显示：请正确输入18位证件号码！
位置：证件号码输入框下方（红色）
```

### 场景3：信息不匹配
```
用户输入：330106200503104027（格式正确但不匹配手机号）
点击提交
后端返回：手机号码或证件号码不正确！
位置：证件号码输入框下方（红色）
```

## 📁 修改的文件

1. `frontend/src/components/ForgotPassword/AccountInfoStep.tsx`
   - 添加 `maxLength={18}` 限制
   - 修改 `handleIdCardNumberChange` 函数，添加输入过滤
   - 统一错误提示格式和位置
   - 移除 `general` 错误显示

## ✨ 改进总结

1. ✅ **输入限制**：最多18位，自动过滤非法字符
2. ✅ **错误统一**：所有错误都显示在输入框下方
3. ✅ **文本统一**：错误提示简短明确
4. ✅ **用户体验**：错误提示靠近输入源，更直观
5. ✅ **自动转换**：字母自动转大写（适配身份证X）

现在的实现完全符合统一的错误提示规范！


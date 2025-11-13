# 下拉框z-index层级修复报告

## 📋 问题描述

**用户报告**：下拉框只能看到一个选项，其余两个选项被乘客信息区域边界覆盖

**问题原因**：
1. `PassengerInfoSection` 设置了 `overflow: hidden`，裁剪了下拉框
2. z-index层级不够高，被其他元素覆盖

---

## ✅ 修复措施

### 修复1：提高下拉框z-index

**文件**：`frontend/src/components/SelectDropdown.css`

```css
/* 修改前 */
.options-list {
  z-index: 1000;
}

/* 修改后 */
.options-list {
  z-index: 9999;  /* 提高z-index确保显示在所有元素之上 */
}
```

### 修复2：修复容器overflow

**文件**：`frontend/src/components/PassengerInfoSection.css`

```css
/* 修改前 */
.passenger-info-section {
  overflow: hidden;  /* ❌ 裁剪下拉框 */
}

.passenger-info-content {
  padding: 20px;
}

/* 修改后 */
.passenger-info-section {
  overflow: visible;  /* ✅ 允许下拉框显示 */
}

.passenger-info-content {
  padding: 20px;
  overflow: visible;  /* ✅ 允许下拉框溢出显示 */
}
```

### 修复3：确保定位上下文

**文件**：`frontend/src/components/PurchaseInfoRow.css`

```css
/* 修改前 */
.row-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 修改后 */
.row-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;  /* ✅ 确保下拉框相对于此定位 */
  z-index: 1;  /* ✅ 基础层级 */
}
```

---

## 🧪 测试验证

### 测试步骤

1. **刷新页面**
   - 按 Ctrl+Shift+R（Windows）或 Cmd+Shift+R（Mac）强制刷新

2. **测试下拉框**
   - 进入订单填写页
   - 选择乘客
   - 点击"二等座"右侧的下拉箭头

3. **预期结果**
   - ✅ 下拉框完整显示
   - ✅ 可以看到所有三个选项：
     - 二等座（¥517元）
     - 硬卧（¥1170元）
     - 软卧（¥1420元）
   - ✅ 选项不会被乘客信息区域覆盖

---

## 📊 z-index层级说明

项目中的z-index层级体系：

| 组件 | z-index | 用途 |
|------|---------|------|
| ConfirmModal | 10000 | 确认弹窗（最高层） |
| SelectDropdown | 9999 | 下拉选项列表 |
| OrderSuccessModal | 3000 | 订单成功弹窗 |
| ProcessingModal | 2000 | 处理中弹窗 |
| OrderConfirmationModal | 1000 | 信息核对弹窗 |
| DatePicker/StationInput | 1000 | 日期和站点选择器 |
| MainNavigation | 100 | 主导航栏 |
| TrainSearchForm | 10 | 搜索表单 |
| row-cell | 1 | 表格单元格（基础层） |

---

## 🐛 故障排查

### 如果下拉框仍然显示不完整

**检查1：CSS是否正确加载**
```javascript
// 在浏览器控制台运行
const section = document.querySelector('.passenger-info-section');
console.log('overflow:', window.getComputedStyle(section).overflow);
// 应该输出: overflow: visible
```

**检查2：z-index是否生效**
```javascript
const dropdown = document.querySelector('.options-list');
console.log('z-index:', window.getComputedStyle(dropdown).zIndex);
// 应该输出: z-index: 9999
```

**检查3：是否有其他样式覆盖**
- 打开开发者工具（F12）
- Elements标签页 → 选中下拉框元素
- Styles面板中查看是否有其他样式覆盖了z-index或overflow

---

## ✅ 验收清单

- [x] 修改 SelectDropdown.css 提高z-index
- [x] 修改 PassengerInfoSection.css 改为overflow: visible
- [x] 修改 PurchaseInfoRow.css 添加position和z-index
- [x] 代码无Linter错误
- [ ] 前端强制刷新（需用户操作）
- [ ] 下拉框显示完整三个选项（需用户验证）

---

**修复完成时间**：2025-11-13  
**问题类型**：CSS层级和overflow问题  
**修复状态**：✅ 已完成，待用户验证


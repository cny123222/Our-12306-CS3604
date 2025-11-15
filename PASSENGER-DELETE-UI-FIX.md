# 乘车人删除UI样式修复

## 问题描述

删除功能正常工作后，发现UI存在弹窗叠加问题：
- 删除成功的 SuccessModal 和确认对话框 ConfirmModal 出现重叠
- 看起来像一个弹窗覆盖在另一个弹窗之上

## 问题原因

1. **z-index 冲突**：
   - `ConfirmModal` 使用 `z-index: 10000`
   - `SuccessModal` 使用 `z-index: 1000-1001`（较低）
   - 导致后显示的成功提示可能被确认对话框遮挡

2. **CSS 类名冲突**：
   - 两个组件都使用 `.modal-content` 类
   - SuccessModal 的样式可能影响 ConfirmModal

3. **显示时机问题**：
   - 确认对话框关闭和成功提示显示几乎同时发生
   - 可能导致过渡动画重叠

## 解决方案

### 1. 修复 z-index 层级

**文件**：`frontend/src/components/SuccessModal.css`

```css
/* 调整遮罩层 z-index */
.overlay {
  z-index: 10001;  /* 从 1000 提升到 10001 */
}

/* 调整模态框 z-index */
.modal-30-percent {
  z-index: 10002;  /* 从 1001 提升到 10002 */
}
```

**原因**：确保成功提示模态框（SuccessModal）的层级高于确认对话框（ConfirmModal z-index: 10000）

### 2. 修复 CSS 类名冲突

**文件**：`frontend/src/components/SuccessModal.css`

**修改前**：
```css
.modal-content {
  text-align: center;
}

.modal-content p { ... }
.modal-content button { ... }
```

**修改后**：
```css
.modal-30-percent .modal-content {
  text-align: center;
}

.modal-30-percent .modal-content p { ... }
.modal-30-percent .modal-content button { ... }
```

**原因**：增加选择器特异性，避免 SuccessModal 的 `.modal-content` 样式影响 ConfirmModal

### 3. 优化显示时机

**文件**：`frontend/src/pages/PassengerManagementPage.tsx`

**修改**：
```typescript
if (response.ok) {
  await fetchPassengers();
  // 使用 setTimeout 确保确认对话框完全关闭后再显示成功提示
  setTimeout(() => {
    setSuccessMessage('删除成功');
    setShowSuccessModal(true);
  }, 100);
}
```

**原因**：给确认对话框 100ms 的时间完全关闭（包括动画），避免视觉上的重叠

## z-index 层级规划

| 组件 | 遮罩层 z-index | 内容层 z-index | 说明 |
|------|---------------|---------------|------|
| ConfirmModal | 10000 | 10000 | 确认对话框 |
| SuccessModal | 10001 | 10002 | 成功提示（较高层级）|

**设计原则**：后显示的模态框应该有更高的 z-index

## 改进效果

### 修复前
- ❌ 弹窗重叠
- ❌ 样式冲突
- ❌ 视觉混乱

### 修复后
- ✅ 弹窗层级清晰
- ✅ 样式独立
- ✅ 显示顺序流畅
- ✅ 用户体验良好

## 测试验证

1. **测试步骤**：
   - 进入乘车人管理页面
   - 点击删除按钮
   - 确认删除对话框应该清晰显示
   - 点击"确定"
   - 确认对话框关闭
   - 成功提示模态框显示
   - 点击"确认"关闭成功提示

2. **预期效果**：
   - ✅ 确认对话框显示清晰，无背景重叠
   - ✅ 确认对话框关闭后，成功提示平滑显示
   - ✅ 成功提示显示清晰，无背景重叠
   - ✅ 整体视觉体验流畅

## 其他 UI 组件注意事项

### 避免 z-index 冲突的最佳实践

1. **统一规划 z-index**：
   ```
   常规内容: 1-99
   下拉菜单: 100-999
   固定导航: 1000-9999
   模态框: 10000+
   ```

2. **使用特定的类名**：
   - 避免使用过于通用的类名如 `.modal-content`
   - 使用组件特定的前缀，如 `.success-modal-content`

3. **使用 CSS 变量**：
   ```css
   :root {
     --z-index-modal: 10000;
     --z-index-modal-overlay: 10001;
     --z-index-modal-content: 10002;
   }
   ```

4. **延迟显示**：
   - 当需要连续显示多个模态框时
   - 使用 setTimeout 确保动画不重叠

## 相关文件

- `frontend/src/components/SuccessModal.css` - 成功提示样式
- `frontend/src/components/ConfirmModal.css` - 确认对话框样式
- `frontend/src/pages/PassengerManagementPage.tsx` - 页面逻辑

## 总结

通过以下三个方面的修复：
1. ✅ 调整 z-index 层级关系
2. ✅ 修复 CSS 类名冲突
3. ✅ 优化显示时机

成功解决了弹窗叠加的UI问题，提升了用户体验。


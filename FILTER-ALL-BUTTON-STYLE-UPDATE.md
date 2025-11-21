# 筛选面板"全部"按钮样式优化

## 修改内容

优化车次列表页筛选面板中"全部"按钮的视觉反馈，根据选择状态显示不同的样式。

## 修改的文件

1. `frontend/src/components/TrainFilterPanel.tsx` - 添加动态样式逻辑
2. `frontend/src/components/TrainFilterPanel.css` - 添加部分选择状态样式

## 功能说明

### 三种状态

"全部"按钮现在根据选择状态显示不同样式：

#### 1. 全选状态
- **背景色**：#8ea7d4（蓝色）
- **文字色**：白色
- **边框**：无

#### 2. 全不选状态
- **背景色**：#8ea7d4（蓝色）
- **文字色**：白色
- **边框**：无

#### 3. 部分选择状态（新增）
- **背景色**：白色
- **文字色**：#999999（灰色）
- **边框**：1px solid #8ea7d4（蓝色）

### 应用范围

所有筛选项的"全部"按钮：
- ✅ 车次类型
- ✅ 出发车站
- ✅ 到达车站
- ✅ 车次席别

## 实现细节

### TypeScript 逻辑
```typescript
// 判断"全部"按钮的状态
const getSelectAllButtonClass = (selectedCount: number, totalCount: number) => {
  if (selectedCount === 0 || selectedCount === totalCount) {
    return 'filter-all-btn';  // 全选或全不选
  }
  return 'filter-all-btn partial';  // 部分选择
};
```

### CSS 样式
```css
/* 部分选择状态 */
.filter-all-btn.partial {
  background-color: white;
  color: #999999;
  border: 1px solid #8ea7d4;
}

.filter-all-btn.partial:hover {
  background-color: #f5f5f5;
  border-color: #7a95c5;
}
```

## 用户体验改进

1. **清晰的视觉反馈**：用户可以一眼看出当前的选择状态
2. **一致的交互逻辑**：所有筛选项的"全部"按钮行为一致
3. **优雅的状态过渡**：通过CSS transition实现平滑的样式切换

## 测试场景

### 测试步骤
1. 进入车次列表页
2. 在任一筛选项中：
   - 不勾选任何选项 → "全部"按钮显示蓝色背景
   - 勾选所有选项 → "全部"按钮显示蓝色背景
   - 勾选部分选项 → "全部"按钮显示白色背景+蓝色边框+灰色文字

### 预期结果
- ✅ "全部"按钮样式根据选择状态动态变化
- ✅ 鼠标悬停时有适当的hover效果
- ✅ 所有筛选项的按钮行为一致

## 完成时间
2025-11-21


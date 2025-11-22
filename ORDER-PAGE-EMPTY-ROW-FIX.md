# 订单填写页空行席位选择报错修复

## 问题描述

### 错误信息
```
Uncaught TypeError: Cannot read properties of undefined (reading 'name')
    at PurchaseInfoRow (PurchaseInfoRow.tsx:78:45)
```

### 问题场景
在订单填写页选择席位类别为商务座（或任何席位类型）时，如果还没有选择任何乘客，页面会报错崩溃。

### 错误截图
错误发生在 `PurchaseInfoRow.tsx` 第 78 行：
```javascript
<input type="text" value={passenger.name} readOnly className="readonly-input" />
```

## 问题根源分析

### 1. 空行显示逻辑
在 `PurchaseInfoTable.tsx` 中，当没有选择乘客时（`purchaseInfo.length === 0`），会显示一个默认的空行：

```javascript
const displayInfo = purchaseInfo.length === 0 
  ? [{
      passenger: { name: '', idCardType: '居民身份证', idCardNumber: '' },
      ticketType: '成人票',
      seatType: availableSeatTypes.length > 0 ? availableSeatTypes[0] : ''
    }]
  : purchaseInfo;
```

### 2. 用户操作触发问题
用户在这个空行上选择席位类别时，会触发 `onSeatTypeChange(index, seatType)`。

### 3. 错误的更新逻辑
`OrderPage.tsx` 中的 `handleSeatTypeChange` 函数：

```javascript
const handleSeatTypeChange = (index: number, seatType: string) => {
  const newPurchaseInfo = [...purchaseInfo];
  newPurchaseInfo[index] = {
    ...newPurchaseInfo[index],  // ❌ 问题：purchaseInfo[0] 是 undefined
    seatType: seatType,
  };
  setPurchaseInfo(newPurchaseInfo);
};
```

**问题**：
- `purchaseInfo` 是空数组 `[]`
- `purchaseInfo[0]` 是 `undefined`
- 展开 `...undefined` 不会报错，但结果是 `{}`
- 最终 `newPurchaseInfo[0]` 变成 `{ seatType: '商务座' }`
- **丢失了 `passenger` 属性！**

### 4. 渲染失败
当 React 重新渲染 `PurchaseInfoRow` 时：
- `info.passenger` 是 `undefined`（因为上一步丢失了）
- 尝试访问 `passenger.name` 导致报错

## 解决方案

### 1. 修复 `OrderPage.tsx` 的 `handleSeatTypeChange` 函数

**修改前**：
```javascript
const handleSeatTypeChange = (index: number, seatType: string) => {
  const newPurchaseInfo = [...purchaseInfo];
  newPurchaseInfo[index] = {
    ...newPurchaseInfo[index],
    seatType: seatType,
  };
  setPurchaseInfo(newPurchaseInfo);
};
```

**修改后**：
```javascript
const handleSeatTypeChange = (index: number, seatType: string) => {
  // 检查索引是否有效
  if (index < 0 || index >= purchaseInfo.length) {
    return; // 如果是空行（默认显示），不执行任何操作
  }
  
  const newPurchaseInfo = [...purchaseInfo];
  newPurchaseInfo[index] = {
    ...newPurchaseInfo[index],
    seatType: seatType,
  };
  setPurchaseInfo(newPurchaseInfo);
};
```

### 2. 修复 `OrderPage.tsx` 的 `handleTicketTypeChange` 函数

同样的问题和解决方案：

```javascript
const handleTicketTypeChange = (index: number, ticketType: string) => {
  // 检查索引是否有效
  if (index < 0 || index >= purchaseInfo.length) {
    return; // 如果是空行（默认显示），不执行任何操作
  }
  
  const newPurchaseInfo = [...purchaseInfo];
  newPurchaseInfo[index] = {
    ...newPurchaseInfo[index],
    ticketType: ticketType,
  };
  setPurchaseInfo(newPurchaseInfo);
};
```

### 3. 修复 `PurchaseInfoTable.tsx` 禁用空行操作

**修改前**：
```javascript
const displayInfo = purchaseInfo.length === 0 ? [...] : purchaseInfo;

return (
  ...
  {displayInfo.map((info, index) => (
    <PurchaseInfoRow
      ...
      onSeatTypeChange={(seatType) => onSeatTypeChange(index, seatType)}
      onTicketTypeChange={(ticketType) => onTicketTypeChange(index, ticketType)}
      onDelete={onDeleteRow ? () => onDeleteRow(index) : undefined}
    />
  ))}
);
```

**修改后**：
```javascript
const isEmptyRow = purchaseInfo.length === 0;
const displayInfo = isEmptyRow ? [...] : purchaseInfo;

return (
  ...
  {displayInfo.map((info, index) => (
    <PurchaseInfoRow
      ...
      onSeatTypeChange={isEmptyRow ? () => {} : (seatType) => onSeatTypeChange(index, seatType)}
      onTicketTypeChange={isEmptyRow ? () => {} : (ticketType) => onTicketTypeChange(index, ticketType)}
      onDelete={onDeleteRow && !isEmptyRow ? () => onDeleteRow(index) : undefined}
    />
  ))}
);
```

### 4. 在 `PurchaseInfoRow.tsx` 中添加防御性代码

```javascript
// 防御性编程：确保 passenger 对象存在
const safePassenger = passenger || { name: '', idCardType: '居民身份证', idCardNumber: '' };

return (
  <div className="purchase-info-row">
    ...
    <div className="row-cell">
      <input type="text" value={safePassenger.name} readOnly className="readonly-input" />
    </div>
    <div className="row-cell">
      <SelectDropdown
        value={safePassenger.idCardType || '居民身份证'}
        ...
      />
    </div>
    <div className="row-cell">
      <input type="text" value={maskIdNumber(safePassenger.idCardNumber)} readOnly className="readonly-input" />
    </div>
    ...
  </div>
);
```

## 修复效果

### 修复前
1. ❌ 用户在空行上选择席位类别时，页面崩溃
2. ❌ 错误信息：`Cannot read properties of undefined (reading 'name')`
3. ❌ 用户体验极差，无法继续操作

### 修复后
1. ✅ 用户在空行上选择席位类别时，不会触发任何操作
2. ✅ 页面不会崩溃
3. ✅ 用户需要先选择乘客，然后才能修改席位类别
4. ✅ 符合正常的业务流程

## 测试验证

### 测试步骤
1. 进入订单填写页
2. 不选择任何乘客
3. 在空行上尝试选择不同的席位类别（商务座、一等座、二等座等）
4. 验证页面不会报错崩溃

### 预期结果
- ✅ 页面正常显示
- ✅ 席位选择器可以点击，但不会触发任何更新
- ✅ 空行的乘客信息保持为空
- ✅ 没有错误信息

## 修改文件清单

1. **frontend/src/pages/OrderPage.tsx**
   - 修复 `handleSeatTypeChange` 函数，添加索引有效性检查
   - 修复 `handleTicketTypeChange` 函数，添加索引有效性检查

2. **frontend/src/components/PurchaseInfoTable.tsx**
   - 添加 `isEmptyRow` 标志
   - 空行时禁用回调函数

3. **frontend/src/components/PurchaseInfoRow.tsx**
   - 添加 `safePassenger` 防御性代码
   - 防止 `passenger` 为 `undefined` 时的访问错误

## 注意事项

1. **业务逻辑**：
   - 用户必须先选择乘客，才能修改席位和票种
   - 空行只是一个占位符，用于显示表格结构

2. **防御性编程**：
   - 在三个层面添加了保护：
     - OrderPage：检查索引
     - PurchaseInfoTable：禁用回调
     - PurchaseInfoRow：确保对象存在

3. **用户体验**：
   - 虽然用户可以点击空行的选择器，但不会有任何效果
   - 这比显示错误信息更好，因为不会打断用户流程

## 总结

这个问题是由于空行显示逻辑与状态更新逻辑不匹配导致的。修复通过三层防护确保了：
1. **数据层**：检查数据有效性
2. **逻辑层**：禁用无效操作
3. **显示层**：防御性访问

修复后，订单填写页更加健壮，不会因为用户的意外操作而崩溃。


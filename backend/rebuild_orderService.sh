#!/bin/bash

# 提取前237行（已重构的calculateCrossIntervalFare, getOrderPageData, getDefaultSeatType, getAvailableSeatTypes）
head -237 src/services/orderService.backup > src/services/orderService_rebuilt.js

# 添加新的函数（从新函数文件中提取，跳过开头的imports和uuidv4）
tail -n +11 src/services/orderService_new_functions.js | head -n -6 >> src/services/orderService_rebuilt.js

# 提取confirmOrder函数（从备份中），533-745行
sed -n '533,745p' src/services/orderService.backup >> src/services/orderService_rebuilt.js

# 添加module.exports（从备份中）
echo "" >> src/services/orderService_rebuilt.js
tail -12 src/services/orderService.backup >> src/services/orderService_rebuilt.js

# 替换原文件
cp src/services/orderService_rebuilt.js src/services/orderService.js

echo "Rebuilt orderService.js"
wc -l src/services/orderService.js

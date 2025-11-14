#!/usr/bin/env python3
import re

# 读取新函数
with open('src/services/orderService_new_functions.js', 'r', encoding='utf-8') as f:
    new_functions_content = f.read()

# 提取单个函数
def extract_function(content, func_name):
    pattern = rf'(async function {func_name}\([^)]*\)[^{{]*\{{(?:[^{{}}]|\{{[^{{}}]*\}})*\}})'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1)
    return None

# 读取原文件
with open('src/services/orderService.js', 'r', encoding='utf-8') as f:
    original_content = f.read()

# 替换函数
functions_to_replace = [
    'createOrder',
    'getOrderDetails',
    'updateOrderStatus',
    'lockSeats',
    'releaseSeatLocks',
    'confirmSeatAllocation',
    'calculateOrderTotalPrice'
]

for func_name in functions_to_replace:
    new_func = extract_function(new_functions_content, func_name)
    if new_func:
        # 查找原函数的位置
        pattern = rf'async function {func_name}\([^)]*\)[^{{]*\{{.*?^\}}'
        match = re.search(pattern, original_content, re.DOTALL | re.MULTILINE)
        if match:
            original_content = original_content[:match.start()] + new_func + original_content[match.end():]
            print(f"Replaced {func_name}")
        else:
            print(f"Could not find {func_name} in original file")
    else:
        print(f"Could not extract {func_name} from new functions file")

# 写回文件
with open('src/services/orderService.js', 'w', encoding='utf-8') as f:
    f.write(original_content)

print("\nDone!")

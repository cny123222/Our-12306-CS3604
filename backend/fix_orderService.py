import re

# 读取文件
with open('src/services/orderService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 检查是否已经import db
if 'const db = require' not in content[:500]:
    print("ERROR: db import not found")
    exit(1)

# 2. 删除所有 const db = getDatabase()
content = re.sub(r'    const db = getDatabase\(\);?\n', '', content)

# 3. 删除所有 db.close()
content = re.sub(r'          db\.close\(\);?\n', '', content)
content = re.sub(r'            db\.close\(\);?\n', '', content)
content = re.sub(r'              db\.close\(\);?\n', '', content)

# 4. 将 return new Promise((resolve, reject) => { 模式替换为 try-catch
# 这个比较复杂，先不做

# 写回文件  
with open('src/services/orderService.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed orderService.js")
print(f"File size: {len(content)} bytes")

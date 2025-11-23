#!/bin/bash

# 重启后端服务器脚本

echo "===== 停止旧的后端服务器 ====="
pkill -f "node.*server.js"
sleep 1

echo "✅ 旧进程已停止"
echo ""

echo "===== 启动新的后端服务器 ====="
cd "$(dirname "$0")/backend"
npm start > /tmp/backend.log 2>&1 &
NEW_PID=$!

echo "✅ 后端服务器已启动"
echo "进程 PID: $NEW_PID"
echo "日志文件: /tmp/backend.log"
echo ""

sleep 2

echo "===== 服务器启动日志 ====="
tail -20 /tmp/backend.log
echo ""

echo "===== 服务器状态检查 ====="
if lsof -i:3000 > /dev/null 2>&1; then
  echo "✅ 服务器正在监听端口 3000"
else
  echo "❌ 服务器未能启动，请查看日志"
  exit 1
fi

echo ""
echo "🎉 后端服务器重启完成！"
echo ""
echo "现在可以进行以下操作："
echo "1. 清除浏览器缓存: localStorage.clear()"
echo "2. 重新登录"
echo "3. 测试购买流程"


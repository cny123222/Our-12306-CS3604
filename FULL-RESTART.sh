#!/bin/bash

echo "===== 完整重启系统 ====="
echo ""

# 停止所有服务
echo "1. 停止所有服务..."
pkill -f "node.*server.js"
pkill -f vite
sleep 2

# 重启后端
echo ""
echo "2. 启动后端服务器..."
cd "$(dirname "$0")/backend"
node src/server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✅ 后端服务器已启动 (PID: $BACKEND_PID)"
sleep 2

# 检查后端
if lsof -i:3000 > /dev/null 2>&1; then
  echo "   ✅ 后端正在监听端口 3000"
else
  echo "   ❌ 后端启动失败"
  exit 1
fi

# 重启前端
echo ""
echo "3. 启动前端开发服务器..."
cd "$(dirname "$0")/frontend"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   ✅ 前端服务器已启动 (PID: $FRONTEND_PID)"
sleep 3

# 检查前端
if lsof -i:5173 > /dev/null 2>&1; then
  echo "   ✅ 前端正在监听端口 5173"
else
  echo "   ⚠️  前端可能需要更长时间启动"
fi

echo ""
echo "===== 系统启动完成 ====="
echo ""
echo "📋 服务状态："
echo "   - 后端: http://localhost:3000 (PID: $BACKEND_PID)"
echo "   - 前端: http://localhost:5173 (PID: $FRONTEND_PID)"
echo "   - 后端日志: /tmp/backend.log"
echo "   - 前端日志: /tmp/frontend.log"
echo ""
echo "🌐 请在浏览器中访问："
echo "   http://localhost:5173"
echo ""
echo "💡 记得清除浏览器缓存："
echo "   Mac: Command + Shift + R"
echo "   Windows: Ctrl + Shift + R"
echo ""
echo "或在浏览器控制台执行："
echo "   localStorage.clear(); location.reload();"
echo ""


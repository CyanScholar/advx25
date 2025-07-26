#!/bin/bash

# 检查前端服务是否已运行
if [ -f /root/advx/frontend.pid ]; then
    FRONTEND_PID=$(cat /root/advx/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ 前端服务已在运行 (PID: $FRONTEND_PID)"
        echo "请先停止服务: ./stop.sh"
        exit 1
    else
        echo "⚠️  发现无效的PID文件，清理中..."
        rm /root/advx/frontend.pid
    fi
fi

# 检查后端服务是否已运行
if [ -f /root/advx/backend.pid ]; then
    BACKEND_PID=$(cat /root/advx/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ 后端服务已在运行 (PID: $BACKEND_PID)"
        echo "请先停止服务: ./stop.sh"
        exit 1
    else
        echo "⚠️  发现无效的PID文件，清理中..."
        rm /root/advx/backend.pid
    fi
fi

# 检查端口是否被占用
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ 端口8000已被占用"
    echo "请先停止占用端口的服务"
    exit 1
fi

if lsof -Pi :9999 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ 端口9999已被占用"
    echo "请先停止占用端口的服务"
    exit 1
fi

# 启动前端 HTTP 服务器
echo "🚀 启动前端 HTTP 服务器..."
cd /root/advx/frontend
python3 -m http.server 8000 &
FRONTEND_PID=$!
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"

# 启动后端 FastAPI 服务器
echo "🐍 启动后端 FastAPI 服务器..."
cd /root/advx/backend
python3 server.py &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"

# 保存进程ID
echo $FRONTEND_PID > /root/advx/frontend.pid
echo $BACKEND_PID > /root/advx/backend.pid

echo ""
echo "🎉 部署完成！"
echo "📱 前端访问地址: http://localhost:8000"
echo "🔧 API 地址: http://localhost:9999"
echo ""
echo "📋 常用命令:"
echo "  查看前端日志: tail -f /root/advx/frontend.log"
echo "  查看后端日志: tail -f /root/advx/backend/server.log"
echo "  停止服务: ./stop.sh"
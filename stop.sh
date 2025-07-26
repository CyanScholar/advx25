#!/bin/bash

# 清空AI对话会话
echo "🧹 正在清空AI对话会话..."
curl -X POST http://localhost:9999/agent/reset_session > /dev/null 2>&1
echo "✅ AI对话会话已清空"

# 关闭前端服务
if [ -f /root/advx/frontend.pid ]; then
    FRONTEND_PID=$(cat /root/advx/frontend.pid)
    echo "🛑 正在关闭前端服务 (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
    rm /root/advx/frontend.pid
    echo "✅ 前端服务已关闭"
else
    echo "⚠️  未找到前端 PID 文件，前端服务可能未运行。"
fi

# 关闭后端服务
if [ -f /root/advx/backend.pid ]; then
    BACKEND_PID=$(cat /root/advx/backend.pid)
    echo "🛑 正在关闭后端服务 (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
    rm /root/advx/backend.pid
    echo "✅ 后端服务已关闭"
else
    echo "⚠️  未找到后端 PID 文件，后端服务可能未运行。"
fi

echo "🎉 所有服务已关闭。" 
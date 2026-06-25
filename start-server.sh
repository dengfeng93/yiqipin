#!/bin/bash
# 一起拼 - 后端启动脚本
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/server"

echo "==> 检查 Node.js..."
node --version

echo "==> 安装依赖..."
npm install --silent

echo "==> 编译 TypeScript..."
npx tsc

echo "==> 启动服务器 (端口 3000)..."
echo "    API: http://localhost:3000/api/v1"
echo "    Health: http://localhost:3000/api/v1/health"
echo ""
node dist/main.js

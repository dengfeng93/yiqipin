#!/bin/bash
# 一起拼 - 前端启动脚本 (Chrome Web)
set -e

export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/app"

echo "==> 检查 Flutter..."
flutter --version

echo "==> 获取依赖..."
flutter pub get

echo "==> 启动 Chrome 调试模式..."
echo "    后端 API 地址: http://localhost:3000/api/v1"
echo ""
flutter run -d chrome

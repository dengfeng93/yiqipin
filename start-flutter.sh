#!/bin/bash
# 一起拼 Flutter Web App 启动脚本
# Flutter SDK at D:\flutter

export PATH="/d/flutter/bin:$PATH"
APP_DIR="$(dirname "$0")/app"

echo "=== 启动 Flutter Web App ==="
echo "Flutter SDK: $(flutter --version 2>&1 | head -1)"
echo "App 目录: $APP_DIR"
echo ""

cd "$APP_DIR" && flutter run -d chrome

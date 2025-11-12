#!/bin/bash
# 创建 v0-interview 用户的独立脚本
# 可以单独运行，也可以由 setup-linode.sh 调用

set -e

APP_USER="v0-interview"
APP_HOME="/home/$APP_USER"

if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 root 用户运行此脚本"
    echo "使用: sudo $0"
    exit 1
fi

echo "创建用户 $APP_USER..."

# 检查用户是否已存在
if id "$APP_USER" &>/dev/null; then
    echo "⚠️  用户 $APP_USER 已存在"
    exit 0
fi

# 创建用户
useradd -m -s /bin/bash "$APP_USER"
echo "✅ 用户 $APP_USER 已创建"

# 将用户添加到 docker 组
if getent group docker > /dev/null 2>&1; then
    usermod -aG docker "$APP_USER"
    echo "✅ 用户已添加到 docker 组"
fi

# 创建应用目录
mkdir -p "$APP_HOME/apps"
chown -R "$APP_USER:$APP_USER" "$APP_HOME"
echo "✅ 应用目录已创建: $APP_HOME/apps"

echo ""
echo "用户创建完成！"
echo "切换到用户: su - $APP_USER"


#!/bin/bash

# 启动本地测试环境脚本
# 用途：启动 Docker 容器并运行数据库迁移

set -e

echo "🚀 启动本地测试环境..."
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker Desktop"
    echo "   下载地址: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# 检查 docker compose 是否可用
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif docker-compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose 未安装"
    exit 1
fi

echo "✅ Docker 已安装"
echo ""

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 1. 启动 Docker 容器
echo "📦 启动 Docker 容器..."
$COMPOSE_CMD up -d postgres

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 5

# 检查数据库是否就绪
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose exec -T postgres pg_isready -U postgres &> /dev/null; then
        echo "✅ 数据库已就绪"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ 数据库启动超时"
    exit 1
fi

# 2. 运行数据库迁移
echo ""
echo "📝 运行数据库迁移..."
if [ -f "scripts/260118_add_school_admins_table.sql" ]; then
    echo "   执行: scripts/260118_add_school_admins_table.sql"
    $COMPOSE_CMD exec -T postgres psql -U postgres -d v0_interview -f /dev/stdin < scripts/260118_add_school_admins_table.sql
    echo "✅ 数据库迁移完成"
else
    echo "⚠️  迁移脚本不存在: scripts/260118_add_school_admins_table.sql"
fi

# 3. 检查迁移结果
echo ""
echo "🔍 检查迁移结果..."
$COMPOSE_CMD exec -T postgres psql -U postgres -d v0_interview -c "\d school_admins" || echo "⚠️  school_admins 表可能不存在"

echo ""
echo "✅ 本地测试环境已启动！"
echo ""
echo "📋 下一步："
echo "   1. 启动应用服务: pnpm dev"
echo "   2. 访问: http://localhost:3000"
echo "   3. 参考测试指南: MULTI-ADMIN-TESTING-GUIDE.md"
echo ""
echo "💡 提示："
echo "   - 数据库端口: 5432"
echo "   - 数据库用户: postgres"
echo "   - 数据库密码: postgres"
echo "   - 数据库名: v0_interview"
echo ""
echo "🛑 停止环境: docker compose down"

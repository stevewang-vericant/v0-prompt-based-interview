#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置 - 针对 linode-Athena 服务器
# 项目路径与 ai-tm 保持一致的结构：/home/用户名/apps/项目名
APP_USER="v0-interview"
PROJECT_DIR="/home/$APP_USER/apps/v0-interview"
COMPOSE_FILE="docker-compose.linode.yml"
NGINX_CONFIG="/etc/nginx/sites-available/v0-interview"

echo -e "${GREEN}🚀 开始部署到 Linode 服务器...${NC}"

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ 项目目录不存在: $PROJECT_DIR${NC}"
    echo -e "${YELLOW}请修改脚本中的 PROJECT_DIR 变量${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# 检查环境变量文件
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production 文件不存在${NC}"
    echo -e "${YELLOW}正在从模板创建...${NC}"
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        echo -e "${YELLOW}请编辑 .env.production 文件并填入正确的环境变量${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.production.example 也不存在${NC}"
        exit 1
    fi
fi

# 拉取最新代码
echo -e "${GREEN}📥 拉取最新代码...${NC}"
git pull origin main || echo -e "${YELLOW}⚠️  git pull 失败，继续使用当前代码${NC}"

# 停止旧容器
echo -e "${GREEN}🛑 停止旧容器...${NC}"
docker compose -f "$COMPOSE_FILE" down || true

# 从 .env.production 提取 NEXT_PUBLIC_* 变量到 .env 文件（docker-compose 会自动读取）
echo -e "${GREEN}📋 准备构建环境变量...${NC}"
if [ -f ".env.production" ]; then
    # 提取 NEXT_PUBLIC_* 变量到 .env 文件（docker-compose 会自动读取）
    grep -E "^NEXT_PUBLIC_" .env.production > .env.build 2>/dev/null || true
    echo -e "${GREEN}✅ 构建环境变量文件已创建${NC}"
    if [ -s ".env.build" ]; then
        echo -e "${GREEN}    $(wc -l < .env.build) 个 NEXT_PUBLIC_* 变量已提取${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到 NEXT_PUBLIC_* 变量${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.production 文件不存在${NC}"
    exit 1
fi

# 构建并启动（需要先加载 .env.build 中的变量）
echo -e "${GREEN}🔨 构建并启动容器...${NC}"
if [ -f ".env.build" ]; then
    # 加载 .env.build 中的变量到当前 shell，然后运行 docker compose
    set -a
    source .env.build
    set +a
    docker compose -f "$COMPOSE_FILE" up -d --build
else
    echo -e "${RED}❌ .env.build 文件不存在，无法构建${NC}"
    exit 1
fi

# 等待服务启动
echo -e "${GREEN}⏳ 等待服务启动（10秒）...${NC}"
sleep 10

# 检查状态
echo -e "${GREEN}✅ 检查部署状态...${NC}"
docker compose -f "$COMPOSE_FILE" ps

# 检查健康状态
echo -e "${GREEN}🏥 检查应用健康状态...${NC}"
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 应用运行正常！${NC}"
else
    echo -e "${YELLOW}⚠️  应用可能还在启动中，请稍后检查${NC}"
    echo -e "${YELLOW}查看日志: docker-compose -f $COMPOSE_FILE logs -f${NC}"
fi

# 检查并配置 Nginx
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}🌐 检查 Nginx 配置...${NC}"
    if [ ! -f "$NGINX_CONFIG" ]; then
        echo -e "${YELLOW}⚠️  Nginx 配置不存在，请手动创建${NC}"
        echo -e "${YELLOW}配置文件位置: $NGINX_CONFIG${NC}"
    else
        echo -e "${GREEN}✅ Nginx 配置已存在${NC}"
        # 测试配置
        if sudo nginx -t 2>/dev/null; then
            echo -e "${GREEN}✅ Nginx 配置有效${NC}"
            echo -e "${YELLOW}提示: 运行 'sudo systemctl reload nginx' 以应用配置${NC}"
        fi
    fi
fi

echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}本地访问: http://localhost:3001${NC}"
echo -e "${GREEN}查看日志: docker compose -f $COMPOSE_FILE logs -f${NC}"


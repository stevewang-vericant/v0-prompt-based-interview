#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  本地备份测试脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker 未安装${NC}"
    echo -e "${YELLOW}请先安装 Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker Compose 未安装${NC}"
    exit 1
fi

# 检查项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "${PROJECT_DIR}/docker-compose.yml" ]; then
    echo -e "${RED}❌ 错误: 未找到 docker-compose.yml${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

echo -e "${GREEN}项目目录: ${PROJECT_DIR}${NC}"
echo ""

# 检查容器是否运行
echo -e "${GREEN}检查 Docker 容器状态...${NC}"
if docker compose ps postgres 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL 容器正在运行${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL 容器未运行${NC}"
    echo -e "${YELLOW}是否启动容器？(y/n)${NC}"
    read -p "> " START_CONTAINER
    if [ "$START_CONTAINER" = "y" ] || [ "$START_CONTAINER" = "Y" ]; then
        echo -e "${GREEN}启动容器...${NC}"
        docker compose up -d
        echo -e "${GREEN}等待容器启动...${NC}"
        sleep 5
    else
        echo -e "${RED}❌ 无法继续测试，容器未运行${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  测试备份功能${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 运行备份脚本
if ./scripts/backup-database.sh; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ 备份测试成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}备份文件位置:${NC}"
    ls -lh backups/ | tail -5
    echo ""
    echo -e "${GREEN}下一步：${NC}"
    echo -e "  1. 检查备份文件: ${YELLOW}ls -lh backups/${NC}"
    echo -e "  2. 查看备份内容: ${YELLOW}zcat backups/v0_interview_*.sql.gz | head -20${NC}"
    echo -e "  3. 测试恢复功能: ${YELLOW}./scripts/restore-database.sh backups/v0_interview_*.sql.gz${NC}"
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ❌ 备份测试失败${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi


#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
# 自动检测项目目录（脚本所在目录的父目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 自动检测 Docker Compose 文件
if [ -f "${PROJECT_DIR}/docker-compose.linode.yml" ]; then
    COMPOSE_FILE="docker-compose.linode.yml"
    CONTAINER_NAME="v0-interview-postgres"
elif [ -f "${PROJECT_DIR}/docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
    CONTAINER_NAME="postgres"
else
    echo -e "${RED}❌ 错误: 未找到 Docker Compose 文件${NC}"
    exit 1
fi

BACKUP_DIR="${PROJECT_DIR}/backups"
DB_NAME="v0_interview"
DB_USER="postgres"
RETENTION_DAYS=30  # 保留 30 天的备份
COMPRESS=true      # 是否压缩备份文件

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名（带时间戳）
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/v0_interview_${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  数据库备份脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${GREEN}数据库: ${DB_NAME}${NC}"
echo -e "${GREEN}备份目录: ${BACKUP_DIR}${NC}"
echo ""

cd "$PROJECT_DIR"

# 检查 Docker Compose 文件是否存在
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ 错误: Docker Compose 文件不存在: ${PROJECT_DIR}/${COMPOSE_FILE}${NC}"
    exit 1
fi

# 检查 PostgreSQL 容器是否运行
if ! docker compose -f "$COMPOSE_FILE" ps "$CONTAINER_NAME" 2>/dev/null | grep -q "Up"; then
    echo -e "${RED}❌ 错误: PostgreSQL 容器未运行 (${CONTAINER_NAME})${NC}"
    echo -e "${YELLOW}提示: 请先启动 Docker 容器${NC}"
    echo -e "${YELLOW}      docker compose -f $COMPOSE_FILE up -d${NC}"
    exit 1
fi

# 执行备份
echo -e "${GREEN}📦 开始备份数据库...${NC}"
echo -e "${GREEN}   使用 Compose 文件: ${COMPOSE_FILE}${NC}"
echo -e "${GREEN}   容器名称: ${CONTAINER_NAME}${NC}"
if docker compose -f "$COMPOSE_FILE" exec -T "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    echo -e "${GREEN}✅ 备份文件已创建: ${BACKUP_FILE}${NC}"
    
    # 获取备份文件大小
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}   文件大小: ${BACKUP_SIZE}${NC}"
    
    # 压缩备份文件（如果启用）
    if [ "$COMPRESS" = true ]; then
        echo -e "${GREEN}🗜️  压缩备份文件...${NC}"
        if gzip -f "$BACKUP_FILE"; then
            COMPRESSED_SIZE=$(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)
            echo -e "${GREEN}✅ 压缩完成: ${BACKUP_FILE_COMPRESSED}${NC}"
            echo -e "${GREEN}   压缩后大小: ${COMPRESSED_SIZE}${NC}"
            FINAL_BACKUP_FILE="$BACKUP_FILE_COMPRESSED"
        else
            echo -e "${YELLOW}⚠️  压缩失败，保留未压缩文件${NC}"
            FINAL_BACKUP_FILE="$BACKUP_FILE"
        fi
    else
        FINAL_BACKUP_FILE="$BACKUP_FILE"
    fi
    
    # 验证备份文件
    if [ -f "$FINAL_BACKUP_FILE" ] && [ -s "$FINAL_BACKUP_FILE" ]; then
        echo -e "${GREEN}✅ 备份文件验证成功${NC}"
    else
        echo -e "${RED}❌ 错误: 备份文件无效或为空${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ 错误: 备份失败${NC}"
    exit 1
fi

# 清理旧备份
echo ""
echo -e "${GREEN}🧹 清理 ${RETENTION_DAYS} 天前的旧备份...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "v0_interview_*.sql*" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 已删除 ${DELETED_COUNT} 个旧备份文件${NC}"
else
    echo -e "${GREEN}✅ 没有需要删除的旧备份${NC}"
fi

# 显示备份统计
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  备份统计${NC}"
echo -e "${BLUE}========================================${NC}"
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "v0_interview_*.sql*" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo -e "${GREEN}总备份数: ${TOTAL_BACKUPS}${NC}"
echo -e "${GREEN}总大小: ${TOTAL_SIZE}${NC}"
echo -e "${GREEN}最新备份: $(ls -t ${BACKUP_DIR}/v0_interview_*.sql* 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo '无')${NC}"
echo ""

echo -e "${GREEN}🎉 备份完成！${NC}"
echo -e "${GREEN}备份文件: ${FINAL_BACKUP_FILE}${NC}"


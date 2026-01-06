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

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ 错误: 请指定备份文件${NC}"
    echo ""
    echo "使用方法:"
    echo "  $0 <backup_file>"
    echo ""
    echo "示例:"
    echo "  $0 backups/v0_interview_20250106_120000.sql.gz"
    echo "  $0 backups/v0_interview_20250106_120000.sql"
    echo ""
    echo "可用的备份文件:"
    ls -lh "$BACKUP_DIR"/v0_interview_*.sql* 2>/dev/null | tail -10 || echo "  无备份文件"
    exit 1
fi

BACKUP_FILE="$1"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    # 如果只提供了文件名，尝试在备份目录中查找
    if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        echo -e "${RED}❌ 错误: 备份文件不存在: ${BACKUP_FILE}${NC}"
        exit 1
    else
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  数据库恢复脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${GREEN}数据库: ${DB_NAME}${NC}"
echo -e "${GREEN}备份文件: ${BACKUP_FILE}${NC}"
echo ""

# 警告
echo -e "${RED}⚠️  警告: 此操作将覆盖当前数据库！${NC}"
echo -e "${YELLOW}请确认您要恢复的备份文件是正确的。${NC}"
echo ""
read -p "是否继续？(yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}操作已取消${NC}"
    exit 0
fi

cd "$PROJECT_DIR"

# 检查 PostgreSQL 容器是否运行
if ! docker compose -f "$COMPOSE_FILE" ps "$CONTAINER_NAME" 2>/dev/null | grep -q "Up"; then
    echo -e "${RED}❌ 错误: PostgreSQL 容器未运行 (${CONTAINER_NAME})${NC}"
    exit 1
fi

# 解压备份文件（如果是压缩的）
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${GREEN}📦 解压备份文件...${NC}"
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# 执行恢复
echo -e "${GREEN}🔄 开始恢复数据库...${NC}"
echo -e "${GREEN}   使用 Compose 文件: ${COMPOSE_FILE}${NC}"
echo -e "${GREEN}   容器名称: ${CONTAINER_NAME}${NC}"
echo -e "${YELLOW}这可能需要几分钟时间，请耐心等待...${NC}"

if docker compose -f "$COMPOSE_FILE" exec -T "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$RESTORE_FILE"; then
    echo -e "${GREEN}✅ 数据库恢复成功！${NC}"
else
    echo -e "${RED}❌ 错误: 数据库恢复失败${NC}"
    # 清理临时文件
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# 清理临时文件
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

echo ""
echo -e "${GREEN}🎉 恢复完成！${NC}"
echo -e "${YELLOW}提示: 建议重启应用容器以确保数据一致性${NC}"
echo -e "${YELLOW}      docker compose -f ${COMPOSE_FILE} restart interview-app${NC}"


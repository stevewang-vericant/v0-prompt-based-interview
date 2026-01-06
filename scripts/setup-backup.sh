#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  数据库备份设置向导${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否在正确的目录
if [ ! -f "docker-compose.linode.yml" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 创建备份目录
echo -e "${GREEN}📁 创建备份目录...${NC}"
mkdir -p backups
echo -e "${GREEN}✅ 备份目录已创建: $(pwd)/backups${NC}"

# 设置脚本权限
echo -e "${GREEN}🔧 设置脚本执行权限...${NC}"
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
echo -e "${GREEN}✅ 脚本权限已设置${NC}"

# 测试备份脚本
echo ""
echo -e "${GREEN}🧪 测试备份脚本...${NC}"
if ./scripts/backup-database.sh; then
    echo -e "${GREEN}✅ 备份脚本测试成功${NC}"
else
    echo -e "${YELLOW}⚠️  备份脚本测试失败，请检查 Docker 容器是否运行${NC}"
fi

# 询问是否设置 Cron 任务
echo ""
echo -e "${YELLOW}是否设置自动备份（Cron 任务）？${NC}"
read -p "请输入 (y/n): " SETUP_CRON

if [ "$SETUP_CRON" = "y" ] || [ "$SETUP_CRON" = "Y" ]; then
    echo ""
    echo -e "${GREEN}请选择备份频率：${NC}"
    echo "  1) 每天凌晨 2 点（推荐）"
    echo "  2) 每 6 小时"
    echo "  3) 每周日凌晨 3 点"
    echo "  4) 自定义"
    read -p "请选择 (1-4): " FREQ_CHOICE
    
    PROJECT_DIR=$(pwd)
    BACKUP_SCRIPT="${PROJECT_DIR}/scripts/backup-database.sh"
    LOG_FILE="${PROJECT_DIR}/backups/backup.log"
    
    case $FREQ_CHOICE in
        1)
            CRON_TIME="0 2 * * *"
            ;;
        2)
            CRON_TIME="0 */6 * * *"
            ;;
        3)
            CRON_TIME="0 3 * * 0"
            ;;
        4)
            echo -e "${YELLOW}请输入 Cron 时间表达式（格式: 分钟 小时 日 月 星期）${NC}"
            echo -e "${YELLOW}示例: 0 2 * * * (每天凌晨 2 点)${NC}"
            read -p "Cron 表达式: " CRON_TIME
            ;;
        *)
            echo -e "${YELLOW}无效选择，跳过 Cron 设置${NC}"
            CRON_TIME=""
            ;;
    esac
    
    if [ -n "$CRON_TIME" ]; then
        # 检查是否已存在相同的 cron 任务
        if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
            echo -e "${YELLOW}⚠️  检测到已存在的备份任务，将替换${NC}"
            # 删除旧的备份任务
            crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
        fi
        
        # 添加新的 cron 任务
        (crontab -l 2>/dev/null; echo "$CRON_TIME $BACKUP_SCRIPT >> $LOG_FILE 2>&1") | crontab -
        echo -e "${GREEN}✅ Cron 任务已设置${NC}"
        echo -e "${GREEN}   时间: $CRON_TIME${NC}"
        echo ""
        echo -e "${BLUE}当前 Cron 任务列表：${NC}"
        crontab -l | grep -E "(backup|BACKUP)" || echo "  (无备份相关任务)"
    fi
else
    echo -e "${YELLOW}跳过 Cron 设置${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 备份设置完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}下一步：${NC}"
echo -e "  1. 手动测试备份: ${YELLOW}./scripts/backup-database.sh${NC}"
echo -e "  2. 查看备份文件: ${YELLOW}ls -lh backups/${NC}"
echo -e "  3. 查看 Cron 任务: ${YELLOW}crontab -l${NC}"
echo -e "  4. 查看备份日志: ${YELLOW}tail -f backups/backup.log${NC}"
echo ""
echo -e "${GREEN}详细文档: ${YELLOW}DATABASE-BACKUP.md${NC}"
echo ""


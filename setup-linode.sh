#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
APP_USER="v0-interview"
APP_HOME="/home/$APP_USER"
PROJECT_DIR="$APP_HOME/apps/v0-interview"
REPO_URL="https://github.com/stevewang-vericantcoms/v0-prompt-based-interview.git"
NGINX_CONFIG="/etc/nginx/sites-available/v0-interview"
NGINX_ENABLED="/etc/nginx/sites-enabled/v0-interview"

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  v0-interview 项目 Linode 服务器初始化${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 请使用 root 用户运行此脚本${NC}"
    echo -e "${YELLOW}使用: sudo $0${NC}"
    exit 1
fi

# 1. 创建应用用户
echo -e "${GREEN}[1/7] 创建应用用户 $APP_USER...${NC}"
if id "$APP_USER" &>/dev/null; then
    echo -e "${YELLOW}⚠️  用户 $APP_USER 已存在，跳过创建${NC}"
else
    useradd -m -s /bin/bash "$APP_USER"
    echo -e "${GREEN}✅ 用户 $APP_USER 已创建${NC}"
    
    # 将用户添加到 docker 组（如果组存在）
    if getent group docker > /dev/null 2>&1; then
        usermod -aG docker "$APP_USER"
        echo -e "${GREEN}✅ 用户已添加到 docker 组${NC}"
    fi
    
    # 可选：添加 sudo 权限（如果需要）
    # usermod -aG sudo "$APP_USER"
fi
echo ""

# 2. 检查 Docker
echo -e "${GREEN}[2/7] 检查 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker 已安装: $(docker --version)${NC}"
echo ""

# 3. 检查 Docker Compose
echo -e "${GREEN}[3/7] 检查 Docker Compose...${NC}"
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
echo ""

# 4. 创建应用目录
echo -e "${GREEN}[4/7] 创建应用目录...${NC}"
mkdir -p "$APP_HOME/apps"
chown -R "$APP_USER:$APP_USER" "$APP_HOME"
echo -e "${GREEN}✅ 目录已创建: $APP_HOME/apps${NC}"
echo ""

# 5. 克隆项目
echo -e "${GREEN}[5/7] 克隆项目到 $PROJECT_DIR...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}⚠️  目录已存在，跳过克隆${NC}"
    echo -e "${YELLOW}如需重新克隆，请先删除: rm -rf $PROJECT_DIR${NC}"
else
    # 使用应用用户克隆项目
    sudo -u "$APP_USER" git clone "$REPO_URL" "$PROJECT_DIR"
    echo -e "${GREEN}✅ 项目已克隆${NC}"
fi

# 设置目录权限
chown -R "$APP_USER:$APP_USER" "$PROJECT_DIR" 2>/dev/null || true
echo ""

# 6. 创建环境变量文件
echo -e "${GREEN}[6/7] 配置环境变量...${NC}"
cd "$PROJECT_DIR"
if [ ! -f ".env.production" ]; then
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        echo -e "${GREEN}✅ 已创建 .env.production 文件${NC}"
        echo -e "${YELLOW}⚠️  请编辑 $PROJECT_DIR/.env.production 并填入正确的环境变量${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.production.example 不存在，请手动创建 .env.production${NC}"
    fi
else
    echo -e "${GREEN}✅ .env.production 已存在${NC}"
fi
echo ""

# 7. 配置 Nginx
echo -e "${GREEN}[7/7] 配置 Nginx...${NC}"
if command -v nginx &> /dev/null; then
    if [ ! -f "$NGINX_CONFIG" ]; then
        # 复制配置文件
        if [ -f "nginx-v0-interview.conf" ]; then
            cp nginx-v0-interview.conf "$NGINX_CONFIG"
            echo -e "${GREEN}✅ Nginx 配置已创建: $NGINX_CONFIG${NC}"
            echo -e "${YELLOW}⚠️  请编辑配置文件并修改 server_name${NC}"
        else
            echo -e "${YELLOW}⚠️  nginx-v0-interview.conf 不存在，请手动创建 Nginx 配置${NC}"
        fi
    else
        echo -e "${GREEN}✅ Nginx 配置已存在${NC}"
    fi
    
    # 创建符号链接（如果不存在）
    if [ ! -L "$NGINX_ENABLED" ] && [ -f "$NGINX_CONFIG" ]; then
        ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
        echo -e "${GREEN}✅ Nginx 配置已启用${NC}"
    fi
    
    # 测试配置
    if nginx -t 2>/dev/null; then
        echo -e "${GREEN}✅ Nginx 配置有效${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx 配置测试失败，请检查配置${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nginx 未安装，跳过配置${NC}"
fi
echo ""

# 显示下一步操作
echo -e "${GREEN}初始化完成！${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  下一步操作：${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "1. ${YELLOW}切换到应用用户${NC}:"
echo -e "   su - $APP_USER"
echo -e "   或"
echo -e "   sudo -u $APP_USER -i"
echo ""
echo -e "2. ${YELLOW}编辑环境变量${NC}:"
echo -e "   cd $PROJECT_DIR"
echo -e "   vim .env.production"
echo ""
echo -e "3. ${YELLOW}编辑 Nginx 配置（如需要）${NC}:"
echo -e "   sudo vim $NGINX_CONFIG"
echo -e "   修改 server_name 为您的域名或 IP"
echo ""
echo -e "4. ${YELLOW}重新加载 Nginx（如已配置）${NC}:"
echo -e "   sudo systemctl reload nginx"
echo ""
echo -e "5. ${YELLOW}部署应用（使用应用用户）${NC}:"
echo -e "   su - $APP_USER"
echo -e "   cd $PROJECT_DIR"
echo -e "   ./deploy-linode.sh"
echo ""
echo -e "6. ${YELLOW}查看日志${NC}:"
echo -e "   cd $PROJECT_DIR"
echo -e "   docker compose -f docker-compose.linode.yml logs -f"
echo ""
echo -e "${GREEN}✅ 初始化完成！${NC}"


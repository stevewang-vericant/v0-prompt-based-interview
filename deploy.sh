#!/bin/bash

# 自动部署脚本 - 用于自建服务器
# 使用方法: ./deploy.sh [server_user@server_ip]

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Next.js 应用自动部署脚本${NC}"
echo -e "${GREEN}========================================${NC}\n"

# 检查参数
if [ -z "$1" ]; then
    echo -e "${YELLOW}请指定服务器地址，例如：${NC}"
    echo -e "  ./deploy.sh user@your-server-ip\n"
    echo -e "${YELLOW}或者使用本地 Docker 部署：${NC}"
    echo -e "  ./deploy.sh local\n"
    exit 1
fi

# 本地 Docker 部署
if [ "$1" == "local" ]; then
    echo -e "${GREEN}[1/3] 检查 Docker...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: Docker 未安装${NC}"
        echo "请访问 https://docs.docker.com/get-docker/ 安装 Docker"
        exit 1
    fi
    
    echo -e "${GREEN}[2/3] 构建 Docker 镜像...${NC}"
    docker-compose build
    
    echo -e "${GREEN}[3/3] 启动容器...${NC}"
    docker-compose up -d
    
    echo -e "\n${GREEN}✓ 部署成功！${NC}"
    echo -e "应用运行在: ${YELLOW}http://localhost:3000${NC}\n"
    echo -e "查看日志: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "停止应用: ${YELLOW}docker-compose down${NC}\n"
    exit 0
fi

# 远程服务器部署
SERVER=$1
REMOTE_DIR="/opt/nextjs-app"

echo -e "${GREEN}[1/6] 检查服务器连接...${NC}"
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'Connected'" &> /dev/null; then
    echo -e "${RED}错误: 无法连接到服务器 $SERVER${NC}"
    echo "请检查 SSH 配置和服务器地址"
    exit 1
fi

echo -e "${GREEN}[2/6] 创建远程目录...${NC}"
ssh $SERVER "mkdir -p $REMOTE_DIR"

echo -e "${GREEN}[3/6] 上传代码到服务器...${NC}"
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'out' \
    ./ $SERVER:$REMOTE_DIR/

echo -e "${GREEN}[4/6] 检查服务器环境...${NC}"
ssh $SERVER "cd $REMOTE_DIR && bash" << 'EOF'
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo "安装 Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "安装 Docker Compose..."
        sudo apt install -y docker-compose
    fi
EOF

echo -e "${GREEN}[5/6] 构建并启动应用...${NC}"
ssh $SERVER "cd $REMOTE_DIR && docker-compose down && docker-compose up -d --build"

echo -e "${GREEN}[6/6] 检查应用状态...${NC}"
sleep 3
ssh $SERVER "cd $REMOTE_DIR && docker-compose ps"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ 部署成功！${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "应用已部署到: ${YELLOW}$SERVER${NC}"
echo -e "访问地址: ${YELLOW}http://$SERVER:3000${NC}\n"

echo -e "${YELLOW}常用命令：${NC}"
echo -e "  查看日志: ${YELLOW}ssh $SERVER 'cd $REMOTE_DIR && docker-compose logs -f'${NC}"
echo -e "  重启应用: ${YELLOW}ssh $SERVER 'cd $REMOTE_DIR && docker-compose restart'${NC}"
echo -e "  停止应用: ${YELLOW}ssh $SERVER 'cd $REMOTE_DIR && docker-compose down'${NC}\n"

echo -e "${YELLOW}下一步：${NC}"
echo -e "  1. 配置域名解析指向服务器 IP"
echo -e "  2. 安装 Nginx 反向代理"
echo -e "  3. 配置 SSL 证书（使用 Let's Encrypt）"
echo -e "\n详细说明请查看: ${YELLOW}DEPLOYMENT.md${NC}\n"



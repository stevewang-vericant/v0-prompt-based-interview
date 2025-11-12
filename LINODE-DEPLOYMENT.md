# Linode 服务器部署指南

本指南专门针对在**已有 Docker 和另一个应用运行**的 Linode 服务器上部署此项目。

**服务器信息**：
- 服务器：linode-Athena
- 系统：Ubuntu 24.04.3 LTS
- Docker：28.5.2
- Docker Compose：v2.40.3
- 现有应用：ai-tm (端口 5001, 用户 ai-tm)
- 应用用户：v0-interview (新创建，与 ai-tm 用户类似)
- 项目路径：/home/v0-interview/apps/v0-interview
- Nginx：1.24.0 (已安装)

## 前置检查

在开始之前，请确认：

1. ✅ 服务器已安装 Docker 和 Docker Compose
2. ✅ 服务器上已有其他应用在运行
3. ✅ 有 SSH 访问权限
4. ✅ 了解现有应用使用的端口（避免冲突）

---

## 快速部署步骤

### 方式 A：使用自动化脚本（推荐）

```bash
# 1. 在服务器上运行初始化脚本（root 用户）
ssh linode-Athena
sudo ./setup-linode.sh

# 2. 切换到应用用户
su - v0-interview

# 3. 编辑环境变量
cd ~/apps/v0-interview
vim .env.production

# 4. 部署应用
./deploy-linode.sh
```

### 方式 B：手动部署

### 1. 检查现有应用端口

```bash
ssh user@your-linode-ip

# 查看当前运行的容器和端口
docker ps
# 或
docker-compose ps

# 查看端口占用情况
sudo netstat -tlnp | grep LISTEN
```

**注意**：本项目默认使用 **3001** 端口（映射到容器内的 3000），如果 3001 也被占用，可以修改 `docker-compose.linode.yml` 中的端口映射。

### 2. 创建项目目录

```bash
# 创建应用用户（root 用户执行）
sudo useradd -m -s /bin/bash v0-interview
sudo usermod -aG docker v0-interview

# 切换到应用用户
su - v0-interview

# 创建应用目录并克隆项目
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/stevewang-vericantcoms/v0-prompt-based-interview.git v0-interview
cd v0-interview
```

**注意**：项目将部署到 `/home/v0-interview/apps/v0-interview`，与现有应用 `ai-tm`（位于 `/home/ai-tm/apps/ai-tm`）保持相同的目录结构。

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑环境变量
vim .env.production
```

**必需的环境变量**（参考 `ENV-SETUP.md`）：

```env
# ===== Backblaze B2 (必需 - 视频存储) =====
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_REGION=us-west-001
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-application-key

# ===== Supabase (必需) =====
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===== OpenAI (可选，用于转录) =====
OPENAI_API_KEY=sk-your-openai-api-key

# ===== 应用配置 =====
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. 构建并启动应用

```bash
# 使用专门的 Linode 配置文件
docker-compose -f docker-compose.linode.yml up -d --build
```

### 5. 验证部署

```bash
# 查看容器状态
docker compose -f docker-compose.linode.yml ps

# 查看日志
docker compose -f docker-compose.linode.yml logs -f

# 测试应用是否响应
curl http://localhost:3001

# 检查所有运行的容器
docker ps
```

**预期结果**：
- `ai-tm` 容器运行在端口 5001
- `v0-interview-app` 容器运行在端口 3001

---

## 配置 Nginx 反向代理（推荐）

如果您的服务器已经配置了 Nginx，添加新的站点配置：

### 1. 创建 Nginx 配置

```bash
# 使用项目提供的配置文件
sudo cp /opt/v0-interview/nginx-v0-interview.conf /etc/nginx/sites-available/v0-interview

# 或手动创建
sudo vim /etc/nginx/sites-available/v0-interview
```

添加以下配置（或使用项目提供的 `nginx-v0-interview.conf`）：

```nginx
server {
    listen 80;
    server_name interview.your-domain.com;  # 替换为您的子域名或域名

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 增加超时时间（用于视频上传）
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

### 2. 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/v0-interview /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx

# 检查状态
sudo systemctl status nginx
```

### 3. 配置 SSL（HTTPS）

```bash
# 安装 Certbot（如果还没有）
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书（替换为您的域名）
sudo certbot --nginx -d interview.your-domain.com

# Certbot 会自动更新 Nginx 配置
```

---

## 端口冲突处理

如果 3001 端口也被占用，可以修改端口：

### 方法 1: 修改 docker-compose.linode.yml

```yaml
ports:
  - "3002:3000"  # 改为 3002 或其他可用端口
```

然后更新 Nginx 配置中的 `proxy_pass` 地址。

### 方法 2: 使用环境变量

在 `.env.production` 中添加：

```env
APP_PORT=3002
```

然后修改 `docker-compose.linode.yml`：

```yaml
ports:
  - "${APP_PORT:-3001}:3000"
```

---

## 日常维护

### 更新应用

```bash
cd /opt/v0-interview

# 方式 1: 使用部署脚本（推荐）
./deploy-linode.sh

# 方式 2: 手动更新
git pull origin main
docker compose -f docker-compose.linode.yml down
docker compose -f docker-compose.linode.yml up -d --build
```

### 查看日志

```bash
cd /opt/v0-interview

# 实时日志
docker compose -f docker-compose.linode.yml logs -f

# 最近 100 行日志
docker compose -f docker-compose.linode.yml logs --tail=100

# 查看特定服务的日志
docker compose -f docker-compose.linode.yml logs interview-app
```

### 重启应用

```bash
cd /opt/v0-interview
docker compose -f docker-compose.linode.yml restart
```

### 停止应用

```bash
cd /opt/v0-interview
docker compose -f docker-compose.linode.yml down
```

### 完全删除（包括数据）

```bash
cd /opt/v0-interview
docker compose -f docker-compose.linode.yml down -v
```

---

## 与现有应用共存

### 网络隔离

本项目使用独立的 Docker 网络 `app-network`，不会与您现有的应用网络冲突。

### 资源限制（可选）

如果担心资源占用，可以在 `docker-compose.linode.yml` 中添加资源限制：

```yaml
services:
  interview-app:
    # ... 其他配置 ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

### 监控资源使用

```bash
# 查看所有容器的资源使用
docker stats

# 查看特定容器
docker stats v0-interview-app
```

---

## 自动化部署脚本

项目已包含部署脚本 `deploy-linode.sh`，位于项目根目录。

使用：

```bash
cd /opt/v0-interview
chmod +x deploy-linode.sh
./deploy-linode.sh
```

脚本会自动：
- 检查项目目录和环境变量
- 拉取最新代码
- 停止旧容器
- 构建并启动新容器
- 检查部署状态
- 验证应用健康状态

---

## 故障排查

### 问题 1: 容器无法启动

```bash
# 查看详细日志
docker-compose -f docker-compose.linode.yml logs

# 检查环境变量
docker-compose -f docker-compose.linode.yml config
```

### 问题 2: 端口冲突

```bash
# 查看端口占用
sudo lsof -i :3001
# 或
sudo netstat -tlnp | grep 3001

# 修改端口（见上面的"端口冲突处理"部分）
```

### 问题 3: 应用无法访问

```bash
# 检查容器是否运行
docker ps | grep v0-interview-app

# 检查应用日志
docker-compose -f docker-compose.linode.yml logs interview-app

# 测试本地访问
curl http://localhost:3001

# 检查 Nginx 配置
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### 问题 4: 环境变量未生效

```bash
# 检查环境变量文件
cat .env.production

# 验证容器内的环境变量
docker exec v0-interview-app env | grep B2
```

---

## 安全建议

1. **防火墙配置**
   ```bash
   # 只开放必要端口
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **定期更新**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 更新 Docker 镜像
   docker-compose -f docker-compose.linode.yml pull
   ```

3. **备份环境变量**
   ```bash
   # 备份 .env.production（但不要提交到 Git）
   cp .env.production .env.production.backup
   ```

---

## 与现有 Nginx 配置共存

如果您的服务器已经有 Nginx 配置，可以：

1. **使用子域名**（推荐）
   - 现有应用：`your-domain.com`
   - 新应用：`interview.your-domain.com`

2. **使用路径前缀**
   ```nginx
   location /interview/ {
       proxy_pass http://localhost:3001/;
       # ... 其他配置 ...
   }
   ```

3. **使用不同端口**
   - 现有应用：80/443
   - 新应用：8080/8443

---

## 总结

✅ **已完成**：
- [x] 创建独立的 Docker Compose 配置
- [x] 使用 3001 端口避免冲突
- [x] 配置环境变量模板
- [x] 提供 Nginx 反向代理配置
- [x] 创建部署和维护脚本

📝 **下一步**：
1. 在服务器上克隆项目
2. 配置环境变量
3. 构建并启动容器
4. 配置 Nginx 反向代理
5. 配置 SSL 证书

---

## 需要帮助？

如有问题，请检查：
- 容器日志：`docker-compose -f docker-compose.linode.yml logs`
- Nginx 日志：`sudo tail -f /var/log/nginx/error.log`
- 系统资源：`htop` 或 `docker stats`

祝部署顺利！🚀


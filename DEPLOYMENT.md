# 自建服务器部署指南

本指南介绍如何将此 Next.js 应用部署到您自己的服务器（阿里云、Linode、DigitalOcean 等）。

## 前置要求

- 一台运行 Linux 的服务器（推荐 Ubuntu 22.04 或更高版本）
- SSH 访问权限
- 域名（可选，但推荐）

---

## 方案一：使用 Docker 部署（推荐）

### 1. 服务器准备

连接到您的服务器：
```bash
ssh user@your-server-ip
```

安装 Docker 和 Docker Compose：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt install docker-compose -y

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
```

### 2. 部署应用

克隆或上传代码到服务器：
```bash
# 方式 1：使用 Git
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 方式 2：使用 rsync 从本地上传
# 在本地运行：
rsync -avz --exclude 'node_modules' --exclude '.next' ./ user@your-server-ip:/path/to/app/
```

修改 Next.js 配置以支持独立输出：
```bash
# 需要在 next.config.mjs 中添加 output: 'standalone'
```

构建并启动容器：
```bash
docker-compose up -d --build
```

查看日志：
```bash
docker-compose logs -f
```

### 3. 配置 Nginx 反向代理（推荐）

安装 Nginx：
```bash
sudo apt install nginx -y
```

创建 Nginx 配置：
```bash
sudo vim /etc/nginx/sites-available/your-app
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置 SSL（HTTPS）

使用 Let's Encrypt 免费证书：
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 方案二：直接使用 PM2 部署

### 1. 服务器准备

安装 Node.js 和 pnpm：
```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2
```

### 2. 部署应用

上传代码到服务器后：
```bash
cd /path/to/your/app

# 安装依赖
pnpm install --frozen-lockfile

# 构建应用
pnpm build

# 使用 PM2 启动
pm2 start npm --name "next-app" -- start

# 设置开机自启
pm2 startup
pm2 save
```

### 3. PM2 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs next-app

# 重启应用
pm2 restart next-app

# 停止应用
pm2 stop next-app

# 查看详细信息
pm2 show next-app
```

---

## 环境变量配置

如果您的应用需要环境变量，创建 `.env.production` 文件：

```bash
# .env.production
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NEXT_PUBLIC_API_URL=https://your-domain.com/api
# 其他环境变量...
```

**Docker 方式**：在 `docker-compose.yml` 中添加：
```yaml
environment:
  - DATABASE_URL=postgresql://...
  - NEXT_PUBLIC_API_URL=https://...
```

**PM2 方式**：创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'next-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://...',
      // 其他环境变量
    }
  }]
}
```

然后使用：`pm2 start ecosystem.config.js`

---

## 数据库配置（如需要）

如果您的应用使用 PostgreSQL（从 scripts 目录看来可能需要）：

### 安装 PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y

# 创建数据库和用户
sudo -u postgres psql

# 在 psql 中执行：
CREATE DATABASE your_database;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_user;
\q
```

### 初始化数据库
```bash
psql -U your_user -d your_database -f scripts/001_create_schema.sql
psql -U your_user -d your_database -f scripts/002_seed_prompts.sql
```

---

## 更新应用

### Docker 方式
```bash
cd /path/to/your/app
git pull  # 或重新上传代码
docker-compose down
docker-compose up -d --build
```

### PM2 方式
```bash
cd /path/to/your/app
git pull  # 或重新上传代码
pnpm install
pnpm build
pm2 restart next-app
```

---

## 监控和维护

### 查看 Docker 容器状态
```bash
docker-compose ps
docker-compose logs -f --tail=100
```

### 监控系统资源
```bash
# 安装 htop
sudo apt install htop -y
htop

# Docker 资源使用
docker stats
```

### 自动备份（如使用数据库）
创建备份脚本 `/home/user/backup.sh`：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U your_user your_database > /backups/db_$DATE.sql
# 保留最近 7 天的备份
find /backups -name "db_*.sql" -mtime +7 -delete
```

设置定时任务：
```bash
crontab -e
# 添加：每天凌晨 2 点备份
0 2 * * * /home/user/backup.sh
```

---

## 故障排查

### 应用无法访问
```bash
# 检查应用是否运行
docker-compose ps  # Docker 方式
pm2 status        # PM2 方式

# 检查端口是否监听
sudo netstat -tlnp | grep 3000

# 检查防火墙
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

### 查看日志
```bash
# Docker
docker-compose logs -f app

# PM2
pm2 logs next-app

# Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 性能优化建议

1. **启用 Gzip 压缩**：在 Nginx 配置中启用
2. **配置 CDN**：使用阿里云 CDN 或 Cloudflare
3. **增加服务器资源**：根据流量调整 CPU 和内存
4. **使用 Redis 缓存**：缓存频繁访问的数据
5. **配置日志轮转**：防止日志文件过大

---

## 安全建议

1. **配置防火墙**：只开放必要端口（80, 443, SSH）
2. **定期更新系统**：`sudo apt update && sudo apt upgrade`
3. **使用强密码和 SSH 密钥**
4. **配置 fail2ban**：防止暴力破解
5. **定期备份**：数据库和重要文件

---

## 常见问题

**Q: 部署后访问很慢？**
A: 检查服务器带宽，考虑使用 CDN，优化图片和静态资源。

**Q: 如何配置多个域名？**
A: 在 Nginx 配置中添加多个 `server_name`。

**Q: 如何扩展到多台服务器？**
A: 使用负载均衡器（Nginx/HAProxy）配合多个应用实例。

**Q: 数据库连接失败？**
A: 检查数据库连接字符串，确保网络可达，检查防火墙规则。

---

## 需要帮助？

如有问题，请检查：
- 应用日志
- 系统日志
- Nginx 日志
- Docker/PM2 状态

祝您部署顺利！🚀



# 部署到 Linode-Athena 服务器指南

## 📋 前置条件

1. ✅ Linode 服务器已安装 Docker 和 Docker Compose
2. ✅ 服务器可以通过 SSH 访问
3. ✅ 代码已推送到 GitHub 的 `main` 分支
4. ✅ 本地 PostgreSQL 迁移已完成并测试通过

---

## 🚀 部署步骤

### 步骤 1: SSH 连接到 Linode 服务器

```bash
ssh root@your-linode-ip
# 或使用你的用户名
ssh your-username@your-linode-ip
```

### 步骤 2: 首次部署 - 运行初始化脚本

```bash
# 如果是首次部署，先运行初始化脚本
sudo bash setup-linode.sh
```

这个脚本会：
- ✅ 创建应用用户 `v0-interview`
- ✅ 创建应用目录 `/home/v0-interview/apps/v0-interview`
- ✅ 克隆项目代码
- ✅ 创建 `.env.production` 模板
- ✅ 配置 Nginx（如果需要）

### 步骤 3: 配置环境变量

```bash
# 切换到应用用户
sudo su - v0-interview

# 进入项目目录
cd /home/v0-interview/apps/v0-interview

# 编辑生产环境配置
vim .env.production
```

**必须配置的环境变量：**

```env
# 应用 URL（你的域名或 IP）
NEXT_PUBLIC_APP_URL=https://interview.yourdomain.com

# 数据库配置（保持 postgres 作为主机名）
DATABASE_URL=postgresql://postgres:YOUR_SECURE_PASSWORD@postgres:5432/v0_interview

# 认证密钥（生成一个强随机字符串）
AUTH_SECRET=$(openssl rand -base64 32)

# Backblaze B2
B2_APPLICATION_KEY_ID=your_actual_key_id
B2_APPLICATION_KEY=your_actual_key
B2_BUCKET_NAME=your_bucket_name
B2_BUCKET_REGION=us-west-004

# OpenAI
OPENAI_API_KEY=sk-your-actual-openai-key

# PostgreSQL 配置（与 DATABASE_URL 保持一致）
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=v0_interview
```

**生成安全的 AUTH_SECRET：**
```bash
openssl rand -base64 32
```

### 步骤 4: 拉取最新代码（如果不是首次部署）

```bash
cd /home/v0-interview/apps/v0-interview
git pull origin main
```

### 步骤 5: 运行部署脚本

```bash
# 确保脚本有执行权限
chmod +x deploy-linode.sh

# 运行部署
./deploy-linode.sh
```

部署脚本会自动：
1. 拉取最新代码
2. 停止旧容器
3. 构建新的 Docker 镜像
4. 启动 PostgreSQL 和应用容器
5. 运行数据库迁移（Prisma）
6. 检查服务健康状态

### 步骤 6: 验证部署

```bash
# 查看容器状态
docker compose -f docker-compose.linode.yml ps

# 查看应用日志
docker compose -f docker-compose.linode.yml logs -f interview-app

# 查看数据库日志
docker compose -f docker-compose.linode.yml logs -f postgres

# 测试应用
curl http://localhost:3001
```

### 步骤 7: 配置 Nginx 反向代理（可选）

如果需要通过域名访问：

```bash
# 编辑 Nginx 配置
sudo vim /etc/nginx/sites-available/v0-interview
```

示例配置：

```nginx
server {
    listen 80;
    server_name interview.yourdomain.com;

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
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/v0-interview /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 步骤 8: 配置 SSL（推荐使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d interview.yourdomain.com

# Certbot 会自动配置 HTTPS 并设置自动续期
```

---

## 🔧 常用管理命令

### 查看日志

```bash
# 查看所有日志
docker compose -f docker-compose.linode.yml logs -f

# 只查看应用日志
docker compose -f docker-compose.linode.yml logs -f interview-app

# 只查看数据库日志
docker compose -f docker-compose.linode.yml logs -f postgres
```

### 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.linode.yml restart

# 只重启应用
docker compose -f docker-compose.linode.yml restart interview-app
```

### 停止服务

```bash
docker compose -f docker-compose.linode.yml down
```

### 进入容器

```bash
# 进入应用容器
docker compose -f docker-compose.linode.yml exec interview-app sh

# 进入数据库容器
docker compose -f docker-compose.linode.yml exec postgres psql -U postgres -d v0_interview
```

### 数据库管理

```bash
# 运行 Prisma 迁移
docker compose -f docker-compose.linode.yml exec interview-app npx prisma db push

# 生成 Prisma Client
docker compose -f docker-compose.linode.yml exec interview-app npx prisma generate

# 查看数据库
docker compose -f docker-compose.linode.yml exec interview-app npx prisma studio
```

### 数据库备份

```bash
# 创建备份
docker compose -f docker-compose.linode.yml exec postgres pg_dump -U postgres v0_interview > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
docker compose -f docker-compose.linode.yml exec -T postgres psql -U postgres v0_interview < backup_20250102_120000.sql
```

---

## 🐛 故障排查

### 问题 1: 容器无法启动

```bash
# 查看详细错误
docker compose -f docker-compose.linode.yml logs

# 检查端口占用
sudo netstat -tlnp | grep 3001
sudo netstat -tlnp | grep 5433
```

### 问题 2: 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker compose -f docker-compose.linode.yml ps postgres

# 测试数据库连接
docker compose -f docker-compose.linode.yml exec postgres pg_isready -U postgres

# 查看数据库日志
docker compose -f docker-compose.linode.yml logs postgres
```

### 问题 3: Prisma 迁移失败

```bash
# 手动运行迁移
docker compose -f docker-compose.linode.yml exec interview-app npx prisma db push

# 如果需要重置数据库（谨慎！）
docker compose -f docker-compose.linode.yml exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS v0_interview;"
docker compose -f docker-compose.linode.yml exec postgres psql -U postgres -c "CREATE DATABASE v0_interview;"
docker compose -f docker-compose.linode.yml exec interview-app npx prisma db push
```

### 问题 4: 环境变量未加载

```bash
# 检查 .env.production 文件
cat .env.production

# 检查容器内的环境变量
docker compose -f docker-compose.linode.yml exec interview-app env | grep DATABASE_URL
```

---

## 📊 监控和维护

### 健康检查

应用和数据库都配置了健康检查：

```bash
# 查看容器健康状态
docker compose -f docker-compose.linode.yml ps

# 手动健康检查
curl http://localhost:3001/api/health
```

### 日志轮转

Docker 默认会进行日志轮转，但你也可以手动清理：

```bash
# 清理旧日志
docker system prune -a --volumes
```

### 磁盘空间监控

```bash
# 查看 Docker 磁盘使用
docker system df

# 查看数据卷大小
docker volume ls -q | xargs docker volume inspect --format '{{ .Name }}: {{ .Mountpoint }}' | xargs -I {} sh -c "echo {} && du -sh {}"
```

---

## 🔄 更新流程

当代码有更新时：

```bash
# 1. SSH 到服务器
ssh v0-interview@your-linode-ip

# 2. 进入项目目录
cd /home/v0-interview/apps/v0-interview

# 3. 运行部署脚本（会自动拉取最新代码）
./deploy-linode.sh
```

---

## 📞 紧急联系

如果遇到严重问题需要回滚：

```bash
# 查看 Git 历史
git log --oneline

# 回滚到上一个版本
git checkout <commit-hash>

# 重新部署
./deploy-linode.sh
```

---

## ✅ 部署检查清单

部署前：
- [ ] 代码已推送到 GitHub `main` 分支
- [ ] 本地测试通过
- [ ] 环境变量已准备好
- [ ] 数据库密码已设置（强密码）
- [ ] AUTH_SECRET 已生成
- [ ] B2 和 OpenAI 凭证已准备

部署后：
- [ ] 容器运行正常
- [ ] 数据库连接成功
- [ ] Prisma 迁移成功
- [ ] 应用可以通过浏览器访问
- [ ] 可以注册和登录学校管理员
- [ ] 可以录制和提交面试
- [ ] Nginx 配置正确（如果使用）
- [ ] SSL 证书已配置（如果使用）
- [ ] 日志正常，无错误

---

## 🎉 完成！

部署完成后，你的应用应该可以通过以下地址访问：

- **本地测试**: http://localhost:3001
- **Nginx 反向代理**: http://your-domain.com
- **HTTPS（配置 SSL 后）**: https://your-domain.com

祝你部署顺利！🚀


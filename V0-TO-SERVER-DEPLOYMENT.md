# 从 V0 部署到自建服务器指南

本指南专门针对 **在 V0.dev 上开发，然后部署到自己服务器（非 Vercel）** 的场景。

## 工作流程

```
┌─────────┐         ┌────────┐         ┌──────────────┐
│ V0.dev  │ ──自动──▶│ GitHub │ ──自动──▶│ 您的服务器    │
│ 开发    │  推送    │ 仓库   │  部署    │ (阿里云/Linode)│
└─────────┘         └────────┘         └──────────────┘
```

V0 每次修改都会自动推送到您的 GitHub 仓库，然后可以自动或手动部署到您的服务器。

---

## 方案对比

### 方案 A：手动拉取部署
- ✅ 简单直接，完全可控
- ❌ 需要手动操作
- 💡 **适合**：小型项目、更新不频繁

### 方案 B：GitHub Actions 自动部署
- ✅ 完全自动化，V0 更新后自动部署
- ✅ 无需手动操作
- 💡 **适合**：频繁更新、生产环境

---

## 方案 A：手动部署

### 首次设置

**1. 在服务器上安装 Docker**
```bash
ssh user@your-server-ip

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install docker-compose -y

# 重新登录以使组权限生效
exit
ssh user@your-server-ip
```

**2. 克隆您的 GitHub 仓库**
```bash
cd /opt
git clone https://github.com/stevewang-vericantcoms/v0-prompt-based-interview.git
cd v0-prompt-based-interview
```

**3. 部署应用**
```bash
docker-compose up -d --build
```

**4. 配置 Nginx（可选但推荐）**

安装 Nginx：
```bash
sudo apt install nginx -y
```

创建配置文件：
```bash
sudo vim /etc/nginx/sites-available/myapp
```

添加内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名或 IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**5. 配置 SSL（推荐）**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 每次更新流程

当您在 V0 上做了修改后：

```bash
ssh user@your-server-ip
cd /opt/v0-prompt-based-interview
git pull origin main
docker-compose up -d --build
```

**提示**：可以创建一个简化脚本 `update.sh`：
```bash
#!/bin/bash
cd /opt/v0-prompt-based-interview
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose ps
```

---

## 方案 B：GitHub Actions 自动部署（推荐）

### 优势
- ✨ V0 更新 → 自动推送到 GitHub → 自动部署到服务器
- ✨ 零手动操作
- ✨ 可以设置部署通知

### 设置步骤

**1. 在服务器上设置应用目录**
```bash
ssh user@your-server-ip
cd /opt
git clone https://github.com/stevewang-vericantcoms/v0-prompt-based-interview.git
cd v0-prompt-based-interview
docker-compose up -d --build
```

**2. 生成 SSH 密钥对（在服务器上）**
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# 将公钥添加到授权列表
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# 显示私钥（需要复制到 GitHub）
cat ~/.ssh/github_actions
```

**复制私钥内容**（包括 `-----BEGIN` 和 `-----END` 行）

**3. 在 GitHub 仓库中配置 Secrets**

访问：`https://github.com/stevewang-vericantcoms/v0-prompt-based-interview/settings/secrets/actions`

添加以下 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `SERVER_HOST` | `123.45.67.89` | 服务器 IP 地址 |
| `SERVER_USER` | `ubuntu` 或 `root` | SSH 用户名 |
| `SERVER_SSH_KEY` | （步骤 2 的私钥内容） | SSH 私钥 |
| `SERVER_PORT` | `22` | SSH 端口（可选） |

**4. 将 GitHub Actions 配置推送到仓库**

本项目已经包含 `.github/workflows/deploy-to-server.yml` 文件。

如果您的仓库还没有这个文件，需要将其推送上去：

```bash
# 在您的本地项目目录
git add .github/workflows/deploy-to-server.yml
git add Dockerfile docker-compose.yml .dockerignore
git add next.config.mjs  # 已添加 output: 'standalone'
git commit -m "Add auto-deployment to custom server"
git push origin main
```

**注意**：由于 V0 会自动同步代码，您可以：
- 选项 1：直接在 GitHub 网页上创建这些文件
- 选项 2：在服务器上的仓库中创建，然后推送

**5. 测试自动部署**

在 V0 上做任何修改并保存，然后：

1. 访问 `https://github.com/stevewang-vericantcoms/v0-prompt-based-interview/actions`
2. 应该看到一个新的工作流在运行
3. 等待完成（通常 2-5 分钟）
4. 访问您的服务器查看更新

---

## 在 GitHub 网页上创建 Workflow 文件

如果不想使用 git 命令，可以直接在 GitHub 网页上创建：

1. 访问您的仓库：`https://github.com/stevewang-vericantcoms/v0-prompt-based-interview`

2. 点击 **Add file** → **Create new file**

3. 文件名输入：`.github/workflows/deploy-to-server.yml`

4. 粘贴内容：
```yaml
name: 部署到自建服务器

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: 部署应用
    runs-on: ubuntu-latest
    
    steps:
      - name: 检出代码
        uses: actions/checkout@v4
      
      - name: 部署到服务器
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT || 22 }}
          script: |
            cd /opt/v0-prompt-based-interview
            git pull origin main
            docker-compose down
            docker-compose up -d --build
            echo "部署完成！"
      
      - name: 检查部署状态
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT || 22 }}
          script: |
            cd /opt/v0-prompt-based-interview
            docker-compose ps
```

5. 同样方式创建 `Dockerfile`、`docker-compose.yml`、`.dockerignore`

6. 修改 `next.config.mjs`，添加 `output: 'standalone'`

---

## 同时部署到 Vercel 和自己的服务器

如果您想保留 Vercel 部署（预览环境），同时也部署到自己的服务器（生产环境）：

**修改 GitHub Actions 配置**：
```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # 允许手动触发
```

这样：
- ✅ V0 更新 → Vercel 自动部署（预览）
- ✅ V0 更新 → 您的服务器自动部署（生产）
- ✅ 两个环境独立运行

---

## 环境变量配置

如果应用需要环境变量（如数据库连接），在服务器上创建 `.env.production`：

```bash
ssh user@your-server-ip
cd /opt/v0-prompt-based-interview
vim .env.production
```

添加内容：
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NEXT_PUBLIC_API_URL=https://your-domain.com
# 其他环境变量
```

修改 `docker-compose.yml`：
```yaml
services:
  app:
    env_file:
      - .env.production
```

---

## 监控和维护

### 查看部署日志
```bash
# 在 GitHub Actions 页面查看
https://github.com/your-username/your-repo/actions

# 在服务器查看应用日志
ssh user@your-server-ip
cd /opt/v0-prompt-based-interview
docker-compose logs -f
```

### 常用命令
```bash
# 查看容器状态
docker-compose ps

# 重启应用
docker-compose restart

# 停止应用
docker-compose down

# 查看资源使用
docker stats
```

---

## 故障排查

### 问题：GitHub Actions 失败
**检查**：
1. GitHub Secrets 是否配置正确
2. SSH 密钥是否正确添加到服务器
3. 服务器目录是否存在：`/opt/v0-prompt-based-interview`

### 问题：服务器上 git pull 失败
**解决**：
```bash
cd /opt/v0-prompt-based-interview
git fetch origin
git reset --hard origin/main
```

### 问题：Docker 构建失败
**检查**：
```bash
# 查看详细日志
docker-compose logs

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

---

## 成本对比

### Vercel（V0 默认）
- ✅ 免费层：每月 100GB 带宽
- ❌ 超出后较贵
- ❌ 数据在国外，国内访问慢

### 自建服务器（阿里云/Linode）
- ✅ 可控成本：$5-20/月
- ✅ 国内服务器访问快
- ✅ 完全控制权
- ❌ 需要自己维护

---

## 推荐配置

### 小型项目
- **阿里云轻量应用服务器**：99元/年（2核2G）
- **Linode**：$5/月（1GB）

### 中型项目
- **阿里云 ECS**：298元/年（2核4G）
- **Linode**：$10/月（2GB）

---

## 总结

从 V0 部署到自建服务器有两种方式：

1. **手动方式**：V0 更新 → 手动 SSH 到服务器 → git pull → 重新部署
   - 简单可控，适合小项目

2. **自动方式**：V0 更新 → GitHub 自动触发 Actions → 自动部署到服务器
   - 完全自动化，适合频繁更新的项目

**推荐**：使用 GitHub Actions 自动部署，一次设置，终身受益！

---

## 需要帮助？

如有问题，请检查：
1. GitHub Actions 运行日志
2. 服务器应用日志：`docker-compose logs -f`
3. Nginx 日志：`sudo tail -f /var/log/nginx/error.log`

祝您部署顺利！🚀



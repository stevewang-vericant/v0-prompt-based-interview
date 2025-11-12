# Linode 服务器快速部署指南

## 服务器信息
- **服务器**: linode-Athena
- **SSH**: `ssh linode-Athena` (root 用户)
- **应用用户**: `v0-interview` (与 ai-tm 用户类似)
- **项目路径**: `/home/v0-interview/apps/v0-interview`
- **现有应用**: ai-tm (端口 5001, 用户 ai-tm)
- **本项目端口**: 3001

---

## 一键部署（3 步）

### 1. 上传文件到服务器

```bash
# 在本地项目目录
scp setup-linode.sh deploy-linode.sh nginx-v0-interview.conf linode-Athena:/root/
```

### 2. 在服务器上运行初始化（root 用户）

```bash
ssh linode-Athena
cd /root
chmod +x setup-linode.sh
sudo ./setup-linode.sh
```

脚本会自动：
- 创建 `v0-interview` 用户
- 将用户添加到 docker 组
- 创建应用目录 `/home/v0-interview/apps`
- 克隆项目到 `/home/v0-interview/apps/v0-interview`
- 配置 Nginx

### 3. 切换到应用用户并配置环境变量

```bash
# 切换到应用用户
su - v0-interview

# 编辑环境变量
cd ~/apps/v0-interview
vim .env.production

# 填入所有必需的环境变量（参考 ENV-SETUP.md）
```

### 4. 部署应用

```bash
# 确保在应用用户下
cd ~/apps/v0-interview
chmod +x deploy-linode.sh
./deploy-linode.sh
```

---

## 必需的环境变量

编辑 `/opt/v0-interview/.env.production`，填入以下内容：

```env
# Backblaze B2 - 视频存储
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_REGION=us-west-001
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-application-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (可选)
OPENAI_API_KEY=sk-your-openai-api-key

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 配置 Nginx（可选但推荐）

```bash
# 编辑配置文件
sudo vim /etc/nginx/sites-available/v0-interview

# 修改 server_name 为您的域名或 IP
# server_name interview.your-domain.com;

# 启用配置
sudo ln -s /etc/nginx/sites-available/v0-interview /etc/nginx/sites-enabled/

# 测试并重新加载
sudo nginx -t
sudo systemctl reload nginx
```

---

## 验证部署

```bash
# 切换到应用用户
su - v0-interview

# 查看容器状态
docker ps

# 应该看到：
# - ai-tm (端口 5001, 用户 ai-tm)
# - v0-interview-app (端口 3001, 用户 v0-interview)

# 测试应用
curl http://localhost:3001

# 查看日志
cd ~/apps/v0-interview
docker compose -f docker-compose.linode.yml logs -f
```

---

## 常用命令

```bash
# 切换到应用用户
su - v0-interview

# 更新应用
cd ~/apps/v0-interview
./deploy-linode.sh

# 查看日志
docker compose -f docker-compose.linode.yml logs -f

# 重启应用
docker compose -f docker-compose.linode.yml restart

# 停止应用
docker compose -f docker-compose.linode.yml down
```

---

## 故障排查

### 容器无法启动
```bash
cd /opt/v0-interview
docker compose -f docker-compose.linode.yml logs
```

### 端口冲突
```bash
# 检查端口占用
ss -tlnp | grep 3001

# 如果被占用，修改 docker-compose.linode.yml 中的端口
```

### 环境变量问题
```bash
# 切换到应用用户
su - v0-interview

# 检查环境变量文件
cat ~/apps/v0-interview/.env.production

# 验证容器内的环境变量
docker exec v0-interview-app env | grep B2
```

---

## 下一步

1. ✅ 部署完成
2. ⬜ 配置域名和 SSL（如需要）
3. ⬜ 设置自动备份（如需要）
4. ⬜ 配置监控（如需要）

详细文档请参考：`LINODE-DEPLOYMENT.md`


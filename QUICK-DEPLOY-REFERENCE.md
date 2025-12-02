# 🚀 Linode 快速部署参考

## 一、首次部署

```bash
# 1. SSH 到服务器
ssh root@your-linode-ip

# 2. 运行初始化（仅首次）
cd /path/to/v0-prompt-based-interview
sudo bash setup-linode.sh

# 3. 切换到应用用户
sudo su - v0-interview

# 4. 配置环境变量
cd /home/v0-interview/apps/v0-interview
vim .env.production

# 5. 部署
./deploy-linode.sh

# 6. 创建管理员账号
./scripts/create-admin-prod.sh
```

## 二、日常更新

```bash
# SSH 到服务器
ssh v0-interview@your-linode-ip

# 进入项目目录并部署
cd /home/v0-interview/apps/v0-interview
./deploy-linode.sh
```

## 三、必需的环境变量

```env
# .env.production
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/v0_interview
AUTH_SECRET=$(openssl rand -base64 32)
B2_APPLICATION_KEY_ID=your_key
B2_APPLICATION_KEY=your_secret
B2_BUCKET_NAME=your_bucket
B2_BUCKET_REGION=us-west-004
OPENAI_API_KEY=sk-your-key
POSTGRES_USER=postgres
POSTGRES_PASSWORD=STRONG_PASSWORD
POSTGRES_DB=v0_interview
```

## 四、常用命令

```bash
# 查看日志
docker compose -f docker-compose.linode.yml logs -f

# 重启服务
docker compose -f docker-compose.linode.yml restart

# 查看状态
docker compose -f docker-compose.linode.yml ps

# 进入应用容器
docker compose -f docker-compose.linode.yml exec interview-app sh

# 进入数据库
docker compose -f docker-compose.linode.yml exec postgres psql -U postgres -d v0_interview

# 数据库备份
docker compose -f docker-compose.linode.yml exec postgres pg_dump -U postgres v0_interview > backup.sql
```

## 五、故障排查

```bash
# 检查容器状态
docker compose -f docker-compose.linode.yml ps

# 查看完整日志
docker compose -f docker-compose.linode.yml logs

# 重新构建
docker compose -f docker-compose.linode.yml up -d --build

# 手动运行 Prisma 迁移
docker compose -f docker-compose.linode.yml exec interview-app npx prisma db push
```

## 六、访问地址

- **直接访问**: http://your-ip:3001
- **Nginx 代理**: http://your-domain.com
- **HTTPS**: https://your-domain.com

## 七、端口说明

- **3001**: 应用端口（外部访问）
- **3000**: 容器内部端口
- **5433**: PostgreSQL（映射到主机避免冲突）
- **5432**: PostgreSQL 容器内部端口

## 八、目录结构

```
/home/v0-interview/
└── apps/
    └── v0-interview/
        ├── .env.production       # 生产环境变量
        ├── docker-compose.linode.yml  # Docker Compose 配置
        ├── deploy-linode.sh      # 部署脚本
        └── scripts/
            └── create-admin-prod.sh  # 创建管理员
```

## 九、安全检查清单

- [ ] 数据库密码足够强（建议 20+ 字符）
- [ ] AUTH_SECRET 已随机生成
- [ ] 环境变量文件权限正确（600）
- [ ] 只暴露必要端口
- [ ] 配置了 SSL（HTTPS）
- [ ] 设置了防火墙规则
- [ ] 定期备份数据库

## 十、紧急回滚

```bash
cd /home/v0-interview/apps/v0-interview

# 查看历史
git log --oneline

# 回滚到指定版本
git checkout <commit-hash>

# 重新部署
./deploy-linode.sh
```

---

**详细文档**: 参见 `DEPLOY-TO-LINODE.md`


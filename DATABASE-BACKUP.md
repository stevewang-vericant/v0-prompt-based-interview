# 数据库备份和恢复指南

本文档介绍如何设置和管理生产环境的数据库备份。

## 📋 目录

- [自动备份设置](#自动备份设置)
- [手动备份](#手动备份)
- [恢复数据库](#恢复数据库)
- [备份文件管理](#备份文件管理)
- [故障排查](#故障排查)

---

## 🚀 自动备份设置

### 1. 上传备份脚本到服务器

```bash
# 从本地上传脚本到服务器
scp scripts/backup-database.sh v0-interview@your-server:/home/v0-interview/apps/v0-interview/scripts/
scp scripts/restore-database.sh v0-interview@your-server:/home/v0-interview/apps/v0-interview/scripts/

# SSH 到服务器
ssh v0-interview@your-server

# 设置执行权限
cd /home/v0-interview/apps/v0-interview
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
```

### 2. 创建备份目录

```bash
mkdir -p /home/v0-interview/apps/v0-interview/backups
```

### 3. 测试备份脚本

```bash
cd /home/v0-interview/apps/v0-interview
./scripts/backup-database.sh
```

如果成功，你应该看到：
- ✅ 备份文件已创建在 `backups/` 目录
- ✅ 备份文件已压缩（.sql.gz）
- ✅ 备份统计信息

### 4. 设置定时任务（Cron）

编辑 crontab：

```bash
crontab -e
```

添加以下行（根据你的需求选择）：

```bash
# 每天凌晨 2 点备份
0 2 * * * /home/v0-interview/apps/v0-interview/scripts/backup-database.sh >> /home/v0-interview/apps/v0-interview/backups/backup.log 2>&1

# 或者每 6 小时备份一次
0 */6 * * * /home/v0-interview/apps/v0-interview/scripts/backup-database.sh >> /home/v0-interview/apps/v0-interview/backups/backup.log 2>&1

# 或者每周日凌晨 3 点备份
0 3 * * 0 /home/v0-interview/apps/v0-interview/scripts/backup-database.sh >> /home/v0-interview/apps/v0-interview/backups/backup.log 2>&1
```

**Cron 时间格式说明：**
```
分钟 小时 日 月 星期
 0    2   *  *   *    # 每天凌晨 2 点
 0   */6  *  *   *    # 每 6 小时
 0    3   *  *   0    # 每周日凌晨 3 点
```

### 5. 验证 Cron 任务

```bash
# 查看当前用户的 cron 任务
crontab -l

# 查看 cron 日志（如果系统有配置）
tail -f /var/log/cron
# 或
grep CRON /var/log/syslog
```

---

## 📦 手动备份

### 方法 1: 使用备份脚本（推荐）

```bash
cd /home/v0-interview/apps/v0-interview
./scripts/backup-database.sh
```

### 方法 2: 直接使用 Docker 命令

```bash
cd /home/v0-interview/apps/v0-interview

# 创建备份（未压缩）
docker compose -f docker-compose.linode.yml exec -T postgres pg_dump -U postgres v0_interview > backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql

# 创建压缩备份
docker compose -f docker-compose.linode.yml exec -T postgres pg_dump -U postgres v0_interview | gzip > backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

---

## 🔄 恢复数据库

### ⚠️ 重要警告

**恢复操作会覆盖当前数据库的所有数据！** 请确保：
1. 你有正确的备份文件
2. 你了解恢复操作的影响
3. 最好在维护窗口期间执行

### 使用恢复脚本（推荐）

```bash
cd /home/v0-interview/apps/v0-interview

# 列出可用的备份文件
ls -lh backups/

# 恢复指定的备份文件
./scripts/restore-database.sh backups/v0_interview_20250106_120000.sql.gz

# 或者只提供文件名
./scripts/restore-database.sh v0_interview_20250106_120000.sql.gz
```

### 手动恢复

```bash
cd /home/v0-interview/apps/v0-interview

# 恢复未压缩的备份
docker compose -f docker-compose.linode.yml exec -T postgres psql -U postgres -d v0_interview < backups/v0_interview_20250106_120000.sql

# 恢复压缩的备份
gunzip -c backups/v0_interview_20250106_120000.sql.gz | docker compose -f docker-compose.linode.yml exec -T postgres psql -U postgres -d v0_interview
```

### 恢复后操作

```bash
# 重启应用容器以确保数据一致性
docker compose -f docker-compose.linode.yml restart interview-app

# 验证应用是否正常运行
docker compose -f docker-compose.linode.yml logs -f interview-app
```

---

## 📊 备份文件管理

### 查看备份文件

```bash
# 列出所有备份文件
ls -lh /home/v0-interview/apps/v0-interview/backups/

# 按时间排序（最新的在前）
ls -lht /home/v0-interview/apps/v0-interview/backups/

# 查看备份目录大小
du -sh /home/v0-interview/apps/v0-interview/backups/
```

### 备份保留策略

备份脚本默认保留 **30 天**的备份。你可以修改 `scripts/backup-database.sh` 中的 `RETENTION_DAYS` 变量：

```bash
RETENTION_DAYS=7   # 保留 7 天
RETENTION_DAYS=30  # 保留 30 天（默认）
RETENTION_DAYS=90  # 保留 90 天
```

### 手动清理旧备份

```bash
# 删除 30 天前的备份
find /home/v0-interview/apps/v0-interview/backups/ -name "v0_interview_*.sql*" -type f -mtime +30 -delete

# 删除所有备份（谨慎！）
rm -f /home/v0-interview/apps/v0-interview/backups/v0_interview_*.sql*
```

---

## 🔍 故障排查

### 问题 1: 备份脚本无法执行

```bash
# 检查脚本权限
ls -l scripts/backup-database.sh

# 如果没有执行权限，添加权限
chmod +x scripts/backup-database.sh

# 检查脚本路径是否正确
which bash
```

### 问题 2: Docker 容器未运行

```bash
# 检查容器状态
docker compose -f docker-compose.linode.yml ps

# 启动容器
docker compose -f docker-compose.linode.yml up -d
```

### 问题 3: 备份文件为空或损坏

```bash
# 检查备份文件大小
ls -lh backups/v0_interview_*.sql*

# 测试备份文件（如果是压缩的，先解压）
gunzip -t backups/v0_interview_20250106_120000.sql.gz

# 查看备份文件内容（前几行）
head -20 backups/v0_interview_20250106_120000.sql
```

### 问题 4: Cron 任务未执行

```bash
# 检查 cron 服务是否运行
systemctl status cron
# 或
systemctl status crond

# 查看 cron 日志
tail -f /var/log/cron
# 或
grep CRON /var/log/syslog | tail -20

# 手动测试脚本
./scripts/backup-database.sh

# 检查脚本输出日志
tail -f backups/backup.log
```

### 问题 5: 磁盘空间不足

```bash
# 检查磁盘使用情况
df -h

# 检查备份目录大小
du -sh backups/

# 清理旧备份
find backups/ -name "v0_interview_*.sql*" -type f -mtime +30 -delete
```

---

## 📤 备份到远程存储（可选）

### 备份到 Backblaze B2

如果你已经配置了 B2，可以修改备份脚本添加自动上传功能：

```bash
# 在 backup-database.sh 末尾添加
if [ -n "$B2_APPLICATION_KEY_ID" ] && [ -n "$B2_APPLICATION_KEY" ]; then
    echo "上传备份到 B2..."
    # 使用 b2 CLI 上传
    # b2 upload-file your-bucket-name "$FINAL_BACKUP_FILE" "backups/$(basename $FINAL_BACKUP_FILE)"
fi
```

### 备份到其他云存储

类似地，你可以集成 AWS S3、Google Cloud Storage 等。

---

## ✅ 备份检查清单

定期检查：

- [ ] 备份脚本正常运行
- [ ] Cron 任务已设置并执行
- [ ] 备份文件定期创建
- [ ] 备份文件大小合理（不为 0）
- [ ] 旧备份自动清理
- [ ] 磁盘空间充足
- [ ] 定期测试恢复流程

---

## 📞 紧急恢复流程

如果生产数据库出现问题：

1. **停止应用**（防止数据进一步损坏）
   ```bash
   docker compose -f docker-compose.linode.yml stop interview-app
   ```

2. **选择最近的备份文件**
   ```bash
   ls -lht backups/ | head -5
   ```

3. **恢复数据库**
   ```bash
   ./scripts/restore-database.sh backups/v0_interview_YYYYMMDD_HHMMSS.sql.gz
   ```

4. **验证数据**
   ```bash
   docker compose -f docker-compose.linode.yml exec postgres psql -U postgres -d v0_interview -c "SELECT COUNT(*) FROM interviews;"
   ```

5. **重启应用**
   ```bash
   docker compose -f docker-compose.linode.yml start interview-app
   ```

6. **监控日志**
   ```bash
   docker compose -f docker-compose.linode.yml logs -f interview-app
   ```

---

**最后更新**: 2025-01-06


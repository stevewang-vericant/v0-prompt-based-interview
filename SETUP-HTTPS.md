# HTTPS 设置指南

## 为什么需要 HTTPS？

**视频录制功能需要 HTTPS！**

浏览器的 `getUserMedia()` API（用于访问摄像头和麦克风）是安全 API，它要求：

1. ✅ **HTTPS 连接**（推荐）
2. ✅ **localhost**（仅用于开发）
3. ❌ **HTTP 连接**（会被浏览器阻止）

在 HTTP 连接下，浏览器会阻止访问摄像头和麦克风，导致视频录制功能无法使用。

---

## 前提条件

1. **拥有一个域名**（例如：`interview.example.com`）
2. **域名 DNS 已解析到服务器 IP**（`74.207.251.192`）
3. **服务器已安装 Nginx**

---

## 快速设置步骤

### 1. 安装 Certbot

```bash
# SSH 到服务器
ssh linode-Athena

# 更新包列表
sudo apt update

# 安装 Certbot 和 Nginx 插件
sudo apt install certbot python3-certbot-nginx -y
```

### 2. 更新 Nginx 配置

编辑 Nginx 配置文件：

```bash
sudo vim /etc/nginx/sites-available/v0-interview
```

确保 `server_name` 使用你的域名：

```nginx
server {
    listen 80;
    server_name interview.your-domain.com;  # 替换为你的实际域名

    # 增加客户端请求体大小限制（用于视频上传）
    client_max_body_size 100M;
    
    # 增加超时时间（用于视频上传和处理）
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

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
        
        # 支持大文件上传
        proxy_request_buffering off;
    }

    # 健康检查端点
    location /api/health {
        proxy_pass http://localhost:3001/api/health;
        access_log off;
    }
}
```

测试并重新加载 Nginx：

```bash
# 测试配置
sudo nginx -t

# 如果测试通过，重新加载
sudo systemctl reload nginx
```

### 3. 获取 SSL 证书

使用 Certbot 自动获取并配置 SSL 证书：

```bash
# 替换为你的实际域名
sudo certbot --nginx -d interview.your-domain.com

# 如果还有 www 子域名，可以同时添加：
# sudo certbot --nginx -d interview.your-domain.com -d www.interview.your-domain.com
```

Certbot 会：
1. ✅ 验证域名所有权
2. ✅ 获取 SSL 证书
3. ✅ 自动更新 Nginx 配置以启用 HTTPS
4. ✅ 设置自动续期

### 4. 验证 HTTPS 配置

Certbot 会自动更新 Nginx 配置。检查生成的配置：

```bash
# 查看更新后的配置
sudo cat /etc/nginx/sites-available/v0-interview
```

应该会看到类似这样的配置：

```nginx
# HTTP 自动重定向到 HTTPS
server {
    listen 80;
    server_name interview.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name interview.your-domain.com;

    # SSL 证书配置（Certbot 自动添加）
    ssl_certificate /etc/letsencrypt/live/interview.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/interview.your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 原有配置...
    client_max_body_size 100M;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

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
        proxy_request_buffering off;
    }

    location /api/health {
        proxy_pass http://localhost:3001/api/health;
        access_log off;
    }
}
```

### 5. 更新应用环境变量

更新 `.env.production` 文件，将 `NEXT_PUBLIC_APP_URL` 改为 HTTPS：

```bash
# 切换到应用用户
su - v0-interview

# 编辑环境变量
cd ~/apps/v0-interview
vim .env.production
```

更新这一行：

```env
# 从 HTTP 改为 HTTPS
NEXT_PUBLIC_APP_URL=https://interview.your-domain.com
```

然后重新构建并部署应用：

```bash
./deploy-linode.sh
```

### 6. 测试 HTTPS

1. 访问 `https://interview.your-domain.com`
2. 检查浏览器地址栏的锁图标 🔒
3. 测试视频录制功能（现在应该可以正常使用摄像头和麦克风）

---

## 自动续期

Let's Encrypt 证书每 90 天过期。Certbot 会自动设置续期任务。

验证续期任务：

```bash
# 查看 Certbot 定时任务
sudo systemctl status certbot.timer

# 测试续期（不会实际续期，只是测试）
sudo certbot renew --dry-run
```

---

## 如果没有域名怎么办？

### 方案 1: 购买域名（推荐）

推荐域名注册商：
- **Namecheap** - 价格便宜，界面友好
- **Cloudflare Registrar** - 成本价，无隐藏费用
- **Google Domains** - 简单易用

购买域名后，在 DNS 设置中添加 A 记录：
- **类型**: A
- **名称**: `interview`（或 `@` 用于根域名）
- **值**: `74.207.251.192`
- **TTL**: 3600（或默认）

### 方案 2: 使用自签名证书（仅用于测试）

⚠️ **注意**: 浏览器会显示安全警告，需要手动接受。不适合生产环境。

```bash
# 创建 SSL 目录
sudo mkdir -p /etc/nginx/ssl

# 生成自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt

# 在 Nginx 配置中使用自签名证书
```

---

## 常见问题

### Q: Certbot 验证失败？

**检查清单**：
- ✅ 域名 DNS 已正确解析到服务器 IP
- ✅ 80 端口未被防火墙阻止
- ✅ Nginx 正在运行
- ✅ 域名可以正常访问（HTTP）

**测试 DNS 解析**：
```bash
# 在本地测试
nslookup interview.your-domain.com
# 应该返回 74.207.251.192
```

### Q: 如何强制 HTTPS？

Certbot 会自动配置 HTTP 到 HTTPS 的重定向。如果没有，手动添加：

```nginx
server {
    listen 80;
    server_name interview.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Q: 如何查看证书到期时间？

```bash
sudo certbot certificates
```

### Q: 如何手动续期证书？

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Q: 证书续期失败怎么办？

```bash
# 查看 Certbot 日志
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# 手动续期并查看详细输出
sudo certbot renew --verbose
```

---

## 验证 HTTPS 设置

### 1. 检查 SSL 证书

访问 `https://www.ssllabs.com/ssltest/` 并输入你的域名，检查 SSL 配置。

### 2. 检查浏览器安全指示器

- ✅ 地址栏显示锁图标 🔒
- ✅ 显示 "Secure" 或 "安全"
- ✅ 没有安全警告

### 3. 测试视频录制

1. 访问 `https://interview.your-domain.com/student/interview?school=mit`
2. 点击 "Test Camera" 按钮
3. 应该可以正常访问摄像头和麦克风

---

## 总结

设置 HTTPS 的步骤：
1. ✅ 安装 Certbot
2. ✅ 更新 Nginx 配置（使用域名）
3. ✅ 运行 `certbot --nginx -d your-domain.com`
4. ✅ 更新 `.env.production` 中的 `NEXT_PUBLIC_APP_URL`
5. ✅ 重新部署应用

完成后：
- ✅ 视频录制功能可以正常使用
- ✅ 复制链接功能可以正常使用（Clipboard API）
- ✅ 更安全的连接
- ✅ 更好的用户体验

---

## 需要帮助？

如果遇到问题，请检查：
1. Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`
2. Certbot 日志：`sudo tail -f /var/log/letsencrypt/letsencrypt.log`
3. 应用日志：`docker logs v0-interview-app`


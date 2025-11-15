# 移动设备 HTTPS 访问配置指南

## 概述

本文档记录了在 Linode 服务器上配置 HTTPS 以支持桌面和移动设备访问的完整过程，包括遇到的问题和解决方案。

---

## 初始 HTTPS 设置

### 1. 域名和 DNS 配置

- **域名**: `demo.vcnt.co`
- **服务器 IP**: `74.207.251.192`
- **DNS 记录**: A 记录指向服务器 IP

### 2. 安装 Certbot

```bash
# SSH 到服务器
ssh linode-Athena

# 更新包列表
sudo apt update

# 安装 Certbot 和 Nginx 插件
sudo apt install certbot python3-certbot-nginx -y
```

### 3. 配置 Nginx

编辑 Nginx 配置文件：

```bash
sudo vim /etc/nginx/sites-available/v0-interview
```

初始配置：

```nginx
server {
    listen 80;
    server_name demo.vcnt.co;

    client_max_body_size 100M;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
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

测试并重新加载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 获取 SSL 证书

使用 Certbot 自动获取并配置 SSL 证书：

```bash
sudo certbot --nginx -d demo.vcnt.co --agree-tos --register-unsafely-without-email --non-interactive
```

Certbot 会自动：
- ✅ 验证域名所有权
- ✅ 获取 SSL 证书（默认 ECDSA 证书）
- ✅ 自动更新 Nginx 配置以启用 HTTPS
- ✅ 设置自动续期

### 5. 验证初始配置

```bash
# 测试 HTTPS 连接
curl -I https://demo.vcnt.co

# 检查证书信息
openssl s_client -connect demo.vcnt.co:443 -servername demo.vcnt.co </dev/null
```

**结果**: 桌面浏览器可以正常访问，但移动设备出现 `ERR_SSL_PROTOCOL_ERROR`。

---

## 遇到的问题

### 问题描述

**症状**:
- ✅ 桌面浏览器（Chrome、Firefox、Safari）可以正常访问 `https://demo.vcnt.co`
- ❌ 移动设备（iOS Safari、iOS Chrome、Android Firefox）无法访问
- ❌ 错误信息: `ERR_SSL_PROTOCOL_ERROR` 或 "此网站无法提供安全连接"

**影响范围**:
- iPhone (iOS Safari, Chrome)
- Android (Firefox)
- 部分旧版移动浏览器

### 根本原因分析

1. **证书类型问题**:
   - Let's Encrypt 默认使用 **ECDSA** 证书（更现代、更高效）
   - 证书链: `demo.vcnt.co` → `E8 (ECDSA)` → `ISRG Root X1`
   - 部分移动设备和旧版浏览器不完全支持 ECDSA 证书链

2. **TLS 协议和密码套件**:
   - 移动设备可能只支持 TLS 1.2 + RSA 密码套件
   - 默认配置优先使用 ECDSA，导致握手失败

3. **证书链兼容性**:
   - 新的 ECDSA 中间证书（E8）可能不被所有移动设备信任
   - 需要提供 RSA 证书作为备选

---

## 解决方案

### 方案：双证书配置（ECDSA + RSA）

同时提供 ECDSA 和 RSA 两种证书，让 Nginx 根据客户端能力自动选择。

### 实施步骤

#### 1. 申请 RSA 证书

```bash
# 使用 --key-type rsa 参数申请 RSA 证书
sudo certbot certonly --nginx -d demo.vcnt.co \
  --key-type rsa \
  --cert-name demo.vcnt.co-rsa \
  --agree-tos \
  --register-unsafely-without-email \
  --non-interactive
```

**输出**:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/demo.vcnt.co-rsa/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/demo.vcnt.co-rsa/privkey.pem
```

#### 2. 更新 Nginx 配置

编辑 `/etc/nginx/sites-available/v0-interview`:

```bash
sudo vim /etc/nginx/sites-available/v0-interview
```

**关键配置**（在 `listen 443 ssl;` 之后添加两套证书）:

```nginx
server {
    server_name demo.vcnt.co;

    # ... 其他配置 ...

    listen 443 ssl; # managed by Certbot
    
    # ECDSA 证书（默认，现代浏览器优先使用）
    ssl_certificate /etc/letsencrypt/live/demo.vcnt.co/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/demo.vcnt.co/privkey.pem; # managed by Certbot
    
    # RSA 证书（备选，兼容旧设备和移动浏览器）
    ssl_certificate /etc/letsencrypt/live/demo.vcnt.co-rsa/fullchain.pem; # RSA fallback for legacy clients
    ssl_certificate_key /etc/letsencrypt/live/demo.vcnt.co-rsa/privkey.pem; # RSA fallback for legacy clients
    
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

**重要**: Nginx 支持多个 `ssl_certificate` 指令。它会根据客户端的能力自动选择最合适的证书。

#### 3. 测试配置

```bash
# 测试 Nginx 配置语法
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

#### 4. 验证双证书配置

**测试 ECDSA 证书**（现代客户端）:
```bash
openssl s_client -connect demo.vcnt.co:443 -servername demo.vcnt.co </dev/null
```

**预期输出**:
```
Certificate chain
 0 s:CN=demo.vcnt.co
   i:C=US, O=Let's Encrypt, CN=E8
   a:PKEY: id-ecPublicKey, 256 (bit); sigalg: ecdsa-with-SHA384
```

**测试 RSA 证书**（传统客户端）:
```bash
openssl s_client -connect demo.vcnt.co:443 \
  -servername demo.vcnt.co \
  -tls1_2 \
  -cipher ECDHE-RSA-AES128-GCM-SHA256 </dev/null
```

**预期输出**:
```
Certificate chain
 0 s:CN=demo.vcnt.co
   i:C=US, O=Let's Encrypt, CN=R13
   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256
```

#### 5. 验证移动设备访问

在移动设备上：
1. 完全关闭浏览器应用
2. 重新打开浏览器
3. 访问 `https://demo.vcnt.co`
4. 如果仍有问题，尝试切换网络（Wi-Fi ↔ 移动数据）

---

## 证书续期配置

### 自动续期

Certbot 会自动设置续期任务。验证续期配置：

```bash
# 查看 Certbot 定时任务
sudo systemctl status certbot.timer

# 测试续期（不会实际续期，只是测试）
sudo certbot renew --dry-run
```

### 双证书续期

**重要**: 需要确保两个证书都自动续期。

检查续期配置：

```bash
# 查看所有证书
sudo certbot certificates
```

**输出示例**:
```
Found the following certs:
  Certificate Name: demo.vcnt.co
    Domains: demo.vcnt.co
    Expiry Date: 2026-02-12 16:01:08+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/demo.vcnt.co/fullchain.pem
    Key Type: ECDSA

  Certificate Name: demo.vcnt.co-rsa
    Domains: demo.vcnt.co
    Expiry Date: 2026-02-13 01:10:50+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/demo.vcnt.co-rsa/fullchain.pem
    Key Type: RSA
```

两个证书都会自动续期，无需额外配置。

---

## 故障排查

### 问题 1: 移动设备仍然无法访问

**排查步骤**:

1. **检查证书是否正确配置**:
   ```bash
   sudo cat /etc/nginx/sites-available/v0-interview | grep ssl_certificate
   ```
   应该看到两套证书路径。

2. **检查证书文件是否存在**:
   ```bash
   sudo ls -l /etc/letsencrypt/live/demo.vcnt.co*/
   ```

3. **测试 RSA 证书握手**:
   ```bash
   openssl s_client -connect demo.vcnt.co:443 \
     -servername demo.vcnt.co \
     -tls1_2 \
     -cipher ECDHE-RSA-AES128-GCM-SHA256 </dev/null
   ```

4. **检查 Nginx 错误日志**:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

5. **清除移动设备缓存**:
   - 完全关闭浏览器
   - 清除浏览器缓存
   - 切换网络（Wi-Fi ↔ 移动数据）

### 问题 2: 证书续期失败

**排查步骤**:

1. **查看 Certbot 日志**:
   ```bash
   sudo tail -f /var/log/letsencrypt/letsencrypt.log
   ```

2. **手动测试续期**:
   ```bash
   sudo certbot renew --dry-run
   ```

3. **检查定时任务**:
   ```bash
   sudo systemctl status certbot.timer
   sudo systemctl list-timers | grep certbot
   ```

### 问题 3: Nginx 配置错误

**常见错误**:

1. **变量未转义**:
   ```nginx
   # ❌ 错误
   proxy_set_header Upgrade $http_upgrade;
   
   # ✅ 正确（在 shell 脚本中使用时）
   proxy_set_header Upgrade \$http_upgrade;
   ```

2. **证书路径错误**:
   ```bash
   # 验证证书路径
   sudo ls -l /etc/letsencrypt/live/demo.vcnt.co*/
   ```

3. **配置语法错误**:
   ```bash
   # 测试配置
   sudo nginx -t
   ```

---

## 最佳实践

### 1. 证书管理

- ✅ 使用 Certbot 自动管理证书
- ✅ 定期检查证书到期时间
- ✅ 监控续期任务状态
- ✅ 保留证书备份（可选）

### 2. Nginx 配置

- ✅ 使用 Certbot 管理的配置文件
- ✅ 定期备份 Nginx 配置
- ✅ 测试配置更改后再重新加载
- ✅ 监控错误日志

### 3. 兼容性

- ✅ 同时提供 ECDSA 和 RSA 证书
- ✅ 支持 TLS 1.2 和 TLS 1.3
- ✅ 使用现代密码套件
- ✅ 定期测试移动设备访问

### 4. 监控

- ✅ 使用 SSL Labs 测试: https://www.ssllabs.com/ssltest/
- ✅ 监控证书到期时间
- ✅ 定期检查移动设备访问
- ✅ 设置证书到期提醒（可选）

---

## 技术细节

### 证书类型对比

| 特性 | ECDSA | RSA |
|------|-------|-----|
| **密钥大小** | 256-bit | 2048-bit |
| **性能** | 更快 | 较慢 |
| **兼容性** | 现代浏览器 | 所有浏览器 |
| **Let's Encrypt 中间证书** | E8 | R13 |
| **推荐用途** | 默认（现代客户端） | 备选（传统客户端） |

### TLS 协议支持

- **TLS 1.3**: 现代浏览器（优先使用 ECDSA）
- **TLS 1.2**: 所有浏览器（根据客户端能力选择 ECDSA 或 RSA）

### Nginx 证书选择机制

Nginx 会根据以下因素自动选择证书：
1. 客户端支持的密码套件
2. 客户端支持的密钥交换算法
3. 证书的密钥类型（ECDSA vs RSA）

当配置多个 `ssl_certificate` 时，Nginx 会：
- 优先使用第一个匹配的证书
- 如果客户端不支持第一个，尝试下一个
- 确保最佳兼容性

---

## 总结

### 成功要点

1. ✅ **双证书配置**: 同时提供 ECDSA 和 RSA 证书
2. ✅ **自动续期**: 使用 Certbot 管理证书续期
3. ✅ **兼容性测试**: 定期测试桌面和移动设备访问
4. ✅ **监控和日志**: 定期检查证书状态和错误日志

### 关键配置

```nginx
# 双证书配置（关键）
ssl_certificate /etc/letsencrypt/live/demo.vcnt.co/fullchain.pem;      # ECDSA
ssl_certificate_key /etc/letsencrypt/live/demo.vcnt.co/privkey.pem;   # ECDSA
ssl_certificate /etc/letsencrypt/live/demo.vcnt.co-rsa/fullchain.pem; # RSA
ssl_certificate_key /etc/letsencrypt/live/demo.vcnt.co-rsa/privkey.pem; # RSA
```

### 验证命令

```bash
# 测试 ECDSA 证书
openssl s_client -connect demo.vcnt.co:443 -servername demo.vcnt.co </dev/null

# 测试 RSA 证书
openssl s_client -connect demo.vcnt.co:443 \
  -servername demo.vcnt.co \
  -tls1_2 \
  -cipher ECDHE-RSA-AES128-GCM-SHA256 </dev/null

# 检查所有证书
sudo certbot certificates
```

---

## 相关文档

- [SETUP-HTTPS.md](./SETUP-HTTPS.md) - 初始 HTTPS 设置指南
- [LINODE-DEPLOYMENT.md](./LINODE-DEPLOYMENT.md) - Linode 部署完整指南
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
- [Nginx SSL 配置](https://nginx.org/en/docs/http/configuring_https_servers.html)

---

## 更新记录

- **2025-11-15**: 初始文档创建，记录双证书配置方案
- **2025-11-14**: 初始 HTTPS 设置完成
- **2025-11-15**: 移动设备访问问题解决

---

## 联系和支持

如果遇到问题：
1. 检查本文档的故障排查部分
2. 查看 Nginx 和 Certbot 日志
3. 使用 SSL Labs 测试工具验证配置


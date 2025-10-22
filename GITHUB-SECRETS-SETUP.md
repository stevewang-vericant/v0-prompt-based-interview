# GitHub Secrets 配置指南

## 需要配置的 Secrets

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下 secrets：

### 必需的 Secrets
- `SERVER_HOST`: 你的服务器 IP 地址或域名
- `SERVER_USER`: SSH 用户名（通常是 root 或 ubuntu）
- `SERVER_SSH_KEY`: 服务器的 SSH 私钥

### 可选的 Secrets
- `SERVER_PORT`: SSH 端口（默认 22，如果不使用默认端口需要设置）

## 配置步骤

1. 进入 GitHub 仓库
2. 点击 Settings 标签
3. 在左侧菜单中点击 "Secrets and variables" > "Actions"
4. 点击 "New repository secret"
5. 添加上述每个 secret

## 获取 SSH 私钥

如果你还没有 SSH 密钥对，可以生成一个：

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

然后将公钥添加到服务器的 `~/.ssh/authorized_keys` 文件中。

## 测试连接

配置完成后，可以手动触发 GitHub Actions 来测试：

1. 进入 Actions 标签
2. 选择 "部署到自建服务器" workflow
3. 点击 "Run workflow"
4. 选择 main 分支并运行

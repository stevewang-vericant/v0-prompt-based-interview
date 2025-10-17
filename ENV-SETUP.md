# 环境变量设置指南

## 必需配置

### Backblaze B2 (视频存储)

在项目根目录创建 `.env.local` 文件：

```env
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_REGION=us-west-001
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-application-key
```

#### 如何获取 B2 Credentials

1. 访问 [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. 注册/登录账户
3. 创建一个 Bucket（或使用现有的）
4. 进入 **App Keys** 页面
5. 点击 **Add a New Application Key**
6. 配置：
   - **Name**: `v0-interview-app`（或任意名称）
   - **Allow access to Bucket**: 选择你的 bucket
   - **Type of Access**: Read and Write
   - **Allow List All Bucket Names**: 建议勾选
7. 点击 **Create New Key**
8. **重要**: 立即复制 `keyID` 和 `applicationKey`（只显示一次！）

#### 如何找到 B2 Region

1. 在 Backblaze B2 控制台，进入你的 Bucket
2. 查看 **Endpoint** 信息，例如：
   - `s3.us-west-001.backblazeb2.com` → Region: `us-west-001`
   - `s3.us-east-005.backblazeb2.com` → Region: `us-east-005`
   - `s3.eu-central-003.backblazeb2.com` → Region: `eu-central-003`

## 可选配置

### Supabase (数据库)

如果需要将视频记录保存到数据库：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**注意**: 如果不配置 Supabase，视频仍然会上传到 B2，只是不会保存数据库记录。

#### 如何获取 Supabase Credentials

1. 访问 [Supabase](https://supabase.com/)
2. 注册/登录并创建项目
3. 在项目首页，找到 **Project API keys**
4. 复制：
   - **URL**: 项目 URL
   - **anon/public**: Anon key

#### 初始化数据库

如果使用 Supabase，需要运行初始化脚本：

```bash
# 在 Supabase SQL Editor 中运行
cat scripts/001_create_schema.sql
cat scripts/002_seed_prompts.sql
```

或使用 psql：

```bash
psql postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres -f scripts/001_create_schema.sql
psql postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres -f scripts/002_seed_prompts.sql
```

## 验证配置

### 检查环境变量是否加载

创建一个测试页面 `app/api/test-env/route.ts`：

```typescript
export async function GET() {
  return Response.json({
    b2Configured: !!process.env.B2_BUCKET_NAME,
    b2Bucket: process.env.B2_BUCKET_NAME || 'not set',
    b2Region: process.env.B2_BUCKET_REGION || 'not set',
    supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  })
}
```

访问 `http://localhost:3000/api/test-env` 检查配置。

### 测试 B2 连接

运行应用并查看浏览器控制台，录制一个测试视频：

```bash
npm run dev
```

打开 `http://localhost:3000/student/interview` 并录制视频，观察控制台日志。

## 完整的 .env.local 示例

```env
# ===== Backblaze B2 (必需) =====
B2_BUCKET_NAME=my-interview-videos
B2_BUCKET_REGION=us-west-001
B2_APPLICATION_KEY_ID=0012345678901234567890123
B2_APPLICATION_KEY=K001abcdefghijklmnopqrstuvwxyz1234567890

# ===== Supabase (可选) =====
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== 其他可选配置 =====
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 常见问题

### Q: 为什么有些变量有 `NEXT_PUBLIC_` 前缀？

**A**: Next.js 中：
- **不带前缀** (`B2_*`): 只在服务器端可用（Server Actions, API Routes）
- **带前缀** (`NEXT_PUBLIC_*`): 在客户端和服务器端都可用

### Q: .env.local 文件放在哪里？

**A**: 项目根目录（与 `package.json` 同级）

### Q: 修改 .env.local 后需要重启服务器吗？

**A**: 是的，环境变量在启动时加载，修改后需要重启：

```bash
# 停止服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### Q: 生产环境如何配置环境变量？

**A**: 根据部署平台：

- **Vercel**: 在 Project Settings → Environment Variables 中添加
- **自建服务器**: 在服务器上创建 `.env.production` 或使用 Docker 环境变量
- **Docker**: 在 `docker-compose.yml` 中配置 `environment` 或使用 `.env` 文件

### Q: 如何保护我的 credentials？

**A**: 
1. ❌ **永远不要**提交 `.env.local` 到 Git
2. ✅ `.env.local` 已经在 `.gitignore` 中
3. ✅ 只分享 `.env.local.example`（不包含真实值）
4. ✅ 使用不同的 credentials 用于开发和生产环境

## 部署检查清单

在部署前确保：

- [ ] B2 Bucket 已创建
- [ ] B2 Application Key 已创建并有正确权限
- [ ] B2 Bucket 配置为公开访问（如果需要直接访问视频）
- [ ] 所有环境变量已在生产环境配置
- [ ] 数据库表已创建（如果使用 Supabase）
- [ ] 测试上传功能正常工作

## 需要帮助？

查看 [VIDEO-UPLOAD-DEBUG.md](./VIDEO-UPLOAD-DEBUG.md) 了解详细的调试指南。


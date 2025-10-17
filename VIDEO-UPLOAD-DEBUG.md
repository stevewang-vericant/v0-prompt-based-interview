# 视频上传到 B2 调试指南

## 问题症状
- 页面一直显示 "Uploading video... Please wait"
- 视频可能已经上传到 B2 bucket，但页面不继续
- 没有明显的错误提示

## 已修复的问题

### 1. 异步处理问题 ✓
**问题**: `onComplete` 回调被定义为同步函数，但实际是异步的，导致上传完成状态没有正确更新。

**修复**: 
- 将 `onComplete` 类型改为 `Promise<void>`
- 在 `mediaRecorder.onstop` 中使用 `await` 等待上传完成

### 2. 错误处理改进 ✓
**问题**: 上传失败或数据库保存失败时，没有详细的错误信息。

**修复**:
- 添加详细的控制台日志
- 分离 B2 上传和数据库保存（B2 上传成功即视为成功，数据库保存失败不影响）
- 添加环境变量检查

## 如何调试

### 步骤 1: 检查环境变量

确保 `.env.local` 文件包含以下配置：

```env
# Backblaze B2 (必需)
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_REGION=us-west-001
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-application-key

# Supabase (可选 - 如果不配置，只上传不保存数据库)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**验证方法**:
1. 在项目根目录运行：
```bash
echo $B2_BUCKET_NAME
```

2. 或在代码中添加日志（已添加在 `upload-video.ts` 中）

### 步骤 2: 查看浏览器控制台日志

打开浏览器开发者工具 (F12)，切换到 Console 标签页。

**正常上传流程的日志应该是：**

```
[v0] Recording stopped, creating blob
[v0] Blob created, size: 1234567 bytes
[v0] Calling onComplete to upload video
[v0] Prompt completed: 1 Blob size: 1234567
[v0] ===== Starting video upload =====
[v0] Blob size: 1234567 bytes
[v0] Interview ID: interview-xxx
[v0] Prompt ID: 1
[v0] Response Order: 1
[v0] Bucket: your-bucket-name
[v0] Region: us-west-001
[v0] Key ID configured: true
[v0] Converting blob to buffer...
[v0] Buffer created, size: 1234567 bytes
[v0] Filename: interviews/xxx/response-1-xxx.webm
[v0] Uploading to B2...
[v0] ✓ B2 upload successful!
[v0] Video URL: https://f001.backblazeb2.com/file/...
[v0] Saving to database...
[v0] ✓ Database save successful
[v0] ===== Upload complete =====
[v0] Video uploaded successfully: https://...
[v0] onComplete finished successfully
```

### 步骤 3: 识别问题

根据日志停止的位置判断问题：

#### 场景 A: 卡在 "Uploading to B2..."
**可能原因**:
- B2 credentials 错误
- 网络问题
- Bucket 名称或 region 错误

**解决方法**:
1. 验证 B2 credentials：登录 Backblaze，检查 Application Key
2. 验证 Bucket 名称和 region
3. 检查网络连接

#### 场景 B: B2 上传成功，但卡在 "Saving to database..."
**可能原因**:
- Supabase 配置错误
- 数据库表不存在或权限问题

**解决方法**:
1. 检查 Supabase URL 和 Anon Key
2. 运行数据库初始化脚本：
```bash
psql -U your_user -d your_database -f scripts/001_create_schema.sql
```
3. 验证 `interview_responses` 表存在

**注意**: 现在即使数据库保存失败，视频上传也会成功（不会阻塞用户）

#### 场景 C: 没有任何日志
**可能原因**:
- Server Action 没有被调用
- Next.js 开发服务器问题

**解决方法**:
1. 重启开发服务器：
```bash
npm run dev
# 或
pnpm dev
```

2. 清除 Next.js 缓存：
```bash
rm -rf .next
npm run dev
```

### 步骤 4: 测试 B2 连接

创建一个测试脚本 `test-b2.js`：

```javascript
const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3")

const s3Client = new S3Client({
  endpoint: `https://s3.us-west-001.backblazeb2.com`, // 替换成你的 region
  region: "us-west-001",
  credentials: {
    accessKeyId: "your-key-id",
    secretAccessKey: "your-application-key",
  },
})

async function testConnection() {
  try {
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)
    console.log("✓ B2 connection successful!")
    console.log("Buckets:", response.Buckets.map(b => b.Name))
  } catch (error) {
    console.error("✗ B2 connection failed:", error.message)
  }
}

testConnection()
```

运行：
```bash
node test-b2.js
```

## 常见问题

### Q1: 视频上传到 B2 了，但页面一直显示上传中
**A**: 这通常是数据库保存失败导致的。现在已修复，数据库保存失败不会影响用户体验。

### Q2: 如何找到 B2 Region？
**A**: 
1. 登录 Backblaze B2
2. 进入你的 Bucket 设置
3. 查看 "Endpoint" 字段，例如：`s3.us-west-001.backblazeb2.com`
4. Region 就是 `us-west-001`

### Q3: 如何验证视频真的上传了？
**A**:
1. 登录 Backblaze B2 控制台
2. 进入你的 Bucket
3. 查看 `interviews/` 目录
4. 应该能看到视频文件

### Q4: 可以不使用 Supabase 吗？
**A**: 可以！现在代码已经支持只使用 B2 而不使用 Supabase。只需不配置 Supabase 环境变量即可。

### Q5: 上传很慢怎么办？
**A**: 
- 选择离你最近的 B2 region
- 检查网络连接
- 考虑压缩视频（需要修改录制参数）

## 进一步优化建议

### 1. 添加上传进度条
修改 `upload-video.ts` 使用 multipart upload：

```typescript
// 对于大文件，使用 multipart upload
if (buffer.length > 5 * 1024 * 1024) { // > 5MB
  // 使用 CreateMultipartUploadCommand
}
```

### 2. 添加重试机制
```typescript
async function uploadWithRetry(uploadFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadFn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      console.log(`Retry ${i + 1}/${maxRetries}...`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 3. 添加上传队列
如果需要上传多个视频，使用队列避免同时上传：

```typescript
const uploadQueue = []
let isUploading = false

async function processQueue() {
  if (isUploading || uploadQueue.length === 0) return
  isUploading = true
  const task = uploadQueue.shift()
  await task()
  isUploading = false
  processQueue()
}
```

## 联系支持

如果问题仍然存在：
1. 导出完整的控制台日志
2. 检查 B2 bucket 中是否有文件
3. 检查网络请求（Network 标签）
4. 提供环境信息（Next.js 版本、浏览器版本等）

---

**最后更新**: 根据实际遇到的上传问题修复
**状态**: 已修复异步处理和错误处理问题


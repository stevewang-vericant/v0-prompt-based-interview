# Vercel 部署调试指南

## 🔍 查看错误日志的方法

### 方法 1: Vercel Dashboard（推荐）

1. 访问 https://vercel.com/dashboard
2. 进入您的项目 `v0-prompt-based-interview`
3. 点击顶部导航的 **"Logs"** 或 **"Functions"**
4. 选择 **"Runtime Logs"**
5. 进行一次面试测试，实时查看日志输出

### 方法 2: 浏览器控制台

1. 打开浏览器的开发者工具（F12）
2. 切换到 **Console** 标签
3. 进行面试并提交
4. 查看控制台中的错误信息（特别是以 `[v0]` 或 `[FFmpeg]` 开头的日志）

### 方法 3: Network 面板

1. 打开浏览器的开发者工具（F12）
2. 切换到 **Network** 标签
3. 进行面试并提交
4. 查找失败的请求（红色标记）
5. 点击失败的请求，查看 **Response** 和 **Preview** 标签

---

## ⚠️ Vercel 部署的常见问题

### 问题 1: 环境变量未配置

**症状**: 上传失败，提示 "Missing B2 credentials"

**解决方案**:
1. 登录 Vercel Dashboard
2. 进入项目 Settings → Environment Variables
3. 添加以下环境变量（和 `.env.local` 中的内容一致）:
   ```
   B2_ENDPOINT=https://s3.us-west-001.backblazeb2.com
   B2_REGION=us-west-001
   B2_ACCESS_KEY_ID=你的Key
   B2_SECRET_ACCESS_KEY=你的Secret
   B2_BUCKET_NAME=New-Product-Test
   ```
4. 重新部署（Vercel 会自动触发）

### 问题 2: Serverless Function 超时

**症状**: 视频合并到一半失败，或者长时间等待后超时

**原因**:
- Vercel Hobby 计划的 Serverless Function 最大执行时间是 **10 秒**
- Pro 计划是 **60 秒**
- 视频合并（特别是 FFmpeg 处理）可能需要更长时间

**解决方案**:
1. 在 `next.config.mjs` 中增加函数超时配置（需要 Pro 计划）:
   ```javascript
   experimental: {
     serverActions: {
       bodySizeLimit: '50mb',
       allowedOrigins: ['*'],
     },
   },
   // 为需要长时间运行的路由设置超时
   async rewrites() {
     return {
       beforeFiles: [],
       afterFiles: [],
       fallback: [],
     }
   },
   ```

2. 或者在 `vercel.json` 中配置:
   ```json
   {
     "functions": {
       "app/**/*.ts": {
         "maxDuration": 60
       }
     }
   }
   ```

### 问题 3: FFmpeg.wasm 在 Vercel Edge Runtime 上不兼容

**症状**: FFmpeg 初始化失败，或者 "SharedArrayBuffer is not defined"

**原因**:
- Vercel Edge Runtime 不支持 `SharedArrayBuffer`
- FFmpeg.wasm 需要 Node.js Runtime

**解决方案**:
确保 Server Actions 使用 Node.js Runtime。检查文件顶部是否有：
```typescript
// app/actions/upload-video.ts
'use server'
// 不要添加 export const runtime = 'edge'
```

### 问题 4: Body Size 限制

**症状**: 上传大视频时失败，提示 "Payload Too Large"

**原因**:
- Vercel Serverless Functions 的请求 body 大小默认限制为 **4.5 MB**
- 我们已经在 `next.config.mjs` 中设置了 `bodySizeLimit: '50mb'`

**验证**: 检查 `next.config.mjs` 是否包含:
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '50mb',
  },
}
```

### 问题 5: CORS 和 SharedArrayBuffer

**症状**: FFmpeg 初始化失败，控制台显示 "SharedArrayBuffer is not available"

**解决方案**: 已在 `next.config.mjs` 中配置 CORS headers，确保部署包含这些配置。

---

## 🧪 快速测试

### 测试环境变量是否正确

创建一个测试 API 路由：

```typescript
// app/api/test-b2/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    endpoint: process.env.B2_ENDPOINT ? '✅ Set' : '❌ Missing',
    region: process.env.B2_REGION ? '✅ Set' : '❌ Missing',
    accessKey: process.env.B2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
    secretKey: process.env.B2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
    bucket: process.env.B2_BUCKET_NAME ? '✅ Set' : '❌ Missing',
  }
  
  return NextResponse.json(config)
}
```

然后访问 `https://你的域名.vercel.app/api/test-b2` 查看结果。

---

## 📊 推荐的调试流程

1. **检查环境变量** → 确保 B2 credentials 已在 Vercel Dashboard 中配置
2. **查看 Vercel Logs** → 在 Dashboard 中查看实时错误日志
3. **检查浏览器控制台** → 查看前端的详细错误信息
4. **检查 Network 面板** → 查看哪个请求失败，状态码是什么
5. **检查函数执行时间** → 如果是超时，考虑升级 Vercel 计划或优化代码

---

## 🚀 如果问题依然存在

请提供以下信息以便进一步诊断：

1. Vercel Dashboard → Logs 中的错误信息
2. 浏览器控制台的完整错误日志
3. Network 面板中失败请求的详细信息（状态码、响应内容）
4. 您的 Vercel 计划（Hobby 还是 Pro）

---

## 💡 临时解决方案（如果是超时问题）

如果确认是 Vercel 超时导致的，可以考虑：

1. **方案 A**: 在前端合并视频，然后上传合并后的文件
   - 优点: 不依赖 Serverless Function 的执行时间
   - 缺点: 前端 FFmpeg 处理较慢，消耗用户设备资源

2. **方案 B**: 使用 Vercel Blob Storage 或其他云存储服务
   - 先将分段视频上传到临时存储
   - 使用后台任务或 Webhook 异步合并
   - 合并完成后上传到 B2

3. **方案 C**: 升级到 Vercel Pro 计划
   - 获得 60 秒的函数执行时间
   - 更高的内存和 CPU 配额


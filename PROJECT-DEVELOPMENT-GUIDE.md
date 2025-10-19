# 视频面试系统 - 完整开发指南

> **项目名称**: Video Interview Assessment System  
> **技术栈**: Next.js 15 + React 19 + Supabase + Backblaze B2 + FFmpeg.wasm  
> **部署平台**: Vercel  
> **开发周期**: 2024年10月  

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [核心功能模块](#核心功能模块)
4. [开发工作流](#开发工作流)
5. [关键技术实现](#关键技术实现)
6. [部署流程](#部署流程)
7. [最佳实践](#最佳实践)
8. [故障排除策略](#故障排除策略)

---

## 项目概述

### 业务需求

构建一个面向教育机构的视频面试平台，允许：
- **学生端**: 无需注册登录，通过链接直接参加面试，录制视频回答问题
- **学校端**: 注册登录后管理本校学生的面试记录，查看视频和评估结果
- **超级管理员**: 查看所有学校的面试数据

### 核心价值

1. **低门槛**: 学生无需注册，降低参与成本
2. **多租户**: 每个学校独立管理数据，权限隔离
3. **跨平台**: 支持桌面和移动设备（iOS/Android）
4. **自动化**: 视频自动合并、转码、上传

---

## 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js 15 App Router + React 19 + Server Components       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Server Actions Layer                     │
│    upload-video.ts │ interviews.ts │ auth.ts                │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 ↓            ↓            ↓
        ┌────────────┐ ┌──────────┐ ┌──────────┐
        │ Supabase   │ │ B2 S3    │ │ FFmpeg   │
        │ PostgreSQL │ │ Storage  │ │ .wasm    │
        │ + Auth     │ │          │ │ (Client) │
        └────────────┘ └──────────┘ └──────────┘
```

### 技术选型理由

| 技术 | 用途 | 选择理由 |
|------|------|----------|
| **Next.js 15** | 全栈框架 | App Router、Server Actions、优秀的性能 |
| **React 19** | UI框架 | 最新特性，更好的状态管理 |
| **Supabase** | 数据库+认证 | 开箱即用的认证、实时数据库、RLS |
| **Backblaze B2** | 对象存储 | 性价比高，S3兼容，可靠性强 |
| **FFmpeg.wasm** | 视频处理 | 纯前端视频合并，无需服务器资源 |
| **Vercel** | 部署平台 | 与 Next.js 深度集成，自动 CI/CD |

---

## 核心功能模块

### 1. 学生面试流程

#### 1.1 设备检测与权限管理

**功能**: 检测摄像头和麦克风，请求权限

**实现文件**: `components/interview/interview-setup.tsx`

**关键代码模式**:
```typescript
// 请求媒体设备权限
const stream = await navigator.mediaDevices.getUserMedia({ 
  video: true, 
  audio: true 
})

// 权限错误处理
try {
  // 尝试获取权限
} catch (err) {
  if (err.name === 'NotAllowedError') {
    // 用户拒绝权限
  } else if (err.name === 'NotFoundError') {
    // 设备不存在
  }
}
```

**移动端适配要点**:
- iOS 需要 `playsInline` 和 `muted` 属性
- 提供详细的权限设置指引（中文）
- Safari 和 Chrome 权限界面不同，需分别说明

#### 1.2 视频录制

**功能**: 录制学生回答每个问题的视频

**实现文件**: `components/interview/interview-prompt.tsx`

**关键代码模式**:
```typescript
// 初始化 MediaRecorder
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9,opus',
  videoBitsPerSecond: 2500000
})

// 收集录制数据
const chunks: Blob[] = []
mediaRecorder.ondataavailable = (e) => {
  if (e.data.size > 0) chunks.push(e.data)
}

// 停止录制，生成 Blob
mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' })
  onComplete(promptId, blob)
}
```

**最佳实践**:
- 使用 `useRef` 避免组件重渲染时丢失录制状态
- 设置防重复上传标志，避免 `onstop` 多次触发
- 清理 `MediaStream` 防止内存泄漏

#### 1.3 视频合并与转码

**功能**: 将多个 WebM 视频合并为单个 MP4

**实现文件**: `lib/video-merger.ts`

**工作流程**:
```
1. 加载 FFmpeg.wasm (首次使用，约5秒)
   ↓
2. 获取每个视频的时长（用于生成字幕元数据）
   ├─ 成功: 使用实际时长
   └─ 失败: 使用估算时长（iOS Safari兼容）
   ↓
3. 将所有视频写入 FFmpeg 虚拟文件系统
   ↓
4. 创建 concat.txt 文件列表
   ↓
5. 执行 FFmpeg 命令合并并转码
   ffmpeg -f concat -i concat.txt -c:v libx264 -c:a aac output.mp4
   ↓
6. 读取输出文件，返回 Blob
   ↓
7. 清理临时文件
```

**关键配置**:
```typescript
// FFmpeg 转码参数
{
  '-c:v': 'libx264',        // H.264视频编码（广泛支持）
  '-preset': 'fast',        // 快速编码（牺牲一点质量换速度）
  '-crf': '23',             // 恒定质量模式（23是不错的平衡点）
  '-c:a': 'aac',            // AAC音频编码（标准）
  '-b:a': '128k',           // 音频比特率
  '-movflags': '+faststart' // 优化Web播放（元数据前置）
}
```

**iOS Safari 兼容性**:
```typescript
// 获取视频时长的 iOS 兼容方案
async function getVideoDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.playsInline = true  // iOS 必需
    video.muted = true        // iOS 必需
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => resolve(video.duration)
    video.onloadeddata = () => resolve(video.duration) // 备用
    video.load()  // iOS Safari 需要主动触发
  })
}
```

#### 1.4 视频上传

**功能**: 上传合并后的视频到 B2 存储

**实现文件**: `app/actions/upload-video.ts`

**关键代码模式**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// 初始化 S3 客户端（B2兼容S3 API）
const s3Client = new S3Client({
  region: process.env.B2_BUCKET_REGION,
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY
  }
})

// 上传文件
const uploadCommand = new PutObjectCommand({
  Bucket: process.env.B2_BUCKET_NAME,
  Key: `interviews/${interviewId}/complete-interview-${timestamp}.mp4`,
  Body: buffer,
  ContentType: 'video/mp4'
})

await s3Client.send(uploadCommand)
```

**Next.js 配置**:
```javascript
// next.config.mjs
export default {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'  // 允许大文件上传
    }
  }
}
```

#### 1.5 字幕元数据生成

**功能**: 生成包含问题文本和时间戳的 JSON

**实现文件**: `app/actions/upload-json.ts`

**数据结构**:
```typescript
{
  interviewId: "interview-xxx",
  totalDuration: 360.5,
  createdAt: "2024-10-19T12:00:00Z",
  questions: [
    {
      id: "1",
      questionNumber: 1,
      category: "Conversational Fluency",
      text: "Tell me about your favorite hobby...",
      startTime: 0,
      endTime: 90.5,
      duration: 90.5
    },
    // ... 更多问题
  ]
}
```

**用途**:
- 视频播放时显示字幕
- 学校评审时快速定位问题
- 数据分析和评分系统

### 2. 学校管理系统

#### 2.1 用户认证

**功能**: 学校管理员注册、登录、登出

**实现文件**: `app/actions/auth.ts`

**Supabase Auth 集成**:
```typescript
// 注册
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: { school_id: schoolId }  // 自定义用户元数据
  }
})

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
})

// 登出
await supabase.auth.signOut()

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser()
```

**Server-Side Auth**:
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
}
```

#### 2.2 多学校权限隔离

**功能**: 每个学校只能查看自己的面试数据

**实现方式**: Row Level Security (RLS) + 学校代码

**数据库设计**:
```sql
-- schools 表
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,  -- 学校唯一代码（如 'harvard'）
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- school_admins 表
CREATE TABLE school_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  email TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- interviews 表
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id TEXT UNIQUE NOT NULL,
  school_code TEXT,  -- 关联学校
  student_email TEXT,
  video_url TEXT,
  subtitle_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**RLS 策略**:
```sql
-- 学校管理员只能查看本校面试
CREATE POLICY "School admins see own interviews"
ON interviews FOR SELECT
USING (
  school_code IN (
    SELECT s.code
    FROM schools s
    JOIN school_admins sa ON sa.school_id = s.id
    WHERE sa.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM school_admins
    WHERE user_id = auth.uid() AND is_super_admin = TRUE
  )
);
```

**学生面试关联**:
```typescript
// 学生访问面试时带上 school 参数
const url = `/student/interview?school=harvard`

// 提交时保存关联
await saveInterview({
  interview_id: interviewId,
  student_email: email,
  school_code: schoolCode,  // 从 URL 参数获取
  video_url: videoUrl
})
```

#### 2.3 面试列表与搜索

**功能**: 查看面试列表，搜索过滤

**实现文件**: `app/school/dashboard/page.tsx`

**查询逻辑**:
```typescript
// 获取当前用户的学校信息
const schoolInfo = await getSchoolByAdminEmail(userEmail)

// 根据学校代码查询面试
const { interviews } = await getInterviewsBySchoolCode(
  schoolInfo.school.code,
  limit,
  offset
)

// 客户端搜索过滤（也可以改为服务端）
const filtered = interviews.filter(interview => {
  const searchLower = searchTerm.toLowerCase()
  return (
    interview.student_email?.toLowerCase().includes(searchLower) ||
    interview.student_name?.toLowerCase().includes(searchLower)
  )
})
```

**UI 设计**:
- 卡片式布局，显示关键信息
- 搜索框实时过滤
- 视频预览和播放
- 分页加载

#### 2.4 视频播放与字幕

**功能**: 播放面试视频，显示动态字幕

**实现文件**: `components/video-player-with-subtitles.tsx`

**核心逻辑**:
```typescript
// 加载字幕元数据
const response = await fetch(subtitleUrl)
const metadata = await response.json()

// 根据播放时间匹配字幕
const handleTimeUpdate = () => {
  const currentTime = videoRef.current.currentTime
  const question = metadata.questions.find(q => 
    currentTime >= q.startTime && currentTime < q.endTime
  )
  setCurrentSubtitle(question)
}

// 视频元素
<video 
  ref={videoRef}
  src={videoUrl}
  onTimeUpdate={handleTimeUpdate}
/>

// 字幕覆盖层
{currentSubtitle && (
  <div className="subtitle-overlay">
    <p>Question {currentSubtitle.questionNumber}</p>
    <p>{currentSubtitle.text}</p>
  </div>
)}
```

**CORS 代理**:

由于 B2 文件可能有 CORS 限制，使用 Next.js API 路由代理：

```typescript
// app/api/proxy-video/route.ts
export async function GET(request: NextRequest) {
  const videoUrl = request.searchParams.get('url')
  const response = await fetch(videoUrl, {
    headers: {
      'Range': request.headers.get('Range') || ''  // 支持视频拖动
    }
  })
  return new NextResponse(response.body, {
    status: request.headers.has('Range') ? 206 : 200,
    headers: response.headers
  })
}
```

### 3. 面试完成流程

**功能**: 面试提交后显示状态页面

**实现文件**: `app/student/interview/complete/page.tsx`

**设计思路**:
- 成功：显示祝贺信息，告知后续流程
- 失败：显示错误详情，提供重试链接
- 不存储敏感信息到 localStorage

**URL 参数传递状态**:
```typescript
// 提交后重定向
const params = new URLSearchParams({
  status: result.success ? 'success' : 'error',
  email: studentEmail,
  school: schoolCode,
  error: result.error || ''
})
window.location.href = `/student/interview/complete?${params.toString()}`
```

---

## 开发工作流

### 阶段1: 项目初始化

**步骤**:
1. 创建 Next.js 项目
   ```bash
   npx create-next-app@latest --typescript
   ```

2. 安装核心依赖
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   npm install @aws-sdk/client-s3
   npm install @ffmpeg/ffmpeg @ffmpeg/util
   npm install @radix-ui/react-* lucide-react
   ```

3. 配置环境变量
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

   # Backblaze B2
   B2_BUCKET_NAME=your-bucket
   B2_BUCKET_REGION=us-west-001
   B2_APPLICATION_KEY_ID=xxx
   B2_APPLICATION_KEY=xxx
   ```

### 阶段2: 数据库设计

**步骤**:
1. 在 Supabase Dashboard 创建项目
2. 编写 SQL 迁移脚本（`supabase/migrations/`）
3. 设置 Row Level Security (RLS) 策略
4. 创建索引优化查询性能

**迁移管理**:
```bash
# 本地数据库
supabase start
supabase migration new create_interviews_table
supabase db reset

# Production 数据库
# 在 Supabase Dashboard 的 SQL Editor 中执行
```

### 阶段3: 功能开发

**顺序建议**:
1. **学生面试流程** (核心功能)
   - 设备检测
   - 视频录制
   - 本地存储 Blob

2. **视频处理** (技术难点)
   - FFmpeg.wasm 集成
   - 视频合并逻辑
   - 进度反馈

3. **云存储** (基础设施)
   - B2 上传
   - Server Actions
   - 错误处理

4. **数据库集成** (数据持久化)
   - Supabase 查询
   - Server Actions
   - 数据关联

5. **用户认证** (权限管理)
   - Supabase Auth
   - Session 管理
   - RLS 测试

6. **学校管理** (业务逻辑)
   - Dashboard UI
   - 权限隔离
   - 搜索过滤

**Git 分支策略**:
```
main (Production)
  ↑
  merge
  ↑
feature/xxx (开发分支)
  - feature/video-upload
  - feature/database-integration
  - feature/school-auth
  - fix/mobile-camera-permissions
```

### 阶段4: 测试与优化

**测试清单**:
- [ ] 桌面端 Chrome 完整流程
- [ ] 桌面端 Safari 完整流程
- [ ] 桌面端 Firefox 完整流程
- [ ] iPhone Safari 完整流程
- [ ] iPhone Chrome 完整流程
- [ ] Android Chrome 完整流程
- [ ] 权限被拒绝场景
- [ ] 网络断开场景
- [ ] 多个学校权限隔离
- [ ] 超级管理员权限

**性能优化**:
- FFmpeg.wasm 首次加载缓存
- 视频上传进度显示
- 数据库查询分页
- 图片和静态资源优化

### 阶段5: 部署

**Vercel 部署配置**:

1. 连接 GitHub 仓库
2. 配置环境变量（Production 和 Preview 分别配置）
3. 设置构建命令：
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next"
   }
   ```

4. 配置 `vercel.json`：
   ```json
   {
     "functions": {
       "app/actions/**/*.ts": {
         "maxDuration": 60
       }
     }
   }
   ```

**CI/CD 流程**:
```
Git Push → GitHub
    ↓
Vercel Webhook Triggered
    ↓
Build (npm run build)
    ↓
Deploy to Preview (feature branches)
    or
Deploy to Production (main branch)
    ↓
Health Check
    ↓
Done ✅
```

---

## 关键技术实现

### 1. SharedArrayBuffer 配置

**问题**: FFmpeg.wasm 需要 SharedArrayBuffer，但浏览器要求特定的 CORS 头

**解决方案**:
```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp'
        },
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin'
        }
      ]
    }
  ]
}
```

**注意**: 视频播放页面需要放宽限制（`unsafe-none`），否则无法加载外部视频

### 2. Server Actions 最佳实践

**模式**:
```typescript
// app/actions/xxx.ts
'use server'

export async function serverAction(params) {
  // 1. 验证权限
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 2. 验证输入
  if (!params.xxx) return { success: false, error: 'Invalid input' }

  // 3. 执行业务逻辑
  try {
    const result = await doSomething(params)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: error.message }
  }
}
```

**调用**:
```typescript
// 客户端组件
'use client'

const handleSubmit = async () => {
  const result = await serverAction(params)
  if (result.success) {
    // 成功处理
  } else {
    // 错误处理
  }
}
```

### 3. 移动端兼容性

**MediaDevices API**:
- iOS Safari 需要 HTTPS
- iOS Chrome 权限界面不明显，需要提供指引
- Android 一般没问题

**视频元素**:
```typescript
<video
  playsInline  // iOS 必需，否则全屏播放
  muted        // iOS 自动播放需要静音
  preload="metadata"
  onCanPlay={handler}
/>
```

**MediaRecorder**:
- iOS Safari 支持 `video/mp4` 但质量较差
- 推荐使用 `video/webm;codecs=vp9,opus`
- 降级方案：先尝试 WebM，失败则用 MP4

### 4. 文件上传优化

**大文件处理**:
- Next.js Server Actions 默认限制 1MB
- 调整 `bodySizeLimit` 到 50MB
- 考虑 Vercel Hobby 计划限制

**进度反馈**:
```typescript
// 使用状态管理显示进度
const [uploadProgress, setUploadProgress] = useState(0)
const [uploadStatus, setUploadStatus] = useState('')

// FFmpeg 进度
ffmpeg.on('progress', ({ progress }) => {
  setUploadProgress(Math.floor(progress * 70))
})

// 上传进度
setUploadStatus('Uploading to B2...')
setUploadProgress(80)
```

### 5. Supabase RLS 调试

**常见问题**:
- RLS 策略错误导致无数据返回
- `auth.uid()` 在服务端和客户端不同

**调试方法**:
```sql
-- 临时禁用 RLS 测试查询
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;

-- 检查当前用户
SELECT auth.uid();

-- 测试 RLS 策略
SELECT * FROM interviews
WHERE /* 复制 RLS 策略条件 */;
```

---

## 部署流程

### 开发环境

```bash
# 启动本地开发服务器
npm run dev

# 访问
http://localhost:3000
```

### Preview 环境

1. 创建 feature 分支
   ```bash
   git checkout -b feature/xxx
   ```

2. 开发和提交
   ```bash
   git add .
   git commit -m "feat: add xxx"
   ```

3. 推送到 GitHub
   ```bash
   git push origin feature/xxx
   ```

4. Vercel 自动部署到 Preview
   - 查看 Vercel Dashboard
   - 获取 Preview URL
   - 测试功能

### Production 环境

1. 合并到 main 分支
   ```bash
   git checkout main
   git merge feature/xxx
   ```

2. 推送到 GitHub
   ```bash
   git push origin main
   ```

3. Vercel 自动部署到 Production
   - Production URL: `https://your-project.vercel.app`
   - 监控部署状态
   - 执行冒烟测试

### 回滚

```bash
# 本地回滚
git revert <commit-hash>
git push origin main

# Vercel 回滚
# 在 Dashboard 选择之前的部署点击 "Promote to Production"
```

---

## 最佳实践

### 1. 状态管理

**原则**: 
- 服务端状态用 Server Actions + Supabase
- 客户端状态用 React Hooks
- 临时状态用 URL 参数

**示例**:
```typescript
// ❌ 不好 - 客户端存储敏感数据
localStorage.setItem('user', JSON.stringify(user))

// ✅ 好 - 服务端 Session
const user = await supabase.auth.getUser()

// ✅ 好 - URL 状态传递
const searchParams = useSearchParams()
const schoolCode = searchParams.get('school')
```

### 2. 错误处理

**分层处理**:
```typescript
// 1. API/数据库层 - 返回结构化错误
try {
  const data = await supabase.from('xxx').select()
  return { success: true, data }
} catch (error) {
  return { success: false, error: error.message }
}

// 2. 业务逻辑层 - 处理错误，提供回退
const result = await apiCall()
if (!result.success) {
  console.error(result.error)
  // 尝试回退方案或返回友好错误
}

// 3. UI 层 - 显示用户友好的错误消息
if (!result.success) {
  toast.error('操作失败，请重试')
}
```

### 3. 性能优化

**关键指标**:
- First Contentful Paint (FCP) < 1.8s
- Time to Interactive (TTI) < 3.8s
- Cumulative Layout Shift (CLS) < 0.1

**优化策略**:
- 使用 Next.js Image 组件
- 懒加载非关键组件
- Server Components 减少客户端 JS
- 合理使用 `use client`

### 4. 安全性

**清单**:
- [x] 所有 API 请求验证权限
- [x] 使用 RLS 保护数据
- [x] 环境变量不提交到 Git
- [x] 密码使用 Supabase Auth（自动哈希）
- [x] 防止 CSRF（Next.js 内置）
- [x] 文件上传大小限制
- [x] 输入验证（前端 + 后端）

### 5. 可维护性

**代码组织**:
```
app/
  ├── student/         # 学生端页面
  ├── school/          # 学校端页面
  ├── api/             # API 路由
  └── actions/         # Server Actions

components/
  ├── interview/       # 面试相关组件
  └── ui/              # 通用 UI 组件

lib/
  ├── supabase/        # Supabase 客户端
  ├── video-merger.ts  # 视频处理
  └── utils.ts         # 工具函数

supabase/
  └── migrations/      # 数据库迁移
```

**命名规范**:
- 文件名：kebab-case (`user-profile.tsx`)
- 组件名：PascalCase (`UserProfile`)
- 函数名：camelCase (`getUserProfile`)
- 常量：UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

---

## 故障排除策略

### 问题诊断流程

```
1. 复现问题
   ↓
2. 查看错误日志
   - 浏览器 Console
   - Vercel Function Logs
   - Supabase Logs
   ↓
3. 确定问题层级
   - 客户端？(UI/JS)
   - 网络？(API/CORS)
   - 服务端？(Server Actions)
   - 数据库？(Supabase/RLS)
   - 外部服务？(B2/FFmpeg)
   ↓
4. 隔离问题
   - 简化复现步骤
   - 排除无关因素
   ↓
5. 查阅文档
   - Next.js
   - Supabase
   - FFmpeg.wasm
   ↓
6. 实施修复
   ↓
7. 测试验证
   ↓
8. 部署上线
```

### 常见问题速查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 视频录制失败 | 权限被拒绝 | 检查浏览器权限设置 |
| FFmpeg 加载失败 | SharedArrayBuffer 不可用 | 检查 CORS 头配置 |
| B2 上传失败 | 环境变量错误 | 验证 B2 凭证 |
| 数据查询为空 | RLS 策略阻止 | 检查 RLS 策略和用户权限 |
| Vercel 部署超时 | Function 执行时间过长 | 增加 `maxDuration` 配置 |
| 移动端视频元数据失败 | iOS Safari 兼容性 | 使用估算时长回退 |

### 日志策略

**开发环境**:
```typescript
console.log('[Module] Detailed message', data)
```

**生产环境**:
```typescript
// 使用结构化日志
console.error('[Error] Operation failed', {
  operation: 'upload',
  error: error.message,
  timestamp: new Date().toISOString()
})

// 考虑集成错误追踪服务
// Sentry, LogRocket, etc.
```

---

## 总结

### 核心优势

1. **技术栈现代化**: Next.js 15 + React 19 + Supabase
2. **前端视频处理**: FFmpeg.wasm 降低服务器成本
3. **多租户架构**: RLS 实现数据隔离
4. **跨平台兼容**: 桌面和移动设备全支持
5. **自动化部署**: Vercel CI/CD

### 适用场景

- ✅ 教育面试评估
- ✅ 远程招聘流程
- ✅ 在线测评系统
- ✅ 视频作业提交
- ✅ 用户反馈收集

### 扩展方向

1. **AI 评分**: 集成语音识别和语义分析
2. **实时面试**: 添加 WebRTC 支持
3. **移动应用**: React Native 版本
4. **数据分析**: 面试数据统计和可视化
5. **国际化**: 多语言支持

---

## 附录

### 技术文档链接

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)
- [Backblaze B2 API](https://www.backblaze.com/b2/docs/)
- [Vercel Deployment](https://vercel.com/docs)

### 项目仓库结构

```
.
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   ├── api/               # API Routes
│   ├── school/            # 学校端页面
│   └── student/           # 学生端页面
├── components/            # React 组件
│   ├── interview/         # 面试相关
│   └── ui/                # UI 组件
├── lib/                   # 工具库
│   ├── supabase/          # Supabase 客户端
│   └── video-merger.ts    # 视频处理
├── supabase/              # 数据库迁移
│   └── migrations/
├── public/                # 静态资源
├── .env.local             # 环境变量（不提交）
├── next.config.mjs        # Next.js 配置
├── vercel.json            # Vercel 配置
└── package.json           # 依赖管理
```

---

**文档版本**: 1.0  
**最后更新**: 2024年10月19日  
**作者**: AI Assistant & Steve Wang  
**许可**: MIT


# 异步视频处理功能

## 功能概述

将视频合并和处理改为异步任务，用户在上传完所有视频分段后可以立即关闭页面，无需等待视频合并和处理完成。

## 实现方案

### 1. 数据库表结构

**表名**: `video_processing_tasks`

**字段**:
- `id`: UUID 主键
- `interview_id`: 面试ID（关联 interviews 表）
- `status`: 任务状态（'pending', 'processing', 'completed', 'failed'）
- `segments`: JSONB，存储分段信息
- `error_message`: 错误信息（如果任务失败）
- `merged_video_url`: 合并后的视频URL
- `total_duration`: 合并后的视频总时长
- `segment_durations`: JSONB，每个分段的实际时长
- `created_at`, `started_at`, `completed_at`: 时间戳
- `metadata`: JSONB，额外元数据

**迁移文件**: `supabase/migrations/009_create_video_processing_tasks.sql`

### 2. API 路由

#### `/api/merge-videos` (POST)
- **功能**: 创建异步任务，立即返回任务ID
- **请求体**:
  ```json
  {
    "interviewId": "interview-xxx",
    "segments": [
      {
        "url": "https://...",
        "sequenceNumber": 1,
        "duration": 60,
        "promptId": "1",
        "questionText": "...",
        "category": "..."
      }
    ]
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "taskId": "uuid",
    "interviewId": "interview-xxx",
    "status": "pending",
    "message": "Video merge task created. Processing will start shortly."
  }
  ```

#### `/api/process-video-task` (POST)
- **功能**: 处理指定的视频合并任务（后台调用）
- **请求体**:
  ```json
  {
    "taskId": "uuid"
  }
  ```
- **处理流程**:
  1. 下载所有分段视频
  2. 使用 FFmpeg 合并视频
  3. 转码为 MP4（H.264 Level 4.0）
  4. 上传合并后的视频到 B2
  5. 生成字幕元数据
  6. 上传字幕元数据到 B2
  7. 更新数据库（video_url, subtitle_url, total_duration）
  8. 触发转录任务
  9. 更新任务状态为 completed

### 3. 前端流程

**文件**: `app/student/interview/page.tsx`

**流程**:
1. 用户录制完所有视频分段
2. 上传所有分段到 B2（0-70% 进度）
3. 调用 `/api/merge-videos` 创建异步任务（70% 进度）
4. 立即返回，不等待合并完成
5. 保存基本信息到数据库（video_url 和 subtitle_url 为 null，将在后台更新）
6. 显示"上传完成！视频处理将在后台继续"消息
7. 用户可以立即关闭页面

**关键代码**:
```typescript
// 触发异步服务端合并（不等待完成）
const mergeResult = await fetch('/api/merge-videos', {
  method: 'POST',
  body: JSON.stringify({
    interviewId,
    segments: uploadedSegments.map(seg => ({
      url: seg.videoUrl,
      sequenceNumber: seg.sequenceNumber,
      duration: seg.duration,
      promptId: seg.promptId,
      questionText: seg.questionText,
      category: seg.category
    }))
  })
})

// 立即返回，不等待处理完成
console.log("✓ Video merge task created")
return { success: true }
```

### 4. 后台处理流程

**文件**: `app/api/process-video-task/route.ts`

**处理步骤**:
1. 从任务表获取任务信息
2. 更新任务状态为 'processing'
3. 下载所有分段视频
4. 使用 FFmpeg 合并（两步：先合并为 WebM，再转码为 MP4）
5. 上传合并后的视频到 B2
6. 生成字幕元数据（基于实际视频时长）
7. 上传字幕元数据到 B2
8. 更新数据库（video_url, subtitle_url, total_duration）
9. 触发转录任务
10. 更新任务状态为 'completed'

## 优势

1. **用户体验**: 用户无需等待视频处理完成，可以立即关闭页面
2. **可扩展性**: 可以轻松添加任务队列、重试机制等
3. **可追踪性**: 所有任务状态都保存在数据库中，便于监控和调试
4. **容错性**: 任务失败时会在数据库中记录错误信息

## 数据库迁移

执行以下 SQL 迁移：

```bash
# 在 Supabase Dashboard 的 SQL Editor 中执行
# 或使用 Supabase CLI
supabase migration up
```

迁移文件: `supabase/migrations/009_create_video_processing_tasks.sql`

## 注意事项

1. **任务处理**: 当前使用 `setTimeout` 在 `/api/merge-videos` 中异步触发处理。在生产环境中，可以考虑使用：
   - 消息队列（如 Redis、RabbitMQ）
   - 定时任务（如 cron job）定期处理 pending 任务
   - 后台 worker 进程

2. **字幕元数据**: 字幕元数据在后台处理时生成，需要确保 segments 中包含 `promptId`, `questionText`, `category` 信息

3. **数据库更新**: 前端保存面试记录时，`video_url` 和 `subtitle_url` 为 `null`，会在后台处理完成后更新

4. **错误处理**: 如果任务处理失败，会在 `video_processing_tasks` 表中记录错误信息，状态为 'failed'

## 未来改进

1. **任务状态查询 API**: 创建 `/api/task-status` 用于前端查询处理进度
2. **任务重试机制**: 失败的任务可以手动或自动重试
3. **任务队列**: 使用消息队列管理任务，支持优先级、并发控制等
4. **进度通知**: 处理完成后通过邮件或其他方式通知用户


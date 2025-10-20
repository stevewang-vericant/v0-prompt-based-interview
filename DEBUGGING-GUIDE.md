# 视频上传调试指南

## 问题症状
- ✅ 面试上传显示成功
- ❌ School portal 只能看到/播放第一段视频
- ❌ subtitle 没有生成
- ❌ AI transcription 没有

## 调试步骤

### 1. 检查浏览器控制台日志

在学生面试页面，打开浏览器开发者工具（F12），查看 Console 标签页，查找关键日志：

**应该看到的日志流程：**
```
[v0] Uploading 4 video segments...
[v0] Uploading segment 1/4: Tell me about your favorite hobby...
[v0] ✓ Segment 1 uploaded: https://f001.backblazeb2.com/file/...
[v0] Uploading segment 2/4: Describe a time when you had to solve...
[v0] ✓ Segment 2 uploaded: https://f001.backblazeb2.com/file/...
[v0] Uploading segment 3/4: What do you think is the most important...
[v0] ✓ Segment 3 uploaded: https://f001.backblazeb2.com/file/...
[v0] Uploading segment 4/4: Describe a situation where you had to work...
[v0] ✓ Segment 4 uploaded: https://f001.backblazeb2.com/file/...
[v0] ✓ All 4 segments uploaded successfully
[v0] Subtitle metadata generated: {...}
[v0] Uploading subtitle metadata to B2...
[v0] ✓ Subtitle metadata uploaded successfully: https://f001.backblazeb2.com/file/...
[DB] Saving interview to database...
[DB] Interview saved/updated successfully: <uuid>
[v0] ✓ All operations completed successfully!
```

**查找是否有错误：**
- 🔍 搜索 "error" 或 "failed" 或 "❌"
- 🔍 检查是否有 "Database save failed" 或 "duplicate key"
- 🔍 检查 subtitle 上传是否成功

### 2. 检查数据库数据

在 Supabase 控制台的 SQL Editor 中运行 `debug-queries.sql` 中的查询：

#### 查询 1: 查看最新 interview 记录
```sql
SELECT 
  interview_id, 
  student_email, 
  student_name,
  video_url, 
  subtitle_url,  -- ⚠️ 这个应该有值！
  status,
  created_at,
  metadata
FROM interviews 
ORDER BY created_at DESC 
LIMIT 1;
```

**预期结果：**
- `video_url`: 第一段视频的 URL（正常）
- `subtitle_url`: **应该有 JSON URL**（如果是 null，说明上传失败）
- `status`: "completed"
- `metadata`: 应该包含 `segments` 和 `questions` 数组

#### 查询 2: 查看 interview_responses 记录
```sql
SELECT 
  ir.sequence_number, 
  ir.prompt_id, 
  ir.video_url, 
  ir.created_at
FROM interview_responses ir
JOIN interviews i ON ir.interview_id = i.id
ORDER BY i.created_at DESC, ir.sequence_number ASC
LIMIT 10;
```

**预期结果：应该看到 4 条记录**
- `sequence_number`: 1, 2, 3, 4
- `video_url`: 每个分段的不同 URL

#### 查询 3: 统计每个 interview 的 responses 数量
```sql
SELECT 
  i.interview_id,
  i.student_email,
  COUNT(ir.id) as response_count,  -- ⚠️ 应该是 4
  i.created_at
FROM interviews i
LEFT JOIN interview_responses ir ON ir.interview_id = i.id
GROUP BY i.id, i.interview_id, i.student_email, i.created_at
ORDER BY i.created_at DESC
LIMIT 5;
```

**预期结果：**
- `response_count`: **应该是 4**（如果是 0 或 1，说明保存失败）

### 3. 检查 B2 存储桶

登录 Backblaze B2 控制台，查看 `New-Product-Test` bucket：

应该看到以下文件：
```
interviews/
  ├── interview-1729XXXXXXXX-xxxxx/
      ├── response-1-1729XXXXXXXX.webm    (分段 1)
      ├── response-2-1729XXXXXXXX.webm    (分段 2)
      ├── response-3-1729XXXXXXXX.webm    (分段 3)
      ├── response-4-1729XXXXXXXX.webm    (分段 4)
      └── interview-segments-metadata-1729XXXXXXXX.json  (⚠️ 这个文件很重要！)
```

### 4. 手动检查 subtitle JSON

如果 `subtitle_url` 存在，在浏览器中打开该 URL，应该看到：

```json
{
  "interviewId": "interview-...",
  "totalDuration": 360,
  "createdAt": "2025-10-20T...",
  "segments": [
    {
      "promptId": "1",
      "videoUrl": "https://f001.backblazeb2.com/file/.../response-1-...",
      "sequenceNumber": 1,
      "duration": 90,
      "questionText": "Tell me about your favorite hobby...",
      "category": "Conversational Fluency"
    },
    // ... 3 more segments
  ],
  "questions": [
    // ... 4 questions with startTime, endTime, videoUrl
  ]
}
```

## 常见问题及解决方案

### 问题 1: `subtitle_url` 是 null
**原因：** subtitle 上传失败或 `saveInterview` 失败

**解决方案：**
1. 检查浏览器控制台是否有 "Failed to upload subtitle metadata" 错误
2. 检查是否有 "Database save failed" 错误
3. 重新运行面试测试

### 问题 2: `interview_responses` 只有 1 条或 0 条记录
**原因：** 后续分段上传失败或数据库保存失败

**解决方案：**
1. 检查浏览器控制台，看看是否所有 4 个分段都上传成功
2. 检查是否有 "Database save error" 日志
3. 检查 Supabase RLS 策略是否允许匿名用户 insert `interview_responses`

### 问题 3: 播放器无法播放多个分段
**原因：** `subtitle_url` 为 null，播放器降级到单段模式

**解决方案：**
1. 确保 `subtitle_url` 字段有值
2. 确保 JSON 文件可以公开访问（检查 B2 CORS 设置）
3. 检查浏览器控制台是否有 CORS 错误

### 问题 4: AI Transcription 没有
**原因：** 转录逻辑仅针对 `responseOrder > 0` 的分段

**当前行为：**
- 每个分段会单独创建转录任务
- 转录 ID 格式：`{interviewId}-segment-{1-4}`
- 需要查询 `transcription_jobs` 表确认任务是否创建

**检查转录任务：**
```sql
SELECT * FROM transcription_jobs 
WHERE interview_id LIKE '%segment%'
ORDER BY created_at DESC
LIMIT 10;
```

## 下一步行动

1. ✅ **已修复：** `saveInterview` 改为 upsert，避免重复键错误
2. 🔄 **等待部署：** Vercel 正在部署新版本
3. 📝 **测试：** 部署完成后，重新运行一次完整面试
4. 🐛 **提供日志：** 如果还有问题，提供：
   - 浏览器控制台完整日志
   - 数据库查询结果
   - Vercel 服务器日志（如果有错误）


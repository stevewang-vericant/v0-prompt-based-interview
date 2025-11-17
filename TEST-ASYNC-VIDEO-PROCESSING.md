# 异步视频处理功能测试指南

## 前置步骤

### 1. 执行数据库迁移

**重要**: 在测试前，必须先执行数据库迁移创建 `video_processing_tasks` 表。

**方法 1: 通过 Supabase Dashboard**
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制并执行 `supabase/migrations/009_create_video_processing_tasks.sql` 的内容

**方法 2: 通过 Supabase CLI**
```bash
supabase migration up
```

**验证迁移是否成功**:
```sql
-- 在 Supabase SQL Editor 中执行
SELECT * FROM video_processing_tasks LIMIT 1;
-- 应该返回空结果（表已创建，但还没有数据）
```

## 测试步骤

### 1. 录制视频面试

1. 访问面试页面（例如：`https://demo.vcnt.co/student/interview?school=harvard`）
2. 完成系统检查
3. 依次回答所有 4 个问题（每个问题录制约 1 分钟）
4. 在完成页面输入学生邮箱和姓名
5. 点击 "Submit Interview"

### 2. 观察上传流程

**预期行为**:
- ✅ 分段上传进度显示（0-70%）
- ✅ 显示 "Starting video processing..."（70%）
- ✅ 显示 "Saving interview information..."（80%）
- ✅ 显示 "Upload complete! Video processing will continue in the background."（100%）
- ✅ **可以立即关闭页面**（不需要等待视频合并完成）

### 3. 验证数据库记录

**检查 interviews 表**:
```sql
-- 在 Supabase SQL Editor 中执行
SELECT 
  interview_id,
  student_email,
  video_url,
  subtitle_url,
  total_duration,
  metadata->>'status' as processing_status,
  metadata->>'taskId' as task_id,
  created_at
FROM interviews
WHERE student_email = '你的测试邮箱'
ORDER BY created_at DESC
LIMIT 1;
```

**预期结果**:
- `video_url` 应该为 `null`（后台处理中）
- `subtitle_url` 应该为 `null`（后台处理中）
- `metadata->>'status'` 应该为 `'processing'`
- `metadata->>'taskId'` 应该有任务ID

### 4. 检查任务状态

**检查 video_processing_tasks 表**:
```sql
-- 在 Supabase SQL Editor 中执行
SELECT 
  id,
  interview_id,
  status,
  created_at,
  started_at,
  completed_at,
  error_message
FROM video_processing_tasks
WHERE interview_id = '你的interview_id'
ORDER BY created_at DESC
LIMIT 1;
```

**预期结果**:
- `status` 应该从 `'pending'` → `'processing'` → `'completed'`
- `started_at` 应该有值（开始处理时）
- `completed_at` 应该有值（处理完成时）
- `error_message` 应该为 `null`（如果成功）

### 5. 验证后台处理完成

**等待 2-5 分钟**（取决于视频长度），然后再次检查：

```sql
-- 检查 interviews 表是否已更新
SELECT 
  interview_id,
  video_url,
  subtitle_url,
  total_duration,
  metadata->>'merged' as merged,
  metadata->>'mergedAt' as merged_at
FROM interviews
WHERE interview_id = '你的interview_id';
```

**预期结果**:
- ✅ `video_url` 应该有值（合并后的视频URL）
- ✅ `subtitle_url` 应该有值（字幕元数据URL）
- ✅ `total_duration` 应该有实际时长（秒）
- ✅ `metadata->>'merged'` 应该为 `'true'`
- ✅ `metadata->>'mergedAt'` 应该有时间戳

**检查任务状态**:
```sql
SELECT 
  status,
  merged_video_url,
  total_duration,
  error_message
FROM video_processing_tasks
WHERE interview_id = '你的interview_id';
```

**预期结果**:
- ✅ `status` 应该为 `'completed'`
- ✅ `merged_video_url` 应该有值
- ✅ `total_duration` 应该有实际时长
- ✅ `error_message` 应该为 `null`

### 6. 验证视频和字幕

1. **访问视频URL**: 在浏览器中打开 `video_url`，确认视频可以播放
2. **访问字幕URL**: 在浏览器中打开 `subtitle_url`，确认JSON格式正确
3. **在观看页面测试**: 访问 `/student/watch` 或 `/school/watch`，确认视频和字幕正常显示

### 7. 检查服务器日志

**查看 Docker 日志**:
```bash
ssh linode-Athena "cd /home/v0-interview/apps/v0-interview && docker compose -f docker-compose.linode.yml logs -f interview-app | grep -E '\[Merge\]|\[Task'"
```

**预期日志**:
- `[Merge] Creating async task for interview: ...`
- `[Merge] Task created: ...`
- `[Task ...] Processing video merge for interview: ...`
- `[Task ...] Step 1: Merging videos...`
- `[Task ...] Step 2: Transcoding to MP4 with level 4.0...`
- `[Task ...] ✓ Merged video uploaded: ...`
- `[Task ...] Generating subtitle metadata...`
- `[Task ...] ✓ Subtitle metadata uploaded: ...`
- `[Task ...] ✓ Database updated with video and subtitle URLs`
- `[Task ...] ✓ Transcription completed`

## 错误排查

### 问题 1: 数据库迁移失败

**错误**: `relation "video_processing_tasks" does not exist`

**解决**: 确保已执行数据库迁移（见前置步骤）

### 问题 2: 任务状态一直为 'pending'

**可能原因**:
- `setTimeout` 异步处理没有触发
- 服务器环境不支持异步处理

**排查**:
```bash
# 检查服务器日志
ssh linode-Athena "cd /home/v0-interview/apps/v0-interview && docker compose -f docker-compose.linode.yml logs interview-app | grep -E 'Starting async processing'"
```

**临时解决方案**: 可以手动调用处理API：
```bash
curl -X POST https://demo.vcnt.co/api/process-video-task \
  -H "Content-Type: application/json" \
  -d '{"taskId": "你的任务ID"}'
```

### 问题 3: 视频合并失败

**检查任务错误信息**:
```sql
SELECT error_message, status
FROM video_processing_tasks
WHERE interview_id = '你的interview_id';
```

**常见原因**:
- FFmpeg 未安装或路径不正确
- B2 凭证配置错误
- 分段视频下载失败

### 问题 4: 字幕元数据未生成

**检查**:
- 确认 `segments` 中包含 `promptId`, `questionText`, `category`
- 检查服务器日志中的字幕生成步骤

## 性能测试

### 测试多个并发任务

1. 同时提交多个面试（不同浏览器标签页）
2. 观察任务处理顺序和完成时间
3. 检查是否有任务失败或超时

### 测试长时间视频

1. 录制较长的回答（接近 60 秒）
2. 观察处理时间是否合理
3. 确认最终视频时长正确

## 成功标准

✅ **功能测试通过**:
- [ ] 分段上传后可以立即关闭页面
- [ ] 后台任务成功创建
- [ ] 视频合并和转码成功
- [ ] 字幕元数据生成成功
- [ ] 数据库正确更新
- [ ] 视频和字幕可以正常播放

✅ **性能测试通过**:
- [ ] 多个并发任务可以正常处理
- [ ] 长时间视频可以正常处理
- [ ] 处理时间在合理范围内（< 5 分钟）

## 下一步

测试通过后：
1. 合并到 `main` 分支
2. 部署到生产环境
3. 考虑添加任务状态查询 API（可选）
4. 考虑添加任务重试机制（可选）


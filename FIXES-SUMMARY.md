# 视频上传问题修复总结

## 问题描述

视频录制完成后，页面一直显示 "Uploading video... Please wait"，无法继续。
- B2 bucket 中可以看到上传的文件（说明上传成功）
- 页面UI没有反应，一直显示上传中
- 没有明显的错误提示

## 根本原因

1. **异步处理不当**: `onComplete` 回调被定义为同步函数返回 `void`，但实际传入的是异步函数返回 `Promise<void>`
2. **未等待上传完成**: 在 `mediaRecorder.onstop` 中调用 `onComplete` 时没有使用 `await`
3. **错误处理不足**: 上传失败或数据库保存失败时，`isUploading` 状态可能永远不会重置
4. **数据库保存阻塞**: Supabase 数据库保存失败会导致整个流程失败

## 修复内容

### 1. 修复异步类型不匹配
**文件**: `components/interview/interview-prompt.tsx`

**修改前**:
```typescript
onComplete: (promptId: string, videoBlob: Blob) => void
```

**修改后**:
```typescript
onComplete: (promptId: string, videoBlob: Blob) => Promise<void>
```

### 2. 添加 await 等待上传完成
**文件**: `components/interview/interview-prompt.tsx`

**修改前**:
```typescript
mediaRecorder.onstop = () => {
  const blob = new Blob(chunksRef.current, { type: "video/webm" })
  setRecordedBlob(blob)
  onComplete(prompt.id, blob)  // 没有等待
}
```

**修改后**:
```typescript
mediaRecorder.onstop = async () => {
  console.log("[v0] Recording stopped, creating blob")
  const blob = new Blob(chunksRef.current, { type: "video/webm" })
  console.log("[v0] Blob created, size:", blob.size, "bytes")
  setRecordedBlob(blob)
  
  try {
    console.log("[v0] Calling onComplete to upload video")
    await onComplete(prompt.id, blob)  // 现在会等待完成
    console.log("[v0] onComplete finished successfully")
  } catch (error) {
    console.error("[v0] Error in onComplete:", error)
    alert("Failed to process video. Please try again.")
  }
}
```

### 3. 改进上传函数的错误处理
**文件**: `app/actions/upload-video.ts`

**主要改进**:

#### 添加详细日志
```typescript
console.log("[v0] ===== Starting video upload =====")
console.log("[v0] Blob size:", videoBlob.size, "bytes")
console.log("[v0] Interview ID:", interviewId)
// ... 更多详细日志
```

#### 添加环境变量检查
```typescript
if (!process.env.B2_BUCKET_NAME) {
  throw new Error("B2_BUCKET_NAME not configured")
}
// ... 检查其他必需变量
```

#### 分离 B2 上传和数据库保存
```typescript
await s3Client.send(uploadCommand)
console.log("[v0] ✓ B2 upload successful!")

// 数据库保存失败不影响整体成功
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("[v0] ⚠️ Supabase not configured, skipping database save")
  return { success: true, videoUrl, data: null }
}

// 即使数据库保存失败，也返回成功
if (error) {
  console.error("[v0] ⚠️ Database save error:", error)
  return { success: true, videoUrl, data: null, dbError: error.message }
}
```

### 4. 改进前端上传提示
**文件**: `app/student/interview/page.tsx`

**修改后**:
```typescript
<p className="font-medium">Uploading video...</p>
<p className="text-sm text-muted-foreground">Please wait, do not close this page</p>
<p className="text-xs text-muted-foreground mt-1">Check browser console for details</p>
```

## 新增文档

### 1. ENV-SETUP.md
详细的环境变量配置指南：
- 如何获取 B2 credentials
- 如何配置 Supabase（可选）
- 常见问题解答

### 2. VIDEO-UPLOAD-DEBUG.md
完整的调试指南：
- 如何查看日志
- 如何识别问题
- 常见问题和解决方案
- 测试方法

## 测试步骤

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 打开浏览器控制台
按 F12 打开开发者工具，切换到 Console 标签页

### 3. 进行面试录制
访问 `http://localhost:3000/student/interview`

### 4. 观察日志输出
应该看到详细的上传过程日志：

```
[v0] Recording stopped, creating blob
[v0] Blob created, size: XXXXX bytes
[v0] Calling onComplete to upload video
[v0] ===== Starting video upload =====
...
[v0] ✓ B2 upload successful!
[v0] ✓ Database save successful
[v0] ===== Upload complete =====
[v0] onComplete finished successfully
```

### 5. 验证结果
- [ ] 页面的 "Uploading..." 提示消失
- [ ] 自动进入下一个问题（或完成页面）
- [ ] B2 bucket 中有新文件
- [ ] 没有错误提示

## 环境变量配置

创建 `.env.local` 文件：

```env
# 必需 - Backblaze B2
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_REGION=us-west-001
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-application-key

# 可选 - Supabase（如果不配置也能工作）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

详见 [ENV-SETUP.md](./ENV-SETUP.md)

## 已知限制和未来改进

### 当前限制
1. 上传没有进度条（只有等待提示）
2. 没有重试机制
3. 大文件上传可能较慢

### 建议的未来改进
1. **添加上传进度条**: 使用 multipart upload 显示进度
2. **添加重试机制**: 上传失败自动重试
3. **添加上传队列**: 管理多个视频上传
4. **视频压缩**: 减小文件大小，加快上传

详见 [VIDEO-UPLOAD-DEBUG.md](./VIDEO-UPLOAD-DEBUG.md) 中的优化建议部分

## 如果问题仍然存在

1. **检查环境变量**: 确保所有 B2 变量都正确配置
2. **查看控制台日志**: 所有步骤都有详细日志
3. **检查 B2 bucket**: 确认文件是否真的上传了
4. **验证 credentials**: 使用测试脚本验证 B2 连接
5. **清除缓存**: 删除 `.next` 目录并重启

参考 [VIDEO-UPLOAD-DEBUG.md](./VIDEO-UPLOAD-DEBUG.md) 获取详细调试步骤

## 总结

✅ **核心问题已修复**: 异步处理不当导致上传状态不更新
✅ **改进错误处理**: 详细日志和更好的错误提示
✅ **分离关注点**: B2 上传和数据库保存独立
✅ **完善文档**: 提供详细的配置和调试指南

现在视频上传应该能够正常工作，即使数据库保存失败也不会阻塞用户流程。


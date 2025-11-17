# IndexedDB 断点续传功能

## 功能概述

实现了基于 IndexedDB 的视频片段持久化存储和断点续传功能，解决了用户在上传过程中关闭页面导致视频丢失的问题。

## 核心功能

### 1. 自动保存到 IndexedDB

- **位置**: `app/student/interview/page.tsx`
- **时机**: 每个问题录制完成后立即保存
- **实现**: 调用 `saveVideoSegment()` 将视频 Blob 保存到 IndexedDB

```typescript
// 录制完成后立即保存
await saveVideoSegment(
  interviewId,
  promptId,
  sequenceNumber,
  videoBlob,
  questionText,
  category,
  responseTime
)
```

### 2. 从 IndexedDB 读取上传

- **位置**: `app/student/interview/page.tsx` - `uploadSegmentVideos()`
- **逻辑**: 优先从 IndexedDB 读取，如果没有则使用内存中的数据
- **优势**: 即使页面刷新，也能继续上传

```typescript
// 优先从 IndexedDB 读取
const storedSegments = await getPendingSegments(interviewId)
if (storedSegments.length > 0) {
  // 使用 IndexedDB 中的数据
} else {
  // 使用内存中的数据
}
```

### 3. 页面加载时自动检测

- **位置**: `app/student/interview/page.tsx` - `useEffect`
- **功能**: 页面加载时检查是否有未完成的上传
- **交互**: 如果发现未完成的上传，询问用户是否继续

```typescript
useEffect(() => {
  const checkPendingUploads = async () => {
    const pending = await hasPendingUploads(interviewId)
    if (pending) {
      // 询问用户是否继续上传
      const shouldResume = confirm(...)
      if (shouldResume) {
        // 恢复上传
      }
    }
  }
  checkPendingUploads()
}, [interviewId])
```

### 4. Dashboard 重新上传功能

- **位置**: `app/school/dashboard/page.tsx`
- **显示条件**: 当面试没有 `video_url` 时（处理中或上传中断）
- **按钮**: "Resume Upload" 按钮
- **跳转**: 跳转到 `/student/interview/resume?interviewId=xxx&school=xxx`

### 5. 重新上传页面

- **位置**: `app/student/interview/resume/page.tsx`
- **功能**:
  - 检查 IndexedDB 中是否有未上传的片段
  - 显示待上传片段列表
  - 提供重新上传按钮
  - 上传完成后自动跳转到 dashboard

## 文件结构

```
lib/
  indexeddb.ts                    # IndexedDB 工具库

app/
  student/
    interview/
      page.tsx                    # 主录制页面（已集成 IndexedDB）
      resume/
        page.tsx                  # 重新上传页面
  school/
    dashboard/
      page.tsx                    # Dashboard（已添加重新上传按钮）
  api/
    resume-upload/
      route.ts                    # 检查是否可以重新上传的 API
```

## IndexedDB 数据结构

### 数据库名称
- `interview-videos`

### 对象存储
- `video-segments`

### 数据格式

```typescript
interface VideoSegment {
  id: string                    // 格式: {interviewId}-{promptId}
  interviewId: string
  promptId: string
  sequenceNumber: number
  blob: Blob                    // 视频数据
  questionText: string
  category: string
  responseTime: number
  timestamp: number
  uploaded: boolean             // 是否已上传
  uploadedUrl?: string          // 上传后的 URL
  uploadedAt?: number           // 上传时间
}
```

### 索引
- `interviewId`: 按面试 ID 查询
- `uploaded`: 按上传状态查询
- `timestamp`: 按时间戳查询

## API 函数

### `saveVideoSegment()`
保存视频片段到 IndexedDB

### `getPendingSegments(interviewId)`
获取指定面试的所有未上传片段

### `getAllSegments(interviewId)`
获取指定面试的所有片段（包括已上传的）

### `markSegmentAsUploaded(interviewId, promptId, uploadedUrl)`
标记片段为已上传

### `clearUploadedSegments(interviewId)`
删除指定面试的所有已上传片段

### `hasPendingUploads(interviewId)`
检查是否有未完成的上传

### `getInterviewsWithPendingUploads()`
获取所有有未完成上传的面试ID列表

## 工作流程

### 正常流程

1. 用户录制视频 → 立即保存到 IndexedDB
2. 用户点击提交 → 从 IndexedDB 读取 → 上传到 B2
3. 上传成功 → 标记为已上传 → 清理已上传片段

### 中断恢复流程

1. 用户录制视频 → 保存到 IndexedDB
2. 用户关闭页面（上传中断）
3. 用户重新打开页面 → 检测到未完成上传 → 询问是否继续
4. 用户确认 → 从 IndexedDB 读取 → 继续上传

### Dashboard 重新上传流程

1. Dashboard 显示没有 `video_url` 的面试
2. 用户点击 "Resume Upload" 按钮
3. 跳转到重新上传页面
4. 检查 IndexedDB 中是否有未上传片段
5. 如果有，显示列表并提供上传按钮
6. 用户点击上传 → 继续上传流程

## 注意事项

1. **浏览器兼容性**: IndexedDB 在现代浏览器中都支持，但需要检查
2. **存储空间**: 浏览器会限制 IndexedDB 的大小（通常是可用空间的 50%）
3. **隐私模式**: 某些浏览器的隐私模式下 IndexedDB 可能受限
4. **清理策略**: 上传完成后会自动清理已上传的片段，避免占用空间
5. **错误处理**: 如果 IndexedDB 操作失败，会回退到内存中的数据

## 测试建议

1. **正常流程测试**:
   - 录制完整面试 → 提交 → 验证上传成功

2. **中断恢复测试**:
   - 录制几个问题 → 关闭页面 → 重新打开 → 验证能继续上传

3. **Dashboard 重新上传测试**:
   - 创建一个上传中断的面试 → 在 dashboard 上点击 "Resume Upload" → 验证能继续上传

4. **边界情况测试**:
   - IndexedDB 存储空间不足
   - 浏览器隐私模式
   - 多个标签页同时操作

## 未来改进

1. **进度保存**: 保存上传进度，支持断点续传（不仅仅是片段级别的）
2. **自动重试**: 上传失败时自动重试
3. **批量清理**: 定期清理过期的未上传片段
4. **用户提示**: 更友好的提示信息，而不是简单的 `confirm()`


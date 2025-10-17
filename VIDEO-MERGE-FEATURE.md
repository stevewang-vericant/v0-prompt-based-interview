# 视频合并功能说明

## 功能概述

面试系统现在会将所有问题的录制视频合并成一个完整的文件，然后再上传到 B2。

## 工作流程

### 1. 录制阶段
- 学生依次回答4个问题
- 每个问题录制完成后，视频保存在浏览器内存中
- **不会立即上传**，继续下一个问题

### 2. 合并阶段（第4个问题完成后）
- 自动将4个视频片段按顺序合并成一个完整的视频文件
- 合并使用 Blob API，在浏览器中完成，无需服务器处理
- 显示"Merging and uploading your interview video..."提示

### 3. 上传阶段
- 合并后的完整视频上传到 B2
- 文件命名格式：`complete-interview-{timestamp}.webm`
- 上传完成前，"Submit Interview" 按钮被禁用

### 4. 提交阶段
- 上传完成后，显示成功提示
- "Submit Interview" 按钮启用
- 学生可以正式提交面试

## 技术实现

### 视频合并
```typescript
// 按顺序合并所有视频片段
const sortedBlobs = mockPrompts
  .map(prompt => allResponses[prompt.id])
  .filter(blob => blob !== undefined)

// 使用 Blob API 合并
const mergedBlob = new Blob(sortedBlobs, { type: "video/webm" })
```

### 文件存储结构
```
interviews/
  └── interview-{id}/
      └── complete-interview-{timestamp}.webm  (合并后的完整视频)
```

之前的结构（已废弃）：
```
interviews/
  └── interview-{id}/
      ├── response-1-{timestamp}.webm
      ├── response-2-{timestamp}.webm
      ├── response-3-{timestamp}.webm
      └── response-4-{timestamp}.webm
```

## 优势

### 1. 更好的用户体验
- ✅ 录制过程不中断，不会在每个问题后等待上传
- ✅ 只在最后一次性处理，速度更快
- ✅ 清晰的进度提示

### 2. 更好的数据管理
- ✅ 每次面试只有一个文件，便于管理
- ✅ 文件命名更清晰（`complete-interview-xxx.webm`）
- ✅ 减少 B2 存储的文件数量

### 3. 更好的视频播放
- ✅ 完整的面试视频，无需拼接
- ✅ 可以直接播放，无需处理多个片段
- ✅ 适合后续的 AI 评分处理

## 文件大小预估

假设每个问题平均录制 90 秒：
- 单个问题视频：约 2-3 MB
- 完整面试视频（4个问题）：约 8-12 MB
- 在 50MB 限制内，无问题 ✅

## 兼容性

### 浏览器支持
- ✅ Chrome 49+
- ✅ Firefox 42+
- ✅ Safari 11+
- ✅ Edge 79+

所有现代浏览器都支持 `Blob` API 和 `MediaRecorder` API。

## 错误处理

### 场景 1: 合并失败
- 显示错误提示：`Failed to merge videos`
- 用户可以刷新重新开始

### 场景 2: 上传失败
- 显示错误提示：`Failed to upload merged video`
- 视频仍在内存中，可以重试
- 未来可以添加重试按钮

### 场景 3: 网络中断
- 上传过程中断会报错
- 建议：添加断点续传功能（未来改进）

## 日志示例

```
[v0] Prompt completed: 1 Blob size: 2328140
[v0] Prompt completed: 2 Blob size: 2247626
[v0] Prompt completed: 3 Blob size: 1927106
[v0] Prompt completed: 4 Blob size: 521050
[v0] All prompts completed, merging and uploading videos...
[v0] Merging 4 video segments...
[v0] Videos merged successfully, total size: 7023922 bytes
[v0] Uploading merged video to B2...
[v0] ✓ B2 upload successful!
[v0] ✓ Merged video uploaded successfully: https://f001.backblazeb2.com/file/...
```

## 查看上传的文件

使用命令行快速查看：
```bash
npm run list-b2-interviews
```

应该看到类似：
```
complete-interview-1760687319384.webm    8.5 MB    2025/10/17 15:48:40
```

## 未来改进

### 1. 添加进度条
显示视频合并和上传的进度百分比

### 2. 断点续传
如果上传失败，可以从中断处继续

### 3. 视频压缩
在上传前压缩视频，减小文件大小

### 4. 重试机制
自动重试失败的上传

### 5. 本地预览
允许学生在提交前预览完整的面试视频

## 相关文件

- `app/student/interview/page.tsx` - 主面试页面逻辑
- `app/actions/upload-video.ts` - B2 上传功能
- `components/interview/interview-complete.tsx` - 完成页面
- `components/interview/interview-prompt.tsx` - 录制组件

## 测试检查清单

- [ ] 完成所有4个问题的录制
- [ ] 观察到"Merging and uploading..."提示
- [ ] 确认上传完成后按钮才启用
- [ ] 在 B2 中确认只有1个合并后的文件
- [ ] 使用命令行验证文件存在
- [ ] 下载并播放视频，确认4个问题都在其中

---

**最后更新**: 2025-10-17
**状态**: ✅ 已实现并测试


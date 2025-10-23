# 手动转录和摘要功能修复

## 问题描述
手动生成的转录和摘要结果没有正确保存到数据库，导致下次打开面试页面时需要重新手动生成。

## 根本原因
1. **前端状态更新问题**：手动转录和摘要完成后，前端组件重新从 API 获取数据，而不是直接使用 API 返回的数据
2. **数据库更新延迟**：可能存在数据库更新和 API 查询之间的时序问题
3. **错误状态处理不完整**：转录失败时没有正确更新数据库状态

## 修复内容

### 1. 前端状态管理优化
**文件：** `components/transcription/transcription-display.tsx`

- **直接使用 API 返回数据**：手动转录和摘要完成后，直接使用 API 返回的数据更新组件状态，而不是重新获取
- **添加调试日志**：增加详细的控制台日志来跟踪状态更新过程
- **修复 TypeScript 类型错误**：正确处理 `TranscriptionData | null` 类型

```typescript
// 手动转录完成后直接更新状态
setTranscriptionData(prev => prev ? {
  ...prev,
  status: 'completed',
  transcription: data.transcription,
  aiSummary: data.aiSummary,
  metadata: data.metadata
} : null)

// 手动摘要完成后直接更新状态
setTranscriptionData(prev => prev ? {
  ...prev,
  aiSummary: data.summary
} : null)
```

### 2. 错误状态处理改进
**文件：** `app/api/transcription/manual/route.ts`

- **数据库错误状态更新**：转录失败时，将状态更新为 `failed` 并存储错误信息
- **错误元数据存储**：在 `transcription_metadata` 中存储错误消息和时间戳

```typescript
// 转录失败时更新数据库状态
await supabase
  .from('interviews')
  .update({ 
    transcription_status: 'failed',
    transcription_metadata: {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      failedAt: new Date().toISOString()
    }
  })
  .eq('interview_id', interviewId)
```

## 测试验证

### 测试步骤
1. **手动转录测试**：
   - 进入没有转录的面试页面
   - 点击 "Start Manual Transcription" 按钮
   - 观察控制台日志和页面更新
   - 刷新页面验证转录文本持久存在

2. **手动摘要测试**：
   - 进入已完成转录但没有摘要的面试页面
   - 点击 "Generate Summary" 按钮
   - 观察控制台日志和页面更新
   - 刷新页面验证摘要持久存在

3. **错误处理测试**：
   - 模拟转录失败场景
   - 验证数据库状态正确更新为 `failed`
   - 验证用户界面显示重试按钮

### 预期结果
- ✅ 手动生成的内容立即显示在 UI 中
- ✅ 刷新页面后内容持久存在
- ✅ 错误状态正确更新到数据库
- ✅ 控制台有详细的调试日志

## 技术细节

### 状态更新流程
1. 用户点击手动转录/摘要按钮
2. 发送 API 请求到后端
3. 后端处理请求并更新数据库
4. 后端返回处理结果
5. **前端直接使用返回数据更新状态**（修复点）
6. UI 立即显示新内容

### 数据库字段
- `transcription_status`: 'pending' | 'processing' | 'completed' | 'failed'
- `transcription_text`: 转录文本内容
- `ai_summary`: AI 生成的摘要
- `transcription_metadata`: 包含错误信息、时间戳等元数据

## 分支信息
- **分支名**：`fix/manual-transcription-persistence`
- **提交**：2 个提交
  - `c547a5e`: 修复手动转录和摘要的持久化问题
  - `ec6c605`: 添加手动转录的错误状态处理

## 后续步骤
1. 测试修复是否有效
2. 将分支合并到 `main`
3. 部署到生产环境

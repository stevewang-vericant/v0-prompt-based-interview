# 字幕功能实现总结

## ✅ 已完成的功能

### 1. 字幕元数据生成 📝
**文件**: `lib/video-merger.ts`, `app/student/interview/page.tsx`

**功能**:
- 在视频合并过程中自动获取每个视频段的时长
- 计算每个问题在最终视频中的时间位置（startTime, endTime）
- 生成包含所有问题信息的 JSON 元数据

**元数据格式**:
```json
{
  "interviewId": "interview-xxx",
  "totalDuration": 145.5,
  "createdAt": "2025-01-17T...",
  "questions": [
    {
      "id": "1",
      "questionNumber": 1,
      "category": "Conversational Fluency",
      "text": "Tell me about your favorite hobby...",
      "startTime": 0,
      "endTime": 35.2,
      "duration": 35.2
    },
    // ... more questions
  ]
}
```

### 2. 元数据上传到 B2 ☁️
**文件**: `app/actions/upload-json.ts`

**功能**:
- 新增 `uploadJsonToB2` Server Action
- 将字幕元数据 JSON 上传到 B2
- 文件命名规则: `complete-interview-subtitles-{timestamp}.json`
- 自动生成公开访问 URL

**调用示例**:
```typescript
const result = await uploadJsonToB2(
  subtitleMetadata,
  interviewId,
  "complete-interview-subtitles"
)
// result.url: JSON 文件的公开 URL
```

### 3. 视频播放器组件 🎬
**文件**: `components/video-player-with-subtitles.tsx`

**功能**:
- 自动加载字幕元数据文件
- 根据视频播放时间显示对应的问题字幕
- 支持播放/暂停、静音、进度条、全屏等控制
- 字幕样式：黑色半透明背景，白色文字，自动居中

**字幕显示逻辑**:
```typescript
// 根据当前播放时间查找对应的问题
const current = subtitles.questions.find(
  (q) => currentTime >= q.startTime && currentTime < q.endTime
)
```

**字幕布局**:
```
┌─────────────────────────────────────┐
│                                     │
│         [视频内容]                   │
│                                     │
├─────────────────────────────────────┤
│    ╔═══════════════════╗           │
│    ║   Question 1     ║            │
│    ╚═══════════════════╝           │
│    ╔═══════════════════════════╗   │
│    ║ Tell me about your...     ║   │
│    ╚═══════════════════════════╝   │
└─────────────────────────────────────┘
```

### 4. Student Dashboard 增强 📊
**文件**: `app/student/dashboard/page.tsx`

**新增功能**:
- 自动从 `localStorage` 加载最近的面试记录
- 显示最近面试的信息卡片
- 包含面试 ID、完成时间、时长
- "Watch Interview" 按钮跳转到播放页面

**显示内容**:
```
┌─────────────────────────────────────┐
│ Latest Interview                    │
│ Completed on 2025/01/17 10:30       │
├─────────────────────────────────────┤
│ Interview ID: interview-xxx         │
│ Duration: 2m 25s                    │
│                                     │
│ [Watch Interview] →                 │
└─────────────────────────────────────┘
```

### 5. 视频播放页面 🎥
**文件**: `app/student/watch/page.tsx`

**功能**:
- 接收 `videoUrl` 和 `subtitleUrl` 参数
- 使用 `VideoPlayerWithSubtitles` 组件播放视频
- "Back to Dashboard" 导航按钮
- 提供字幕功能说明

**访问 URL**:
```
/student/watch?videoUrl={视频URL}&subtitleUrl={字幕URL}
```

## 🔄 工作流程

### 面试完成后的流程

```
1. 学生回答所有问题
   ↓
2. 合并视频 (mergeVideos)
   ├─ 获取每个视频段时长
   ├─ 计算时间位置
   └─ 返回 MergeResult
   ↓
3. 生成字幕元数据 JSON
   ↓
4. 上传视频到 B2
   ↓
5. 上传字幕元数据到 B2
   ↓
6. 保存数据到 localStorage
   {
     videoUrl: "...",
     subtitleUrl: "...",
     interviewId: "...",
     totalDuration: 145.5,
     completedAt: "2025-01-17..."
   }
   ↓
7. 重定向到 Dashboard
```

### 观看视频的流程

```
1. 访问 Dashboard
   ↓
2. 点击 "Watch Interview"
   ↓
3. 跳转到 /student/watch
   ↓
4. VideoPlayerWithSubtitles 加载
   ├─ 加载视频
   ├─ 从 subtitleUrl 加载元数据
   └─ 开始播放
   ↓
5. 播放时自动显示字幕
   └─ 根据 currentTime 匹配问题
```

## 📁 文件结构

```
├── lib/
│   └── video-merger.ts              # 视频合并 + 时长计算
├── app/
│   ├── actions/
│   │   ├── upload-video.ts          # 上传视频到 B2
│   │   └── upload-json.ts           # 上传 JSON 到 B2 (新)
│   └── student/
│       ├── interview/
│       │   └── page.tsx             # 面试页面（生成元数据）
│       ├── dashboard/
│       │   └── page.tsx             # Dashboard（显示最近视频）
│       └── watch/
│           └── page.tsx             # 视频播放页面 (新)
└── components/
    └── video-player-with-subtitles.tsx  # 带字幕播放器 (新)
```

## 🎯 核心数据流

### 视频 + 字幕关联

```
Video File:     complete-interview-1760690746710.mp4
Subtitle File:  complete-interview-subtitles-1760690746712.json

关联方式: 
- 两者通过 interviewId 目录关联
- 存储在同一个 B2 目录下: interviews/{interviewId}/
- Dashboard 通过 localStorage 存储两者的 URL
```

### LocalStorage 数据

```typescript
// Key: "latestInterview"
{
  videoUrl: "https://f001.backblazeb2.com/.../complete-interview-xxx.mp4",
  subtitleUrl: "https://f001.backblazeb2.com/.../complete-interview-subtitles-xxx.json",
  interviewId: "interview-1760690587956-hyk9d6nmb",
  totalDuration: 145.5,
  completedAt: "2025-01-17T10:30:15.123Z"
}
```

## 🧪 测试步骤

### 1. 完成面试
```bash
# 启动开发服务器
npm run dev

# 访问面试页面
http://localhost:3000/student/interview
```

1. 点击 "Start Interview"
2. 回答所有 4 个问题（每个准备 5 秒）
3. 观察控制台输出：
   ```
   [Video] Getting duration for each video segment...
   [Video] Segment 1 duration: 35.20s
   ...
   [v0] Subtitle metadata generated: {...}
   [v0] ✓ Subtitle metadata uploaded successfully
   ```
4. 等待上传完成
5. 点击 "Submit Interview"

### 2. 查看 B2 文件
```bash
npm run list-b2-interviews
```

应该看到：
```
- complete-interview-xxx.mp4           # 视频文件
- complete-interview-subtitles-xxx.json  # 字幕元数据
```

### 3. 在 Dashboard 查看
```
http://localhost:3000/student/dashboard
```

应该看到 "Latest Interview" 卡片，包含：
- Interview ID
- 完成时间
- 时长
- "Watch Interview" 按钮

### 4. 播放视频验证字幕
1. 点击 "Watch Interview"
2. 视频应该自动加载
3. 播放视频，观察字幕：
   - ✅ Question 1 在第一个回答时显示
   - ✅ Question 2 在第二个回答时显示
   - ✅ 字幕文本与问题匹配
   - ✅ 字幕自动切换

## 🎨 字幕样式

### 视觉效果
- **位置**: 视频底部上方
- **背景**: 黑色 80% 不透明度
- **文字颜色**: 白色
- **字体大小**: 
  - Question 标签: 20px (xl), 加粗
  - 问题文本: 18px (lg)
- **圆角**: 8px
- **内边距**: 16px 水平, 8px 垂直

### 响应式设计
- 字幕容器最大宽度: 768px
- 自动居中显示
- 文本自动换行
- 不遮挡播放器控制栏

## ⚙️ 配置选项

### 播放器配置
```typescript
<VideoPlayerWithSubtitles 
  videoUrl={videoUrl}           // 必需
  subtitleUrl={subtitleUrl}     // 可选，如果不提供则不显示字幕
  autoPlay={false}              // 可选，默认 false
/>
```

### 字幕样式自定义
在 `components/video-player-with-subtitles.tsx` 中修改：

```typescript
// 修改位置
className="absolute bottom-16 left-0 right-0"

// 修改样式
className="bg-black/80 px-4 py-2 rounded-lg"

// 修改字体大小
className="text-white text-xl font-bold"
```

## 🚀 性能优化

### 字幕加载
- ✅ 使用 `useEffect` 异步加载字幕元数据
- ✅ 显示加载状态，避免白屏
- ✅ 错误处理和提示

### 时间同步
- ✅ 使用 `onTimeUpdate` 事件更新当前时间
- ✅ 使用 `Array.find()` 快速查找当前字幕
- ✅ 避免不必要的重新渲染

### 内存管理
- ✅ 视频元数据加载后释放 URL
- ✅ 组件卸载时清理资源

## 🔧 故障排查

### 问题 1: 字幕不显示
**可能原因**:
- subtitleUrl 未传递或无效
- 字幕 JSON 文件未上传成功
- CORS 问题

**解决方法**:
1. 检查浏览器控制台是否有加载错误
2. 确认 `subtitleUrl` 存在且可访问
3. 使用 `npm run list-b2-interviews` 检查文件

### 问题 2: 字幕时间不对
**可能原因**:
- 视频时长计算错误
- 时间累积错误

**解决方法**:
1. 检查控制台输出的 segment duration
2. 确认 `startTime` 和 `endTime` 正确

### 问题 3: localStorage 数据丢失
**可能原因**:
- 浏览器清除了缓存
- 切换了浏览器或隐身模式

**解决方法**:
- 目前使用 localStorage 作为临时存储
- 未来可以改为数据库存储（Supabase）

## 📈 未来改进

### 短期改进
- [ ] 支持多语言字幕
- [ ] 字幕位置和样式配置界面
- [ ] 字幕搜索和跳转功能

### 中期改进
- [ ] 字幕编辑功能
- [ ] 导出 SRT/VTT 字幕文件
- [ ] 字幕翻译功能

### 长期改进
- [ ] 使用 Supabase 存储面试记录
- [ ] 支持批量查看历史面试
- [ ] AI 生成字幕总结
- [ ] 字幕辅助评分功能

## 📝 注意事项

1. **浏览器兼容性**:
   - 字幕功能依赖 HTML5 Video API
   - 需要支持 `requestFullscreen` 的现代浏览器
   - 建议使用 Chrome, Firefox, Safari 最新版本

2. **文件访问**:
   - B2 文件必须设置为公开访问
   - 字幕 JSON 文件必须支持 CORS

3. **性能考虑**:
   - 字幕元数据文件很小（通常 < 5KB）
   - 不会影响视频加载速度
   - 支持离线播放（如果视频和字幕都已缓存）

4. **安全性**:
   - 视频和字幕 URL 通过 URL 参数传递
   - 未来应该通过数据库查询，避免 URL 泄露

## 🎉 总结

✅ **完全实现了字幕功能**，包括：
- 自动生成字幕元数据
- 上传到 B2 云存储
- 播放器自动加载和显示字幕
- Dashboard 集成和视频管理

✅ **用户体验优化**：
- 字幕自动同步，无需手动操作
- 播放器控制完整，支持全屏
- Dashboard 一键访问最近视频

✅ **技术实现完善**：
- 类型安全（TypeScript）
- 错误处理完整
- 代码结构清晰
- 易于维护和扩展

现在您可以完成面试后，在 Dashboard 点击 "Watch Interview" 观看带字幕的视频！🎬


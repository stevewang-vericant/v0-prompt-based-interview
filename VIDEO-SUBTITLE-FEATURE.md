# 视频字幕功能说明

## 功能概述

在合并面试视频时，自动为每个问题段添加字幕，显示问题编号和问题文本。

## 字幕样式

### 位置和布局
- **Question 1**: 位于视频底部上方 120 像素处，居中显示
- **问题文本**: 位于视频底部上方 80 像素处，居中显示

### 视觉样式
- **Question 标签**:
  - 字体大小: 32px
  - 字体颜色: 白色
  - 背景: 黑色半透明框 (70% 不透明度)
  - 边框宽度: 10px

- **问题文本**:
  - 字体大小: 24px
  - 字体颜色: 白色
  - 背景: 黑色半透明框 (70% 不透明度)
  - 边框宽度: 8px

## 技术实现

### 文件修改

#### 1. `lib/video-merger.ts`
添加了字幕处理逻辑：

```typescript
export async function mergeVideos(
  videoBlobs: Blob[],
  questionTexts?: string[],  // 新增参数
  onProgress?: (progress: number) => void
): Promise<Blob>
```

**处理流程**:
1. 将所有视频写入 FFmpeg 虚拟文件系统
2. 如果提供了 `questionTexts`，为每个视频段添加字幕
3. 使用 FFmpeg `drawtext` 滤镜绘制两行文本:
   - 第一行: "Question 1", "Question 2" 等
   - 第二行: 实际问题文本
4. 合并所有处理后的视频段
5. 输出单个 MP4 文件

**FFmpeg 滤镜**:
```bash
drawtext=text='Question 1':x=(w-text_w)/2:y=h-120:fontsize=32:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=10,
drawtext=text='问题文本':x=(w-text_w)/2:y=h-80:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=8
```

**特殊字符处理**:
- 反斜杠 `\` → `\\\\`
- 冒号 `:` → `\\:`
- 单引号 `'` → `'\\\\\\''`

#### 2. `app/student/interview/page.tsx`
更新视频合并调用：

```typescript
const questionTexts = mockPrompts.map(prompt => prompt.text)

const mergedBlob = await mergeVideos(
  sortedBlobs, 
  questionTexts,  // 传递问题文本
  (progress) => {
    setUploadProgress(Math.floor(progress * 0.8))
    console.log("[v0] Merge progress:", progress + "%")
  }
)
```

## 性能影响

### 处理时间
- **无字幕**: 约 10-20 秒（4个视频段）
- **有字幕**: 约 30-50 秒（4个视频段）

增加的时间主要用于:
1. 为每个视频段重新编码（添加字幕需要重新编码视频流）
2. 文本渲染和合成

### 进度显示
- 0-50%: 为每个视频添加字幕
- 50-95%: 合并所有视频段
- 95-100%: 读取和清理

## 测试方法

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 访问面试页面
```
http://localhost:3000/student/interview
```

### 3. 完成面试
1. 回答所有 4 个问题（每个问题准备时间: 5 秒）
2. 观察合并进度: "Adding subtitles and merging videos..."
3. 等待上传完成

### 4. 检查结果
```bash
npm run list-b2-interviews
```

### 5. 查看视频
复制视频 URL，在浏览器中打开，验证:
- ✅ 每个问题段都有 "Question N" 标签
- ✅ 每个问题段都显示对应的问题文本
- ✅ 字幕位于视频底部，有黑色半透明背景
- ✅ 字幕文本清晰可读

## 配置选项

### 修改字幕位置
在 `lib/video-merger.ts` 中修改 `drawTextFilter`:

```typescript
// 调整 y 坐标
y=h-120  // Question 标签的垂直位置
y=h-80   // 问题文本的垂直位置
```

### 修改字体大小
```typescript
fontsize=32  // Question 标签
fontsize=24  // 问题文本
```

### 修改背景透明度
```typescript
boxcolor=black@0.7  // 0.7 = 70% 不透明度
```

### 禁用字幕
在 `page.tsx` 中，不传递 `questionTexts` 参数:

```typescript
const mergedBlob = await mergeVideos(
  sortedBlobs, 
  // questionTexts,  // 注释掉这行
  (progress) => {
    setUploadProgress(Math.floor(progress * 0.8))
  }
)
```

## 已知限制

### 1. 字体选择
- FFmpeg.wasm 在浏览器中只能使用内置字体
- 无法加载自定义字体文件
- 中文字符可能显示为方框（取决于浏览器环境）

### 2. 文本长度
- 过长的问题文本可能会超出视频宽度
- 建议问题文本保持在 100 个字符以内
- 超长文本不会自动换行

### 3. 性能
- 处理时间随视频数量和长度线性增长
- 在低性能设备上可能需要较长时间
- 建议在测试时使用较短的视频段

## 故障排查

### 问题: 字幕不显示
**可能原因**:
- `questionTexts` 参数为空或 undefined
- FFmpeg 滤镜格式错误

**解决方法**:
1. 检查浏览器控制台日志
2. 确认 `[FFmpeg] Adding subtitles to each video segment...` 出现
3. 检查 FFmpeg 错误信息

### 问题: 字幕文本显示错误
**可能原因**:
- 特殊字符未正确转义
- 问题文本包含 FFmpeg 不支持的字符

**解决方法**:
1. 检查问题文本中的特殊字符
2. 在 `video-merger.ts` 中添加更多转义规则:

```typescript
const escapedText = questionText
  .replace(/\\/g, '\\\\')
  .replace(/:/g, '\\:')
  .replace(/'/g, "'\\\\\\''")
  .replace(/"/g, '\\"')  // 添加双引号转义
```

### 问题: 合并时间过长
**可能原因**:
- 视频文件过大
- 设备性能不足

**解决方法**:
1. 减少录制时间（在测试阶段）
2. 降低视频质量设置
3. 考虑在服务器端处理（而非浏览器端）

## 未来改进

### 短期 (1-2 周)
- [ ] 添加字幕淡入淡出效果
- [ ] 支持多行文本自动换行
- [ ] 优化性能，减少处理时间

### 中期 (1-2 个月)
- [ ] 支持自定义字体
- [ ] 添加字幕位置配置界面
- [ ] 支持多语言字幕

### 长期 (3-6 个月)
- [ ] 移至服务器端处理（提升性能）
- [ ] 支持 SRT/ASS 字幕文件导出
- [ ] 添加字幕编辑功能

## 相关文件

- `lib/video-merger.ts` - 视频合并和字幕添加逻辑
- `app/student/interview/page.tsx` - 面试页面，调用合并功能
- `next.config.mjs` - Next.js 配置（SharedArrayBuffer 支持）
- `FFMPEG-VIDEO-MERGE.md` - FFmpeg 视频合并功能文档

## 参考资料

- [FFmpeg drawtext 文档](https://ffmpeg.org/ffmpeg-filters.html#drawtext-1)
- [FFmpeg.wasm 文档](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [Next.js SharedArrayBuffer 配置](https://nextjs.org/docs/app/api-reference/next-config-js/headers)


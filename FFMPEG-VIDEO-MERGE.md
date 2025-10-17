# FFmpeg 视频合并和 MP4 转换

## 🎯 问题背景

简单的 Blob 合并无法正确处理 WebM 视频文件：
- **问题1完整** ✓
- **问题2后半段画面停止**（只有声音）❌  
- **问题3和问题4根本没有** ❌

## 💡 解决方案

使用 **FFmpeg.wasm** 在浏览器中正确合并视频并转换为 MP4 格式。

### 为什么需要 FFmpeg？

1. WebM 文件有自己的头部和元数据结构
2. 简单连接 Blob 会破坏视频格式
3. FFmpeg 能正确处理视频编解码和容器格式
4. 同时可以转换为更兼容的 MP4 格式

## 🚀 实现的功能

### 1. 正确的视频合并
- 使用 FFmpeg 的 concat 功能
- 保持所有视频的音视频同步
- 确保所有问题的完整性

### 2. MP4 转换
- 使用 H.264 视频编码（更兼容）
- 使用 AAC 音频编码
- 优化 Web 播放（faststart）
- 质量控制（CRF 23）

### 3. 进度显示
- 实时显示合并进度 (0-100%)
- 显示当前状态（合并中/上传中）
- 进度条可视化

## 📁 文件变化

### 新增文件
- `lib/video-merger.ts` - FFmpeg 视频合并工具

### 修改文件
1. `app/student/interview/page.tsx`
   - 导入 `mergeVideos` 函数
   - 添加进度和状态管理
   - 使用 FFmpeg 合并代替简单 Blob 合并

2. `components/interview/interview-complete.tsx`
   - 添加进度条显示
   - 显示当前处理状态

3. `app/actions/upload-video.ts`
   - 支持 MP4 格式
   - 根据扩展名设置正确的 Content-Type

4. `next.config.mjs`
   - 添加 COOP/COEP 头以支持 SharedArrayBuffer
   - 这是 FFmpeg.wasm 所需的

5. `package.json`
   - 添加 `@ffmpeg/ffmpeg`
   - 添加 `@ffmpeg/util`

## 🔧 技术细节

### FFmpeg 合并命令
```bash
ffmpeg -f concat -safe 0 -i concat.txt \
  -c:v libx264 \      # H.264 视频编码
  -preset fast \       # 快速编码
  -crf 23 \           # 质量控制
  -c:a aac \          # AAC 音频编码
  -b:a 128k \         # 音频比特率
  -movflags +faststart \ # Web 优化
  output.mp4
```

### 工作流程
```
1. 收集所有问题的 WebM 视频
   ↓
2. 在浏览器中加载 FFmpeg.wasm
   ↓
3. 将所有视频写入 FFmpeg 虚拟文件系统
   ↓
4. 创建 concat 列表文件
   ↓
5. 执行 FFmpeg 合并和转换命令
   ↓
6. 读取生成的 MP4 文件
   ↓
7. 上传到 B2 存储
```

### 进度分配
- **0-5%**: 准备视频
- **5-80%**: FFmpeg 合并和转换
- **85-95%**: 上传到 B2
- **100%**: 完成

## 🎬 使用流程

### 1. 学生端
1. 录制4个问题的视频（WebM格式）
2. 第4个问题完成后自动触发合并
3. 看到进度提示：
   - "Preparing videos for merge..."
   - "Merging videos and converting to MP4..." (5-80%)
   - "Uploading merged video to B2..." (85-95%)
   - "Upload complete!" (100%)
4. Submit 按钮启用

### 2. 生成的文件
```
complete-interview-{timestamp}.mp4
- 格式: MP4 (H.264 + AAC)
- 包含: 所有4个问题的完整视频
- 大小: 约 6-15 MB（取决于录制时长）
```

## 🔍 验证方法

### 1. 查看文件
```bash
npm run list-b2-interviews
```

应该看到 `.mp4` 文件：
```
complete-interview-1760688162388.mp4    8.5 MB
🔗 https://f001.backblazeb2.com/file/New-Product-Test/...
```

### 2. 验证内容
1. 复制公共链接
2. 在浏览器中打开
3. 播放视频，检查：
   - ✅ 问题1完整
   - ✅ 问题2完整（画面和声音都正常）
   - ✅ 问题3完整
   - ✅ 问题4完整
   - ✅ 所有转场平滑

## ⚙️ 配置要求

### 浏览器要求
- Chrome 94+
- Firefox 93+
- Safari 16.4+
- Edge 94+

需要支持：
- WebAssembly
- SharedArrayBuffer
- MediaRecorder API

### HTTP 头配置
```javascript
// next.config.mjs
headers: [
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
]
```

## 📊 性能

### 处理时间（预估）
- 4个视频（总时长6分钟）
- 合并时间：约 30-60 秒
- 上传时间：约 10-20 秒
- **总计：40-80 秒**

### 文件大小对比
| 格式 | 文件数 | 总大小 |
|------|--------|--------|
| WebM 分离 | 4个 | 约 8-10 MB |
| MP4 合并 | 1个 | 约 6-8 MB |

MP4 格式通常比 WebM 更小！

## 🐛 故障排查

### 问题：FFmpeg 加载失败
**症状**：控制台显示 "Failed to load FFmpeg"

**解决**：
1. 检查网络连接
2. 确保可以访问 unpkg.com CDN
3. 检查浏览器控制台错误

### 问题：SharedArrayBuffer 不可用
**症状**：错误提示 "SharedArrayBuffer is not defined"

**解决**：
1. 确认服务器已重启
2. 检查 `next.config.mjs` 的 headers 配置
3. 在开发者工具 Network 标签验证响应头

### 问题：合并很慢
**原因**：FFmpeg 在浏览器中运行，受客户端性能限制

**优化**：
- 减少录制时长
- 使用更好的设备
- 关闭其他标签页释放内存

### 问题：内存不足
**症状**：页面崩溃或浏览器卡死

**解决**：
1. 关闭其他标签页
2. 增加可用内存
3. 刷新页面重试

## 🎯 优点

### vs 简单 Blob 合并
- ✅ 视频格式正确
- ✅ 所有问题都包含
- ✅ 音视频同步
- ✅ 转场平滑

### vs 服务器端处理
- ✅ 不占用服务器资源
- ✅ 无需额外后端服务
- ✅ 可以离线处理
- ✅ 更好的隐私保护

## 📝 测试检查清单

- [ ] 录制4个问题
- [ ] 观察到 FFmpeg 加载提示
- [ ] 看到合并进度条
- [ ] 上传进度显示正常
- [ ] B2 中生成 `.mp4` 文件
- [ ] 下载并播放，验证所有问题都在
- [ ] 音视频同步正常
- [ ] 视频质量可接受

## 🔮 未来改进

1. **离线缓存**：缓存 FFmpeg WASM 文件
2. **预加载**：在录制开始时就加载 FFmpeg
3. **压缩选项**：允许用户选择视频质量
4. **进度细化**：显示具体处理步骤
5. **错误恢复**：自动重试失败的合并

---

**最后更新**: 2025-10-17  
**状态**: ✅ 已实现并就绪测试


# AI 转录功能设置指南

## 概述

本功能使用 OpenAI Whisper API 为面试视频生成 AI 转录文本，支持实时状态更新和错误处理。

## 环境变量配置

### 1. 添加 OpenAI API Key

在 `.env.local` 文件中添加：

```env
# OpenAI API Key (用于 Whisper 转录)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录或注册账号
3. 进入 API Keys 页面
4. 点击 "Create new secret key"
5. 复制生成的 API Key

### 3. Vercel 环境变量配置

在 Vercel Dashboard 中设置环境变量：

1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加以下变量：

```
OPENAI_API_KEY = sk-your-openai-api-key-here
```

**注意**：确保在 Production 和 Preview 环境都添加了此变量。

## 数据库迁移

运行以下 SQL 在 Supabase 中创建转录相关表：

```sql
-- 在 Supabase SQL Editor 中执行
-- 文件：supabase/migrations/004_add_transcription_fields.sql
```

## 功能特性

### 1. 自动转录
- 视频上传成功后自动启动转录任务
- 异步处理，不阻塞用户流程
- 支持重试机制

### 2. 实时状态更新
- `pending`: 等待处理
- `processing`: 正在转录
- `completed`: 转录完成
- `failed`: 转录失败

### 3. 转录显示
- 完整转录文本
- 分段显示（带时间戳）
- 置信度信息
- 语言检测
- 复制和下载功能

### 4. 错误处理
- 网络错误重试
- 详细的错误信息
- 用户友好的错误提示

## 成本估算

基于 OpenAI Whisper API 定价：

- **价格**: $0.006/分钟
- **示例**: 5分钟视频 = $0.03
- **月成本**: 1000个面试 = $30

## 技术实现

### 1. 转录流程

```
视频上传 → 启动转录任务 → 异步处理 → 更新状态 → 显示结果
```

### 2. 数据库表

- `interviews`: 添加转录相关字段
- `transcription_jobs`: 跟踪转录任务状态

### 3. API 端点

- `POST /api/transcription/process`: 处理转录任务
- `GET /api/transcription/status`: 获取转录状态

### 4. 组件

- `TranscriptionDisplay`: 转录显示组件
- 集成到学校视频播放页面

## 测试步骤

### 1. 本地测试

```bash
# 1. 设置环境变量
echo "OPENAI_API_KEY=sk-your-key" >> .env.local

# 2. 运行数据库迁移
# 在 Supabase SQL Editor 中执行迁移脚本

# 3. 启动开发服务器
npm run dev

# 4. 测试转录功能
# - 完成一个面试
# - 检查转录状态
# - 验证转录文本
```

### 2. 生产测试

1. 部署到 Vercel
2. 设置生产环境变量
3. 完成真实面试测试
4. 检查转录质量和速度

## 故障排除

### 1. 转录失败

**可能原因**：
- OpenAI API Key 无效
- 网络连接问题
- 视频格式不支持
- API 配额超限

**解决方案**：
- 检查 API Key 配置
- 查看 Vercel Function 日志
- 验证视频 URL 可访问性
- 检查 OpenAI 账户余额

### 2. 状态不更新

**可能原因**：
- 数据库连接问题
- 实时更新未正确配置
- 前端轮询失败

**解决方案**：
- 检查 Supabase 连接
- 验证 API 端点
- 查看浏览器控制台错误

### 3. 转录质量差

**可能原因**：
- 音频质量差
- 背景噪音
- 语言不匹配

**解决方案**：
- 优化录制环境
- 考虑使用不同的 Whisper 模型
- 添加音频预处理

## 性能优化

### 1. 缓存策略
- 转录结果缓存
- 状态查询优化

### 2. 并发处理
- 限制同时转录任务数量
- 队列管理

### 3. 监控
- 转录成功率监控
- 处理时间统计
- 错误率跟踪

## 未来改进

1. **多语言支持**: 自动检测语言
2. **说话人识别**: 区分不同说话人
3. **关键词提取**: 自动提取关键信息
4. **情感分析**: 分析回答的情感倾向
5. **摘要生成**: 自动生成面试摘要

## 支持

如有问题，请检查：
1. Vercel Function 日志
2. Supabase 数据库日志
3. 浏览器控制台错误
4. OpenAI API 状态页面

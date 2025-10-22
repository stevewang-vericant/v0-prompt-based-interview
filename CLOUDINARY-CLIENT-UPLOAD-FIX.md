# Cloudinary客户端上传修复 - 解决413错误

## 问题描述

在测试过程中发现，面试视频上传仍然通过Vercel API路由进行，导致413 (Content Too Large)错误。尽管视频片段成功上传到Backblaze B2，但在最终提交时超过了Vercel的请求体大小限制。

## 解决方案

将整个视频处理流程从服务器端API路由迁移到客户端直接调用Cloudinary，完全绕过Vercel的限制。

## 主要更改

### 1. 新增客户端Cloudinary工具函数

**文件**: `lib/client-cloudinary.ts`

- `uploadVideoSegmentClient()` - 客户端直接上传视频片段到Cloudinary
- `mergeVideoSegmentsClient()` - 客户端调用Cloudinary API合并视频
- `cleanupTempFilesClient()` - 客户端清理临时文件
- `saveInterviewClient()` - 客户端保存面试数据到数据库

### 2. 新增数据库保存API路由

**文件**: `app/api/save-interview/route.ts`

- 轻量级API路由，只处理数据库保存
- 避免在API路由中处理大文件
- 使用Supabase admin client绕过RLS

### 3. 更新面试页面流程

**文件**: `app/student/interview/page.tsx`

- 新增 `uploadSegmentVideosClient()` 函数
- 完全绕过Vercel API路由限制
- 直接调用Cloudinary进行视频处理和合并
- 保持原有的字幕元数据上传到B2

### 4. 更新环境变量配置

**文件**: `ENV-SETUP.md`

- 添加Cloudinary配置说明
- 区分客户端和服务端环境变量
- 提供完整的配置示例

### 5. 新增测试页面

**文件**: `app/test-upload/page.tsx`
**文件**: `app/api/test-cloudinary/route.ts`

- 配置验证工具
- 视频上传测试功能
- 帮助调试和验证设置

## 新的上传流程

```
1. 用户录制视频片段
2. 客户端直接上传到Cloudinary (绕过Vercel)
3. 客户端调用Cloudinary API合并视频
4. 客户端上传字幕元数据到B2
5. 客户端调用轻量级API保存到数据库
6. 清理Cloudinary临时文件
```

## 环境变量配置

### 必需配置

```env
# Cloudinary客户端配置
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Cloudinary服务端配置
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# B2配置（字幕元数据）
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_REGION=us-west-001
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-application-key

# Supabase配置（数据库）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 优势

1. **解决413错误**: 完全绕过Vercel的请求体大小限制
2. **提高性能**: 客户端直接上传，减少服务器负载
3. **更好的用户体验**: 实时上传进度，无需等待服务器处理
4. **成本优化**: 减少Vercel函数调用次数
5. **可扩展性**: 支持更大的视频文件

## 测试方法

1. 访问 `/test-upload` 页面
2. 点击 "Test Configuration" 验证环境变量
3. 点击 "Test Video Upload" 测试视频上传
4. 访问 `/student/interview` 进行完整面试测试

## 注意事项

1. 需要配置Cloudinary的unsigned upload preset
2. 确保客户端可以访问Cloudinary API
3. 保持B2配置用于字幕元数据存储
4. 数据库保存通过轻量级API路由处理

## 回滚方案

如果遇到问题，可以通过以下方式回滚：

1. 在 `app/student/interview/page.tsx` 中将 `uploadSegmentVideosClient` 改回 `uploadSegmentVideos`
2. 恢复原有的服务器端合并流程
3. 确保Vercel配置支持更大的请求体大小

## 后续优化

1. 添加视频压缩选项
2. 实现断点续传
3. 添加上传重试机制
4. 优化错误处理和用户反馈

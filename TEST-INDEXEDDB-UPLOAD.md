# IndexedDB 断点续传功能测试指南

## 部署信息

- **分支**: `feature/indexeddb-upload-resume`
- **部署时间**: 2025-11-17
- **最新修复**: 2025-11-17 (修复 interviewId 恢复问题)
- **服务器**: Linode Athena
- **访问地址**: https://demo.vcnt.co

## 重要修复说明

### 修复: interviewId 恢复问题

**问题**: 页面刷新后，`interviewId` 会重新生成，导致无法匹配 IndexedDB 中的数据。

**解决方案**:
- `interviewId` 现在保存在 `localStorage` 中
- 页面加载时自动从 `localStorage` 恢复
- 如果当前 `interviewId` 没有未完成的上传，会检查所有未完成的上传
- 上传完成后自动清理 `localStorage` 中的 `interviewId`

**测试要点**:
- 刷新页面后应该能检测到未完成的上传
- 即使关闭浏览器重新打开，也应该能恢复

## 重要行为说明

### 未完成面试 vs 已完成面试

系统会区分两种情况：

1. **未完成面试**（例如：已录制 3/4 个问题）
   - 检测到后会提示："检测到未完成的面试（已录制 X/4 个问题）。是否继续完成面试？"
   - 点击"确定"后，会**继续录制下一个问题**，而不是直接上传
   - 只有完成所有问题后，才能进入提交页面

2. **已完成面试**（例如：已录制 4/4 个问题，但未上传）
   - 检测到后会提示："检测到 X 个未上传的视频片段，是否继续上传？"
   - 点击"确定"后，直接进入提交页面

这样可以确保用户不会上传不完整的面试。

## 测试场景

### 场景 1: 正常录制和上传流程

**目的**: 验证基本功能正常工作

**步骤**:
1. 访问面试链接: `https://demo.vcnt.co/student/interview?school=test`
2. 完成系统检查
3. 录制所有 4 个问题
4. 填写学生信息并提交
5. **验证**: 
   - 视频应该成功上传
   - 在 IndexedDB 中应该保存了视频片段（打开浏览器开发者工具 → Application → IndexedDB → interview-videos）
   - Dashboard 上应该显示面试记录

### 场景 2: 页面刷新恢复上传（未完成面试）

**目的**: 验证页面刷新后能继续完成未完成的面试

**步骤**:
1. 访问面试链接并开始录制
2. 录制 2-3 个问题后，**不要提交**
3. **刷新页面**（F5 或 Cmd+R）
4. **验证**: 
   - 应该弹出提示："检测到未完成的面试（已录制 X/4 个问题）。是否继续完成面试？"
   - 点击"确定"后，应该**继续录制下一个问题**，而不是直接进入上传页面
   - 完成所有 4 个问题后，才进入提交页面
   - 所有片段应该成功上传
   - **注意**: `interviewId` 应该从 `localStorage` 恢复（检查浏览器控制台日志）

**调试提示**:
- 打开浏览器控制台，应该看到: `[v0] Restored interviewId from localStorage: interview-xxx`
- 应该看到: `[v0] Resuming interview from question X`
- 如果看到这个日志，说明面试恢复成功，会从正确的问题继续

### 场景 3: 关闭页面后恢复上传（未完成面试）

**目的**: 验证关闭页面后重新打开能继续完成未完成的面试

**步骤**:
1. 访问面试链接并开始录制
2. 录制 2-3 个问题后，**关闭浏览器标签页**
3. 重新打开面试链接（相同的 URL）
4. **验证**: 
   - 应该检测到未完成的面试
   - 应该提示继续完成面试，而不是直接上传
   - 能够继续录制剩余的问题
   - 完成所有问题后，才能进入提交页面
   - `interviewId` 应该从 `localStorage` 恢复

**调试提示**:
- 检查 `localStorage` 中是否有 `currentInterviewId` 键
- 检查浏览器控制台日志，确认 `interviewId` 恢复成功
- 应该看到: `[v0] Resuming interview from question X`

### 场景 4: Dashboard 重新上传功能

**目的**: 验证管理员可以从 dashboard 重新上传中断的面试

**前置条件**: 
- 需要有一个上传中断的面试（可以通过场景 2 或 3 创建）

**步骤**:
1. 登录到 dashboard: `https://demo.vcnt.co/school/dashboard`
2. 找到没有 `video_url` 的面试（显示 "Processing" 状态）
3. 点击 "Resume Upload" 按钮
4. **验证**: 
   - 应该跳转到重新上传页面
   - 页面应该显示待上传的片段列表
   - 点击 "Resume Upload" 按钮后，应该能成功上传
   - 上传完成后应该自动跳转回 dashboard

### 场景 5: IndexedDB 存储验证

**目的**: 验证视频片段正确保存到 IndexedDB

**步骤**:
1. 录制几个问题后，打开浏览器开发者工具
2. 导航到: Application → IndexedDB → interview-videos → video-segments
3. **验证**: 
   - 应该能看到保存的视频片段记录
   - 每个记录应该包含: `id`, `interviewId`, `blob`, `uploaded` 等字段
   - `uploaded` 字段应该为 `false`（未上传时）

### 场景 6: 上传完成后清理

**目的**: 验证上传完成后 IndexedDB 数据被正确清理

**步骤**:
1. 完成一个完整的面试上传
2. 等待上传完成
3. 检查 IndexedDB
4. **验证**: 
   - 已上传的片段应该被清理（或 `uploaded` 字段为 `true`）

## 浏览器兼容性测试

### Chrome/Edge
- ✅ 应该完全支持
- 测试 IndexedDB 的读写操作

### Firefox
- ✅ 应该完全支持
- 测试 IndexedDB 的读写操作

### Safari
- ✅ 应该支持（iOS 10+）
- 注意：隐私模式下可能受限

### 移动浏览器
- ✅ Chrome Mobile
- ✅ Safari Mobile
- ⚠️ 注意存储空间限制

## 调试方法

### 1. 检查 IndexedDB 数据

```javascript
// 在浏览器控制台运行
const db = await new Promise((resolve, reject) => {
  const request = indexedDB.open('interview-videos', 1)
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const transaction = db.transaction(['video-segments'], 'readonly')
const store = transaction.objectStore('video-segments')
const request = store.getAll()
request.onsuccess = () => {
  console.log('All segments:', request.result)
}
```

### 2. 检查上传状态

```javascript
// 在浏览器控制台运行
const segments = await getPendingSegments('interview-xxx')
console.log('Pending segments:', segments)
```

### 3. 查看网络请求

- 打开开发者工具 → Network 标签
- 过滤 "upload" 或 "merge-videos"
- 检查上传请求是否成功

### 4. 查看服务器日志

```bash
ssh linode-Athena
cd /home/v0-interview/apps/v0-interview
docker compose -f docker-compose.linode.yml logs -f interview-app
```

## 常见问题排查

### 问题 1: IndexedDB 无法保存

**可能原因**:
- 浏览器隐私模式
- 存储空间不足
- 浏览器不支持 IndexedDB

**解决方法**:
- 检查浏览器控制台错误
- 尝试普通模式（非隐私模式）
- 检查浏览器存储空间

### 问题 2: 页面刷新后没有提示

**可能原因**:
- IndexedDB 中没有数据
- `interviewId` 不匹配

**解决方法**:
- 检查 IndexedDB 中是否有数据
- 确认 `interviewId` 是否一致

### 问题 3: 重新上传按钮不显示

**可能原因**:
- 面试已经有 `video_url`
- 面试记录不存在

**解决方法**:
- 检查数据库中的 `video_url` 字段
- 确认面试记录是否存在

## 测试检查清单

- [ ] 正常录制和上传流程
- [ ] 页面刷新恢复上传
- [ ] 关闭页面后恢复上传
- [ ] Dashboard 重新上传功能
- [ ] IndexedDB 存储验证
- [ ] 上传完成后清理
- [ ] Chrome 浏览器测试
- [ ] Firefox 浏览器测试
- [ ] Safari 浏览器测试
- [ ] 移动浏览器测试

## 预期结果

所有测试场景应该能够：
1. ✅ 成功保存视频片段到 IndexedDB
2. ✅ 页面刷新后能恢复上传
3. ✅ Dashboard 上能显示重新上传按钮
4. ✅ 重新上传功能正常工作
5. ✅ 上传完成后数据被正确清理

## 报告问题

如果发现问题，请提供：
1. 浏览器类型和版本
2. 操作系统
3. 复现步骤
4. 控制台错误信息
5. 网络请求详情


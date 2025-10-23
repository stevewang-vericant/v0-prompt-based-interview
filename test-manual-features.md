# 手动转录和摘要功能测试指南

## 测试步骤

### 1. 测试手动转录功能
1. 进入一个没有转录的面试页面
2. 点击 "Start Manual Transcription" 按钮
3. 观察控制台日志，应该看到：
   - `[Manual Transcription] Updating state with API response...`
   - `[Manual Transcription] State updated with API data`
4. 转录完成后，页面应该立即显示转录文本
5. 刷新页面，转录文本应该仍然存在

### 2. 测试手动摘要功能
1. 进入一个已完成转录但没有摘要的面试页面
2. 点击 "Generate Summary" 按钮
3. 观察控制台日志，应该看到：
   - `[Manual AI Summary] Updating state with API response...`
   - `[Manual AI Summary] State updated with API data`
4. 摘要生成后，页面应该立即显示摘要
5. 刷新页面，摘要应该仍然存在

### 3. 测试错误处理
1. 如果转录失败，数据库应该更新为 `failed` 状态
2. 错误信息应该存储在 `transcription_metadata` 中
3. 用户应该看到重试按钮

## 预期行为

- ✅ 手动生成的内容应该立即显示在 UI 中
- ✅ 刷新页面后内容应该持久存在
- ✅ 错误状态应该正确更新到数据库
- ✅ 控制台应该有详细的调试日志

## 调试信息

如果功能不正常，请检查：
1. 浏览器控制台的日志输出
2. 网络请求是否成功
3. 数据库中的状态是否正确更新

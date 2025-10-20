# 🔑 设置 Supabase Service Role Key

## 为什么需要这个？

我们修复了 RLS（Row Level Security）权限问题。服务器端的数据库操作现在使用 **Service Role Key**（管理员密钥）来绕过 RLS 限制，确保所有数据都能正确保存。

---

## ⚠️ 重要提醒

**Service Role Key** 拥有完全的数据库访问权限（绕过所有 RLS 策略）。
- ✅ **仅在服务器端使用**（Server Actions）
- ❌ **绝不暴露给客户端**
- ❌ **绝不提交到 Git**（已在 `.gitignore` 中）

---

## 步骤 1: 获取 Service Role Key

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`v0-prompt-based-interview`
3. 进入 **Settings** → **API**
4. 找到 **Project API keys** 部分
5. 复制 **`service_role`** 密钥（⚠️ 不是 `anon` 密钥）

```
格式：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi...
```

---

## 步骤 2: 本地开发环境设置

### 2.1 添加到 `.env.local`

在项目根目录的 `.env.local` 文件中添加：

```bash
# Supabase Service Role Key (服务器端使用，绕过 RLS)
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_密钥

# 确保这两个也存在（之前应该已经有了）
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_密钥
```

### 2.2 重启开发服务器

```bash
# 停止当前的 dev server (Ctrl+C)
# 然后重新启动
pnpm dev
```

---

## 步骤 3: Vercel 部署环境设置

### 3.1 添加环境变量

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目：`v0-prompt-based-interview`
3. 进入 **Settings** → **Environment Variables**
4. 点击 **Add New**

添加以下变量：

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `你的_service_role_密钥` | ✅ Production, ✅ Preview, ✅ Development |

### 3.2 重新部署

环境变量添加后，**必须重新部署**才能生效：

```bash
git push origin feature/ai-transcription
```

或者在 Vercel Dashboard 中点击 **Redeploy**。

---

## 步骤 4: 验证配置

### 本地验证

```bash
# 运行本地 dev server
pnpm dev

# 在浏览器中测试面试上传
# 查看 Console 是否还有 RLS 错误
```

### Vercel 验证

1. 等待 Preview 部署完成
2. 打开 Preview URL
3. 运行一次完整面试测试
4. 检查 Console 日志，应该看到：
   ```
   [DB] Saving interview to database...
   [DB] Interview saved/updated successfully: <uuid>  ✅
   ```

---

## 步骤 5: 数据库验证

在 Supabase SQL Editor 运行：

```sql
-- 应该看到 response_count = 4
SELECT 
  i.interview_id,
  i.student_email,
  i.subtitle_url,  -- ✅ 应该有值
  COUNT(ir.id) as response_count  -- ✅ 应该是 4
FROM interviews i
LEFT JOIN interview_responses ir ON ir.interview_id = i.id
GROUP BY i.id, i.interview_id, i.student_email, i.subtitle_url
ORDER BY i.created_at DESC
LIMIT 1;
```

**预期结果：**
- ✅ `subtitle_url`: 有 JSON URL
- ✅ `response_count`: 4

---

## 故障排查

### 问题 1: 本地测试时仍然有 RLS 错误

**解决方案：**
```bash
# 1. 确认 .env.local 中有 SUPABASE_SERVICE_ROLE_KEY
cat .env.local | grep SERVICE_ROLE

# 2. 重启 dev server
pnpm dev
```

### 问题 2: Vercel 部署后仍然有 RLS 错误

**解决方案：**
1. 检查 Vercel 环境变量是否正确设置
2. 确保变量应用到了 **Production** 和 **Preview** 环境
3. **重新部署**（仅添加变量不会自动重新部署）

### 问题 3: "Missing Supabase environment variables" 错误

**原因：** `SUPABASE_SERVICE_ROLE_KEY` 没有设置

**解决方案：** 按照步骤 2 或步骤 3 添加环境变量

---

## 🎯 完成检查清单

- [ ] 从 Supabase Dashboard 获取 Service Role Key
- [ ] 添加到本地 `.env.local` 文件
- [ ] 重启本地 dev server
- [ ] 本地测试面试上传（无 RLS 错误）
- [ ] 添加到 Vercel 环境变量（Production + Preview）
- [ ] 重新部署到 Vercel
- [ ] Preview 环境测试（无 RLS 错误）
- [ ] 数据库验证（response_count = 4, subtitle_url 有值）
- [ ] 播放器测试（能看到 4 个分段）

---

## 下一步

完成上述步骤后，你应该能够：
1. ✅ 上传 4 个独立的视频分段
2. ✅ 所有分段都保存到 `interview_responses` 表
3. ✅ subtitle metadata 正确生成并保存
4. ✅ 播放器能连续播放所有 4 个分段
5. ✅ AI 转录功能正常工作（针对每个分段）

如有问题，请查看：
- 浏览器 Console 日志
- Vercel 部署日志
- Supabase 数据库查询结果


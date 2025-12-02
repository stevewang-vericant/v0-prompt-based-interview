# Supabase 数据迁移指南

本文档记录了从 Supabase 到本地 PostgreSQL 的数据迁移过程。

## 迁移摘要

### 迁移时间
- **导出时间**: 2025-12-02
- **导入时间**: 2025-12-02

### 迁移数据统计

#### 生产环境导入结果
```
学校:     20 个 (跳过 1 个系统学校)
学生:     4 个 (自动创建)
邀请:     0 个
题目:     10 个
面试:     10 个
回答:     12 个
```

## 迁移的数据

### 1. 学校数据 (Schools)
- ✅ Harvard University (`harvard`)
- ✅ Massachusetts Institute of Technology (`mit`)
- ✅ Kimball Union Academy (`kimball-union`)
- ✅ Choate Rosemary Hall (`choate`)
- ✅ Episcopal High School (`episcopal`)
- ✅ Emma Willard School (`emma-willard`)
- ✅ The Pennington School (`pennington`)
- ✅ Governors Academy (`governors`)
- ✅ Pomfret School (`pomfret`)
- ✅ Berkshire School (`berkshire`)
- ✅ The Northwest School (`northwest`)
- ✅ Oregon Episcopal School (`oregon-episcopal`)
- ✅ Westover School (`westover`)
- ✅ Annie Wright Schools (`annie-wright`)
- ✅ The Webb School (`webb`)
- ✅ Cheshire Academy (`cheshire`)
- ✅ Christ School (`christ-school`)
- ✅ Chatham Hall (`chatham-hall`)
- ✅ The Governor's Academy (`governors-academy`)
- ✅ Vericant (`vericant`)

**注意**: 旧 Supabase 数据中学校没有 `email` 和 `password_hash` 字段，迁移时自动生成：
- **Email**: `admin@{school-code}.edu`
- **默认密码**: `changeme123`

### 2. 面试数据 (Interviews)
- ✅ 10 个已完成的面试记录
- ✅ 包含视频 URL、字幕、转录文本和 AI 摘要
- ✅ 所有面试状态为 `completed`
- ✅ 转录状态为 `completed`

### 3. 学生数据 (Students)
迁移时自动创建了 4 个学生账号：
- Brandon Woods (`brandon.woods@vericant.com`)
- Ryan Huang (`ryan.huang@vericant.com`)
- Ryan Huang (`ryan.huang@vercant.com`) - 注意拼写错误
- perfect fit (`Ryan.huang2@vericant.com`)

**默认密码**: 自动生成的临时密码（`temp_*`）

### 4. 题目数据 (Prompts)
- ✅ 10 个标准题目
- 类别包括:
  - Critical Thinking (4 个)
  - Conversational Fluency (3 个)
  - General Knowledge (3 个)

### 5. 面试回答 (Interview Responses)
- ✅ 12 个面试回答记录
- 包含视频 URL 和时长

## 迁移脚本

### 1. 导出脚本
```bash
# 从 Supabase 导出数据
NEXT_PUBLIC_SUPABASE_URL="..." \
SUPABASE_SERVICE_ROLE_KEY="..." \
node scripts/export-from-supabase.js
```

输出文件: `supabase-export-YYYY-MM-DD.json`

### 2. 导入脚本
```bash
# 导入到本地 PostgreSQL
node scripts/import-to-postgres.js supabase-export-YYYY-MM-DD.json
```

或在 Docker 容器中运行：
```bash
docker cp scripts/import-to-postgres.js container:/app/
docker cp supabase-export-YYYY-MM-DD.json container:/app/
docker exec container node import-to-postgres.js supabase-export-YYYY-MM-DD.json
```

## 迁移特性

### 自动处理
1. **学校账号生成**: 为没有 email 的学校自动生成登录凭据
2. **学生账号创建**: 为面试记录自动创建对应的学生账号
3. **关系修复**: 自动建立学校-学生-面试之间的外键关系
4. **重复检测**: 跳过已存在的记录，支持多次运行

### 数据转换
- 原 Supabase Schema → 新 Prisma Schema
- 补充缺失的必填字段 (`email`, `password_hash`)
- 统一时间戳格式
- 保留所有 UUID 和关系

## 未迁移的数据

- ❌ 学生注册的邀请记录（原数据库中为空）
- ❌ 超级管理员账号（保留新创建的 `super@admin.com`）
- ❌ 系统学校 (`_system`)

## 验证查询

### 检查学校
```sql
SELECT code, name, email FROM schools WHERE code IN ('harvard', 'mit', 'vericant');
```

### 检查面试
```sql
SELECT i.interview_id, s.name as student_name, sc.name as school_name, 
       i.status, i.transcription_status 
FROM interviews i 
JOIN students s ON i.student_id = s.id 
JOIN schools sc ON i.school_id = sc.id 
LIMIT 10;
```

### 统计数据
```sql
SELECT 
  (SELECT COUNT(*) FROM schools) as schools_count,
  (SELECT COUNT(*) FROM students) as students_count,
  (SELECT COUNT(*) FROM interviews) as interviews_count,
  (SELECT COUNT(*) FROM interview_responses) as responses_count,
  (SELECT COUNT(*) FROM prompts) as prompts_count;
```

## 迁移后操作

### 学校管理员需知
所有从 Supabase 迁移的学校账号默认密码为 `changeme123`，建议：

1. 首次登录后立即修改密码
2. 使用 email: `admin@{school-code}.edu`

### 示例登录
```
Harvard:    admin@harvard.edu / changeme123
MIT:        admin@mit.edu / changeme123
Vericant:   admin@vericant.edu / changeme123
```

## 故障排除

### 问题 1: 导入时提示 "email: undefined"
**原因**: Supabase 旧 schema 没有 email 字段  
**解决**: 脚本会自动生成 email，无需手动处理

### 问题 2: 学生 ID 为 null
**原因**: 面试记录中学生未注册  
**解决**: 脚本自动根据 `student_email` 创建学生账号

### 问题 3: Unique constraint failed
**原因**: 数据已存在  
**解决**: 脚本支持重复运行，会自动跳过已存在的记录

## 相关文件

- `scripts/export-from-supabase.js` - Supabase 数据导出脚本
- `scripts/import-to-postgres.js` - PostgreSQL 数据导入脚本
- `prisma/schema.prisma` - 新的数据库 Schema
- `MIGRATION-SUMMARY.md` - 代码迁移总结
- `SETUP-LOCAL-DB.md` - 本地数据库设置指南


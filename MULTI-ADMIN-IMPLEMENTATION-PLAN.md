# 多管理员账号实现方案

## 核心原则：**零影响现有用户**

### 1. 向后兼容策略

#### 1.1 数据库层面
- **保留 `School.email` 和 `School.password_hash` 字段**
  - 改为 `nullable`（允许为空）
  - **不删除现有数据**
  - **不修改现有密码**
  - 现有用户的数据完全保持不变

- **新增 `school_admins` 表**
  - 用于存储新的多管理员账号
  - 与 `School` 表并行存在
  - 不影响现有 `School` 表的数据

#### 1.2 认证逻辑层面（双重查找机制）

**登录流程 (`signIn`)**：
```
1. 首先查找 SchoolAdmin 表（新账号）
   ↓ 如果找到，使用 SchoolAdmin 认证
   
2. 如果没找到，查找 School 表（旧账号，向后兼容）
   ↓ 如果找到，使用 School 认证
   
3. 如果都没找到，返回错误
```

**关键点**：
- 现有用户（存储在 `School` 表）的登录逻辑**完全不变**
- 密码验证逻辑**完全不变**
- Session 创建逻辑**完全不变**
- 只是增加了新的查找路径

#### 1.3 Session 管理

**JWT Token 结构保持不变**：
```typescript
{
  sub: school.id,        // 仍然是 school.id（向后兼容）
  email: admin.email,   // 管理员 email
  role: 'school_admin',
  admin_id?: string     // 新增：如果是 SchoolAdmin，记录 admin_id
}
```

**`getCurrentUser` 逻辑**：
```
1. 从 JWT 中获取 school.id
2. 检查是否有 admin_id
   - 如果有：从 SchoolAdmin 表查找
   - 如果没有：从 School 表查找（向后兼容）
3. 返回用户信息
```

### 2. 数据迁移策略

#### 2.1 迁移现有账号（可选，不影响现有功能）

**时机**：在系统稳定运行后，可以逐步迁移

**方法**：
```sql
-- 为每个有 email 的 School 创建对应的 SchoolAdmin 记录
INSERT INTO school_admins (school_id, email, password_hash, name, active, is_super_admin)
SELECT 
  id,
  email,
  password_hash,
  contact_person,
  active,
  is_super_admin
FROM schools
WHERE email IS NOT NULL 
  AND password_hash IS NOT NULL
ON CONFLICT DO NOTHING;  -- 如果已存在，不覆盖
```

**重要**：
- 迁移是**可选的**，不影响现有功能
- 迁移后，用户仍然可以用原来的方式登录
- 可以逐步引导用户使用新账号

#### 2.2 不迁移的情况（完全向后兼容）

如果选择不迁移：
- 现有用户继续使用 `School` 表的账号
- 新注册的用户使用 `SchoolAdmin` 表
- 两套系统并行运行，互不干扰

### 3. 新功能实现

#### 3.1 注册逻辑 (`registerSchoolAdmin`)

**新逻辑**：
```
1. 检查学校是否存在
2. 检查 email 是否已注册（检查 SchoolAdmin 和 School 两个表）
3. 在 SchoolAdmin 表中创建新记录
4. 设置 active: false（需要审批）
```

**关键点**：
- **不再修改 `School` 表**
- **不再覆盖现有账号**
- 每个学校可以有多个管理员

#### 3.2 用户管理页面

**显示逻辑**：
```
1. 显示所有 SchoolAdmin（新账号）
2. 显示所有有 email 的 School（旧账号，标记为"Legacy"）
3. 统一管理界面
```

**操作**：
- 激活/停用：支持两种账号类型
- 删除：只删除 SchoolAdmin，不删除 School
- 重置密码：支持两种账号类型

### 4. 代码修改清单

#### 4.1 Schema 修改（已完成）
- ✅ 添加 `SchoolAdmin` 模型
- ✅ `School.email` 和 `password_hash` 改为 nullable

#### 4.2 数据库迁移脚本
- ✅ 创建 `school_admins` 表
- ✅ 创建索引
- ✅ 可选：迁移现有账号（不强制）

#### 4.3 认证逻辑修改

**`signIn` 函数**：
```typescript
// 伪代码
async function signIn(email, password) {
  // 1. 先查找 SchoolAdmin
  let admin = await prisma.schoolAdmin.findUnique({ where: { email } })
  
  if (admin) {
    // 新账号认证
    if (!admin.active) return error("Account pending approval")
    if (!verifyPassword(password, admin.password_hash)) return error("Invalid password")
    
    // 创建 session（包含 admin_id）
    return createSession({
      school_id: admin.school_id,
      admin_id: admin.id,
      email: admin.email
    })
  }
  
  // 2. 查找 School（向后兼容）
  let school = await prisma.school.findUnique({ where: { email } })
  
  if (school && school.email && school.password_hash) {
    // 旧账号认证（完全保持原有逻辑）
    if (!school.active) return error("Account pending approval")
    if (!verifyPassword(password, school.password_hash)) return error("Invalid password")
    
    // 创建 session（不包含 admin_id，表示旧账号）
    return createSession({
      school_id: school.id,
      email: school.email
    })
  }
  
  return error("Invalid email or password")
}
```

**`getCurrentUser` 函数**：
```typescript
// 伪代码
async function getCurrentUser() {
  const token = getSessionToken()
  const { school_id, admin_id } = decodeToken(token)
  
  if (admin_id) {
    // 新账号：从 SchoolAdmin 查找
    const admin = await prisma.schoolAdmin.findUnique({
      where: { id: admin_id },
      include: { school: true }
    })
    return { admin, school: admin.school }
  } else {
    // 旧账号：从 School 查找（向后兼容）
    const school = await prisma.school.findUnique({
      where: { id: school_id }
    })
    return { school, admin: null }
  }
}
```

**`registerSchoolAdmin` 函数**：
```typescript
// 伪代码
async function registerSchoolAdmin(email, password, name, schoolId) {
  // 1. 检查学校是否存在
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) return error("School not found")
  
  // 2. 检查 email 是否已注册（检查两个表）
  const existingAdmin = await prisma.schoolAdmin.findUnique({ where: { email } })
  if (existingAdmin) return error("Email already registered")
  
  const existingSchool = await prisma.school.findUnique({ where: { email } })
  if (existingSchool) return error("Email already registered")
  
  // 3. 创建新管理员（只创建 SchoolAdmin，不修改 School）
  await prisma.schoolAdmin.create({
    data: {
      school_id: schoolId,
      email,
      password_hash: hashPassword(password),
      name,
      active: false,  // 需要审批
      is_super_admin: false
    }
  })
  
  return success()
}
```

#### 4.4 其他需要修改的地方

1. **`getSchools`**：返回所有学校（用于注册选择）
2. **`changePassword`**：支持两种账号类型
3. **用户管理页面**：显示和管理两种账号
4. **所有使用 `getCurrentUser` 的地方**：需要适配新的返回结构

### 5. 测试计划

#### 5.1 向后兼容测试
- ✅ 现有用户（School 表）可以正常登录
- ✅ 现有用户的密码不变
- ✅ 现有用户的 Session 仍然有效
- ✅ 现有用户的所有功能正常

#### 5.2 新功能测试
- ✅ 新用户可以注册（创建 SchoolAdmin）
- ✅ 新用户可以登录
- ✅ 一个学校可以有多个管理员
- ✅ 超级管理员可以管理所有管理员账号

#### 5.3 边界情况测试
- ✅ Email 冲突检测（两个表都检查）
- ✅ 学校不存在的情况
- ✅ 账号未激活的情况
- ✅ Session 过期的情况

### 6. 部署策略

#### 6.1 阶段 1：数据库迁移（不影响现有功能）
1. 执行 SQL 脚本创建 `school_admins` 表
2. 修改 `School.email` 和 `password_hash` 为 nullable
3. **不迁移现有数据**（保持原样）

#### 6.2 阶段 2：代码部署（向后兼容）
1. 部署新代码（支持双重查找）
2. 现有用户**完全不受影响**
3. 新注册功能开始使用 `SchoolAdmin` 表

#### 6.3 阶段 3：数据迁移（可选，后续进行）
1. 在系统稳定后，逐步迁移现有账号
2. 引导用户使用新账号
3. 最终可以废弃 `School` 表的认证功能（但保留数据）

### 7. 风险控制

#### 7.1 数据安全
- ✅ **不删除任何现有数据**
- ✅ **不修改任何现有密码**
- ✅ **不修改任何现有账号状态**

#### 7.2 功能安全
- ✅ **现有用户登录逻辑完全不变**
- ✅ **现有 Session 仍然有效**
- ✅ **所有现有功能继续工作**

#### 7.3 回滚方案
如果出现问题：
1. 回滚代码到旧版本（现有用户仍然可以登录）
2. 新注册的用户暂时无法登录（但不影响现有用户）
3. 数据库表可以保留（不影响现有数据）

### 8. 总结

**核心保证**：
1. ✅ **现有用户账号完全不受影响**
2. ✅ **现有密码完全不变**
3. ✅ **现有登录功能完全正常**
4. ✅ **新功能与旧功能并行运行**
5. ✅ **可以随时回滚**

**实现方式**：
- 双重查找机制（先查新表，再查旧表）
- 向后兼容的 Session 管理
- 不修改现有数据的迁移策略

**下一步**：
1. 确认方案是否符合要求
2. 开始实现代码修改
3. 测试向后兼容性
4. 部署到生产环境

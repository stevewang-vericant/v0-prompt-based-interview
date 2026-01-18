# 学校注册账号自动消失问题分析报告

## 问题描述
在 production 上，通过 signup page 创建的学校账号过一段时间后会自动消失。

## 根本原因分析

### 1. 注册流程的问题

**文件**: `app/actions/auth.ts`

**问题代码** (第 112-124 行):
```typescript
if (schoolId) {
  await prisma.school.update({
    where: { id: schoolId },
    data: {
      email,                    // ⚠️ 覆盖原来的 email
      password_hash: hashedPassword,  // ⚠️ 覆盖原来的密码
      contact_person: name,
      active: false             // ⚠️ 设置为未激活
    }
  })
}
```

### 2. 问题场景

当用户通过注册页面 (`/school/register`) 注册时：

1. **注册页面显示所有学校** (`getSchools()` 函数返回所有学校，包括已经有管理员的学校)
2. **用户选择一个已存在的学校** (例如：学校 A，已有管理员 email: `admin@schoolA.edu`)
3. **用户输入新的 email** (例如：`user@schoolA.edu`)
4. **注册逻辑执行**：
   - 检查新 email 是否已存在（第 100-106 行）- 如果不存在，继续
   - **更新学校 A 的 email 为新 email** (`user@schoolA.edu`) - **覆盖原来的 email**
   - **更新密码** - **覆盖原来的密码**
   - **设置 `active: false`** - 新注册的用户无法登录

### 3. 导致"消失"的原因

**情况 A：覆盖已有管理员的账号**
- 学校 A 原来有管理员：`admin@schoolA.edu`
- 新用户注册：选择学校 A，输入 `user@schoolA.edu`
- 结果：
  - 学校 A 的 email 被更新为 `user@schoolA.edu`
  - 原来的管理员 (`admin@schoolA.edu`) **无法登录**（email 变了）
  - 新注册的用户 (`user@schoolA.edu`) **无法登录**（active: false）
  - **从用户角度看，账号"消失"了**

**情况 B：重复注册同一学校**
- 用户 A 注册学校 B，设置 email: `userA@schoolB.edu`，active: false
- 用户 B 再次注册学校 B，设置 email: `userB@schoolB.edu`
- 结果：
  - 学校 B 的 email 被更新为 `userB@schoolB.edu`
  - 用户 A 的账号 (`userA@schoolB.edu`) **无法登录**（email 变了）
  - 用户 B 的账号 (`userB@schoolB.edu`) **无法登录**（active: false）

### 4. 代码逻辑缺陷

**`getSchools()` 函数** (第 38-63 行):
```typescript
export async function getSchools(): Promise<{
  success: boolean
  schools?: School[]
  error?: string
}> {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    // ⚠️ 问题：返回所有学校，包括已经有管理员的学校
    return { success: true, schools }
  }
}
```

**应该只返回**：
- 还没有管理员的学校（email 为空或 null）
- 或者已经有管理员但未激活的学校（active: false）

**`registerSchoolAdmin()` 函数** (第 112-124 行):
```typescript
if (schoolId) {
  await prisma.school.update({
    where: { id: schoolId },
    data: {
      email,                    // ⚠️ 直接覆盖，没有检查学校是否已有管理员
      password_hash: hashedPassword,
      contact_person: name,
      active: false
    }
  })
}
```

**应该检查**：
- 学校是否已经有管理员（email 不为空）
- 如果已有管理员，应该返回错误或提示
- 或者只允许更新未激活的学校

## 数据库状态检查

根据 production 数据库查询：
- 总共有 347 个学校
- 所有学校都有 email（没有 email 为空的学校）
- 所有学校都是 active: true（没有 inactive 的学校）

这说明：
1. 所有学校都已经有管理员账号
2. 新用户注册时，会覆盖已有管理员的 email
3. 导致原来的管理员无法登录

## 建议的修复方案

### 方案 1：只允许注册没有管理员的学校（推荐）

1. **修改 `getSchools()`**：只返回还没有管理员的学校
   ```typescript
   const schools = await prisma.school.findMany({
     where: {
       OR: [
         { email: null },
         { email: '' },
         { active: false }  // 或者允许重新注册未激活的账号
       ]
     },
     select: {
       id: true,
       name: true,
       email: true
     },
     orderBy: {
       name: 'asc'
     }
   })
   ```

2. **修改 `registerSchoolAdmin()`**：检查学校是否已有管理员
   ```typescript
   const school = await prisma.school.findUnique({
     where: { id: schoolId },
     select: { id: true, email: true, active: true }
   })
   
   if (!school) {
     return { success: false, error: "School not found" }
   }
   
   // 如果学校已有管理员且已激活，不允许注册
   if (school.email && school.email !== '' && school.active) {
     return { success: false, error: "This school already has an active administrator. Please contact support." }
   }
   
   // 只允许注册没有管理员的学校或未激活的学校
   await prisma.school.update({
     where: { id: schoolId },
     data: {
       email,
       password_hash: hashedPassword,
       contact_person: name,
       active: false
     }
   })
   ```

### 方案 2：支持多管理员（需要修改数据库结构）

如果需要支持一个学校多个管理员，需要：
1. 创建 `school_admins` 表
2. 修改注册逻辑，创建新的管理员记录而不是更新学校记录
3. 修改登录逻辑，支持多个管理员账号

## 总结

**问题根源**：
- 注册页面显示所有学校（包括已有管理员的学校）
- 注册逻辑直接覆盖已有管理员的 email 和密码
- 没有检查学校是否已有管理员

**影响**：
- 已有管理员的账号被覆盖，无法登录
- 新注册的账号也无法登录（active: false）
- 从用户角度看，账号"消失"了

**修复优先级**：**高** - 这是一个严重的数据完整性问题

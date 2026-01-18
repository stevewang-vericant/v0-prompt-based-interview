# 多管理员功能测试指南

## 已完成的修改

### 1. 数据库 Schema
- ✅ 添加了 `SchoolAdmin` 模型
- ✅ `School.email` 和 `password_hash` 改为 nullable（向后兼容）

### 2. 认证逻辑
- ✅ `signIn`: 支持双重查找（先查 SchoolAdmin，再查 School）
- ✅ `getCurrentUser`: 支持两种账号类型
- ✅ `registerSchoolAdmin`: 创建 SchoolAdmin 记录，不修改 School
- ✅ `changePassword`: 支持两种账号类型

### 3. 用户管理
- ✅ `listUsers`: 显示所有管理员（SchoolAdmin + School）
- ✅ `activateUser`: 支持两种账号类型
- ✅ `deactivateUser`: 支持两种账号类型
- ✅ `resetUserPassword`: 支持两种账号类型

### 4. 数据库迁移脚本
- ✅ 创建 `school_admins` 表
- ✅ 不迁移现有数据（保持原样）

## 测试步骤

### 1. 数据库迁移

```bash
# 连接到本地数据库
# 执行迁移脚本
psql -U postgres -d v0_interview -f scripts/260118_add_school_admins_table.sql
```

或者如果使用 Docker：

```bash
docker compose exec postgres psql -U postgres -d v0_interview -f /path/to/scripts/260118_add_school_admins_table.sql
```

### 2. 测试现有用户登录（向后兼容）

**目标**：确保现有用户（School 表）仍然可以正常登录

1. 使用现有的账号（存储在 `School` 表）登录
2. 验证：
   - ✅ 可以成功登录
   - ✅ 密码验证正常
   - ✅ Session 创建正常
   - ✅ 可以访问所有功能

### 3. 测试新用户注册

**目标**：验证新注册的用户创建 SchoolAdmin 记录，不修改 School

1. 访问 `/school/register`
2. 选择一个学校（例如：Harvard）
3. 输入新的 email（例如：`newadmin@harvard.edu`）
4. 填写注册信息并提交
5. 验证：
   - ✅ 注册成功
   - ✅ 在 `school_admins` 表中创建了新记录
   - ✅ `School` 表没有被修改
   - ✅ 账号状态为 `active: false`（需要审批）

### 4. 测试新用户登录（未激活）

**目标**：验证未激活的新用户无法登录

1. 使用新注册的账号尝试登录
2. 验证：
   - ✅ 显示"Account pending approval"错误
   - ✅ 无法登录

### 5. 测试超级管理员激活新用户

**目标**：验证超级管理员可以激活新注册的用户

1. 使用超级管理员账号登录
2. 访问 `/school/users`
3. 在"Pending Approvals"部分找到新注册的用户
4. 点击"Activate"按钮
5. 验证：
   - ✅ 用户被激活
   - ✅ 用户状态变为 `active: true`
   - ✅ 用户从"Pending Approvals"移到"All Users"

### 6. 测试新用户登录（已激活）

**目标**：验证激活后的新用户可以正常登录

1. 使用已激活的新账号登录
2. 验证：
   - ✅ 可以成功登录
   - ✅ Session 包含 `admin_id`
   - ✅ 可以访问所有功能

### 7. 测试多管理员

**目标**：验证一个学校可以有多个管理员

1. 为同一个学校注册第二个管理员（例如：`admin2@harvard.edu`）
2. 激活第二个管理员
3. 验证：
   - ✅ 两个管理员都可以登录
   - ✅ 两个管理员都属于同一个学校
   - ✅ 在用户管理页面可以看到两个管理员

### 8. 测试用户管理功能

**目标**：验证用户管理功能对两种账号类型都有效

1. **激活/停用**：
   - 激活一个 SchoolAdmin 账号
   - 停用一个 SchoolAdmin 账号
   - 激活一个 School 账号（旧账号）
   - 停用一个 School 账号（旧账号）

2. **重置密码**：
   - 重置 SchoolAdmin 账号密码
   - 重置 School 账号密码
   - 验证新密码可以登录

3. **删除用户**：
   - 删除一个 SchoolAdmin 账号（注意：删除 SchoolAdmin 不会删除 School）
   - 验证删除后无法登录

### 9. 测试 Email 冲突检测

**目标**：验证注册时正确检测 email 冲突

1. 尝试使用已存在的 email（在 SchoolAdmin 表中）注册
2. 尝试使用已存在的 email（在 School 表中）注册
3. 验证：
   - ✅ 显示"Email already registered"错误
   - ✅ 注册失败

### 10. 测试修改密码

**目标**：验证两种账号类型都可以修改密码

1. 使用 SchoolAdmin 账号登录，修改密码
2. 使用 School 账号登录，修改密码
3. 验证：
   - ✅ 密码修改成功
   - ✅ 可以使用新密码登录

## 预期结果

### 向后兼容性
- ✅ 所有现有用户（School 表）可以正常登录
- ✅ 现有用户的密码和账号状态不变
- ✅ 现有功能完全正常

### 新功能
- ✅ 新注册的用户创建 SchoolAdmin 记录
- ✅ 一个学校可以有多个管理员
- ✅ 新注册的用户需要审批才能激活
- ✅ 用户管理页面显示所有管理员（新+旧）

## 注意事项

1. **数据安全**：
   - 现有数据不会被修改
   - 现有密码不会被改变
   - 现有账号状态不会被改变

2. **Session 兼容性**：
   - 旧账号的 Session 不包含 `admin_id`
   - 新账号的 Session 包含 `admin_id`
   - 两种 Session 都可以正常工作

3. **用户管理**：
   - 用户管理页面会显示两种类型的账号
   - 可以通过 `type` 字段区分账号类型
   - 所有管理操作都支持两种类型

## 如果遇到问题

1. **现有用户无法登录**：
   - 检查 `School` 表的 `email` 和 `password_hash` 是否仍然存在
   - 检查登录逻辑是否正确查找 School 表

2. **新用户无法注册**：
   - 检查 `school_admins` 表是否创建成功
   - 检查 Prisma Client 是否已重新生成

3. **用户管理页面错误**：
   - 检查 `listUsers` 是否正确合并两种类型的用户
   - 检查 `userType` 参数是否正确传递

# Staging 学校注册测试

## 测试环境
- **环境**: Staging
- **URL**: https://staging.guided.vericant.com
- **日期**: 2026-06-30

## 测试目的
在 Staging 环境测试新学校用户注册流程，选择 Vericant 学校。

## 测试账号信息

```
Email:    test-user-1782842904256@vericant.com
Password: TestPass123!
Name:     Test User 1782842904256
School:   Vericant
```

## 测试步骤

### 1. 注册新用户

1. 打开浏览器访问注册页面:
   ```
   https://staging.guided.vericant.com/school/register
   ```

2. 填写注册表单:
   - **School level**: 选择 "Higher Education" 或 "K-12"
   - **School**: 在搜索框输入 "vericant" 并从下拉列表选择 "Vericant"
   - **Your Name**: `Test User 1782842904256`
   - **Email**: `test-user-1782842904256@vericant.com`
   - **Password**: `TestPass123!`
   - **Confirm Password**: `TestPass123!`

3. 点击 "Create Account" 按钮

4. **预期结果**:
   - 显示成功消息: "Registration Successful!"
   - 提示信息: "Your account has been created and is pending approval"
   - 3 秒后自动跳转到登录页面

### 2. 验证数据库中的记录

SSH 登录到 Staging 服务器验证账号已创建:

```bash
ssh guided-staging
su - v0-interview
cd /home/v0-interview/apps/v0-interview
docker compose -f docker-compose.linode.yml exec -T interview-db \
  psql -U postgres -d postgres -c \
  "SELECT id, email, name, active, is_super_admin, school_id, created_at 
   FROM school_admins 
   WHERE email = 'test-user-1782842904256@vericant.com';"
```

**预期结果**:
- 记录存在
- `active` 字段为 `false` (需要管理员激活)
- `is_super_admin` 字段为 `false`
- `school_id` 关联到 Vericant 学校

### 3. 激活账号 (超级管理员操作)

1. 使用超级管理员账号登录:
   ```
   https://staging.guided.vericant.com/school/login
   ```

2. 进入用户管理页面:
   ```
   https://staging.guided.vericant.com/school/users
   ```

3. 找到新注册的用户 `test-user-1782842904256@vericant.com`

4. 点击 "Activate" 按钮激活账号

5. **预期结果**:
   - 账号状态变为 Active
   - 用户可以正常登录

### 4. 测试登录

1. 访问登录页面:
   ```
   https://staging.guided.vericant.com/school/login
   ```

2. 使用测试账号登录:
   - **Email**: `test-user-1782842904256@vericant.com`
   - **Password**: `TestPass123!`

3. **预期结果**:
   - 成功登录
   - 跳转到学校 Dashboard
   - 显示 Vericant 学校信息

## 关键功能测试点

### ✓ 注册流程
- [ ] School level 选择功能
- [ ] School 搜索功能 (至少输入2个字符)
- [ ] Vericant 学校可以搜索到并选择
- [ ] 表单验证 (必填字段、密码长度、密码确认)
- [ ] 注册成功提示
- [ ] 自动跳转到登录页面

### ✓ 数据验证
- [ ] SchoolAdmin 记录创建成功
- [ ] school_id 正确关联到 Vericant
- [ ] active 默认为 false
- [ ] is_super_admin 默认为 false
- [ ] 密码正确加密存储

### ✓ 账号激活
- [ ] 未激活账号无法登录
- [ ] 激活后可以正常登录

### ✓ 登录测试
- [ ] 激活后可以使用邮箱和密码登录
- [ ] 登录后显示正确的学校信息
- [ ] Session 正常工作

## 测试注意事项

1. **账号激活**: 新注册的账号默认 `active=false`, 需要超级管理员激活才能登录
2. **邮箱唯一性**: 每次测试使用不同的时间戳生成唯一邮箱
3. **学校选择**: Vericant 学校在数据库中应该存在 (code='vericant')
4. **密码要求**: 至少6个字符

## 技术实现细节

### 注册流程 (registerSchoolAdmin)
- 文件: `app/actions/auth.ts`
- 功能:
  1. 检查学校是否存在
  2. 检查邮箱是否已被注册 (SchoolAdmin 和 School 表)
  3. 密码加密 (bcrypt)
  4. 创建 SchoolAdmin 记录 (active=false)
  5. 发送管理员通知邮件 (如果配置了 SIGNUP_APPROVAL_NOTIFICATION_RECIPIENTS)

### 登录流程 (signIn)
- 支持双重查找:
  1. 先查找 SchoolAdmin (新账号系统)
  2. 再查找 School (旧账号系统，向后兼容)
- 验证 active 状态
- 创建 JWT session
- 存储在 HttpOnly Cookie

## 生成的文件

测试过程中生成的文件:

1. **test-credentials.txt** - 测试账号信息
2. **test-staging-registration-guide.js** - 测试指南生成器
3. **test-staging-registration-automated.js** - 自动化测试脚本
4. **test-staging-registration.sh** - Shell 测试脚本 (需要 API 支持)
5. **STAGING-REGISTRATION-TEST.md** - 本文档

## 清理测试数据

测试完成后，如需清理测试数据:

```bash
ssh guided-staging
su - v0-interview
cd /home/v0-interview/apps/v0-interview
docker compose -f docker-compose.linode.yml exec -T interview-db \
  psql -U postgres -d postgres -c \
  "DELETE FROM school_admins WHERE email LIKE 'test-user-%@vericant.com';"
```

## 相关文件

- 注册页面: `app/school/register/page.tsx`
- 认证逻辑: `app/actions/auth.ts`
- 数据库 Schema: `prisma/schema.prisma`
- 部署文档: `.cursor/rules/deployment.mdc`

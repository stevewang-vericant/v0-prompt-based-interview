# Staging 注册测试 - 快速指南

## 🎯 测试任务
在 Staging 环境注册一个新的学校用户，选择 Vericant 学校。

## 📋 测试账号 (已生成)

```
邮箱:     test-user-1782842904256@vericant.com
密码:     TestPass123!
姓名:     Test User 1782842904256
学校:     Vericant
```

## 🚀 快速测试步骤

### 步骤 1: 打开注册页面
```
https://staging.guided.vericant.com/school/register
```

### 步骤 2: 填写表单
1. **School level**: 选择 "Higher Education" 或 "K-12"
2. **School**: 输入 "vericant" → 从列表选择 "Vericant"
3. **Your Name**: Test User 1782842904256
4. **Email**: test-user-1782842904256@vericant.com
5. **Password**: TestPass123!
6. **Confirm Password**: TestPass123!

### 步骤 3: 提交注册
点击 "Create Account" 按钮

### 步骤 4: 验证成功
- ✅ 看到成功消息
- ✅ 提示"账号待审核"
- ✅ 3秒后跳转到登录页

### 步骤 5: 激活账号
1. 以超级管理员身份登录
2. 访问: https://staging.guided.vericant.com/school/users
3. 找到新用户并点击 "Activate"

### 步骤 6: 测试登录
使用上面的邮箱和密码登录，确认可以正常访问。

## ✅ 预期结果

- ✓ 注册成功
- ✓ 数据库中创建了 SchoolAdmin 记录
- ✓ 账号关联到 Vericant 学校
- ✓ 初始状态为 inactive (需要激活)
- ✓ 激活后可以正常登录

## 📁 相关文件

所有测试文件已生成:
- `test-credentials.txt` - 账号信息
- `STAGING-REGISTRATION-TEST.md` - 详细测试文档
- `test-staging-registration-automated.js` - 自动化脚本

---

**注意**: 由于 Next.js Server Actions 需要浏览器上下文，目前需要手动在浏览器中完成注册。测试账号已经生成好了，直接复制使用即可。

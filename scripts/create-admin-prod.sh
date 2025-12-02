#!/bin/bash
# 在生产环境（Docker）中创建管理员账号

set -e

echo "==================================="
echo "创建生产环境管理员账号"
echo "==================================="
echo ""

# 检查是否在项目目录
if [ ! -f "docker-compose.linode.yml" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 获取用户输入
read -p "学校名称: " SCHOOL_NAME
read -p "学校代码 (用于面试链接): " SCHOOL_CODE
read -p "管理员邮箱: " ADMIN_EMAIL
read -sp "管理员密码: " ADMIN_PASSWORD
echo ""
read -p "是否为超级管理员? (y/n): " IS_SUPER_ADMIN

if [ "$IS_SUPER_ADMIN" = "y" ] || [ "$IS_SUPER_ADMIN" = "Y" ]; then
    IS_SUPER_ADMIN="true"
else
    IS_SUPER_ADMIN="false"
fi

echo ""
echo "正在创建管理员账号..."

# 在 Docker 容器中运行 Node 脚本
docker compose -f docker-compose.linode.yml exec -T interview-app node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('$ADMIN_PASSWORD', 10);
  
  const school = await prisma.school.upsert({
    where: { email: '$ADMIN_EMAIL' },
    update: {
      name: '$SCHOOL_NAME',
      code: '$SCHOOL_CODE',
      password_hash: hashedPassword,
      is_super_admin: $IS_SUPER_ADMIN,
    },
    create: {
      name: '$SCHOOL_NAME',
      code: '$SCHOOL_CODE',
      email: '$ADMIN_EMAIL',
      password_hash: hashedPassword,
      is_super_admin: $IS_SUPER_ADMIN,
    },
  });
  
  console.log('✅ 管理员账号创建成功！');
  console.log('学校:', school.name);
  console.log('代码:', school.code);
  console.log('邮箱:', school.email);
  console.log('超级管理员:', school.is_super_admin);
}

main()
  .then(async () => {
    await prisma.\$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 创建失败:', e.message);
    await prisma.\$disconnect();
    process.exit(1);
  });
"

echo ""
echo "==================================="
echo "✅ 完成！"
echo "==================================="


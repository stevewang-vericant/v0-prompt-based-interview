const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()

/**
 * 检查用户密码状态，不修改密码
 * 用于诊断密码问题
 */
async function main() {
  const email = process.argv[2] || 'super@admin.com'
  const testPassword = process.argv[3] || 'asdf123!'
  
  console.log(`\n🔍 检查密码状态: ${email}`)
  console.log('='.repeat(60))
  
  const school = await prisma.school.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      code: true,
      is_super_admin: true,
      active: true,
      password_hash: true,
      created_at: true,
      updated_at: true
    }
  })
  
  if (!school) {
    console.log(`❌ 用户不存在: ${email}`)
    return
  }
  
  console.log(`✅ 用户信息:`)
  console.log(`   名称: ${school.name}`)
  console.log(`   代码: ${school.code}`)
  console.log(`   超级管理员: ${school.is_super_admin ? '是' : '否'}`)
  console.log(`   状态: ${school.active ? '激活' : '未激活'}`)
  console.log(`   创建时间: ${school.created_at}`)
  console.log(`   更新时间: ${school.updated_at}`)
  
  console.log(`\n🔐 密码验证:`)
  console.log(`   测试密码: ${testPassword}`)
  
  const isValid = await bcrypt.compare(testPassword, school.password_hash)
  
  if (isValid) {
    console.log(`   ✅ 密码验证成功！`)
  } else {
    console.log(`   ❌ 密码验证失败！`)
    console.log(`\n💡 可能的原因:`)
    console.log(`   1. 密码不正确`)
    console.log(`   2. 密码哈希被意外覆盖`)
    console.log(`   3. 数据库中的密码哈希损坏`)
    console.log(`\n🔧 解决方案:`)
    console.log(`   如果需要重置密码，运行:`)
    console.log(`   node scripts/create-super-admin.js --force`)
  }
  
  console.log(`\n📊 密码哈希信息:`)
  console.log(`   哈希前缀: ${school.password_hash.substring(0, 30)}...`)
  console.log(`   哈希长度: ${school.password_hash.length}`)
  console.log(`   哈希格式: ${school.password_hash.startsWith('$2b$') ? 'bcrypt (正确)' : '未知格式'}`)
  
  console.log('\n' + '='.repeat(60))
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


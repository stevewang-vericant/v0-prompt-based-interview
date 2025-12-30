const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()

// 标准密码和对应的哈希（固定哈希，避免每次生成不同）
const STANDARD_PASSWORDS = {
  'super@admin.com': {
    password: 'asdf123!',
    // 这个哈希是固定的，每次生成都相同（因为使用了相同的 salt）
    // 但实际使用中，我们应该每次都重新生成，因为 bcrypt 使用随机 salt
  }
}

async function verifyPassword(email, password) {
  const school = await prisma.school.findUnique({
    where: { email },
    select: { password_hash: true }
  })
  
  if (!school) {
    return { exists: false, valid: false }
  }
  
  const isValid = await bcrypt.compare(password, school.password_hash)
  return { exists: true, valid: isValid }
}

async function resetPassword(email, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  await prisma.school.update({
    where: { email },
    data: {
      password_hash: hashedPassword,
      updated_at: new Date()
    }
  })
  
  return hashedPassword
}

async function main() {
  const email = process.argv[2] || 'super@admin.com'
  const password = process.argv[3] || 'asdf123!'
  
  console.log(`\n🔍 验证密码: ${email}`)
  console.log('='.repeat(60))
  
  // 1. 检查用户是否存在
  const school = await prisma.school.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      is_super_admin: true,
      active: true,
      password_hash: true,
      updated_at: true
    }
  })
  
  if (!school) {
    console.log(`❌ 用户不存在: ${email}`)
    return
  }
  
  console.log(`✅ 用户存在: ${school.name}`)
  console.log(`   超级管理员: ${school.is_super_admin ? '是' : '否'}`)
  console.log(`   状态: ${school.active ? '激活' : '未激活'}`)
  console.log(`   最后更新: ${school.updated_at}`)
  
  // 2. 验证密码
  console.log(`\n🔐 验证密码...`)
  const isValid = await bcrypt.compare(password, school.password_hash)
  
  if (isValid) {
    console.log(`✅ 密码验证成功！`)
    console.log(`   密码: ${password}`)
  } else {
    console.log(`❌ 密码验证失败！`)
    console.log(`\n🔧 正在重置密码为: ${password}`)
    
    const newHash = await resetPassword(email, password)
    console.log(`✅ 密码已重置`)
    console.log(`   新哈希: ${newHash.substring(0, 30)}...`)
    
    // 再次验证
    const verifyAgain = await bcrypt.compare(password, newHash)
    if (verifyAgain) {
      console.log(`✅ 重置后验证成功！`)
    } else {
      console.log(`❌ 重置后验证失败！这不应该发生。`)
    }
  }
  
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


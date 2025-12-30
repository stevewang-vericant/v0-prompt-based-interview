const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'super@admin.com';
    const password = 'asdf123!';
    
    // Check if user already exists
    const existing = await prisma.school.findUnique({
      where: { email }
    });
    
    if (existing) {
      console.log(`⚠️  User ${email} already exists!`);
      
      // 检查密码是否正确
      const passwordValid = await bcrypt.compare(password, existing.password_hash);
      
      if (passwordValid) {
        console.log('✅ Password is correct, only updating admin status...');
        // 只更新管理员状态，不修改密码
        await prisma.school.update({
          where: { email },
          data: {
            is_super_admin: true,
            active: true
          }
        });
        console.log(`✅ Updated ${email} to super admin (password unchanged)`);
      } else {
        console.log('⚠️  Password mismatch. Use --force flag to reset password.');
        console.log('   To reset password, run: node scripts/create-super-admin.js --force');
        // 默认不重置密码，除非明确指定
        if (process.argv.includes('--force')) {
          console.log('🔄 Force flag detected, resetting password...');
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          
          await prisma.school.update({
            where: { email },
            data: {
              password_hash: hashedPassword,
              is_super_admin: true,
              active: true
            }
          });
          
          console.log(`✅ Updated ${email} to super admin with new password`);
        } else {
          // 只更新管理员状态
          await prisma.school.update({
            where: { email },
            data: {
              is_super_admin: true,
              active: true
            }
          });
          console.log(`✅ Updated ${email} to super admin (password unchanged)`);
        }
      }
    } else {
      console.log(`Creating new super admin: ${email}`);
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      await prisma.school.create({
        data: {
          email: email,
          name: 'Super Admin',
          code: 'super-admin',
          password_hash: hashedPassword,
          is_super_admin: true,
          active: true,
          credits_balance: 0
        }
      });
      
      console.log(`✅ Created super admin: ${email}`);
    }
    
    // Verify
    const user = await prisma.school.findUnique({
      where: { email },
      select: {
        email: true,
        name: true,
        is_super_admin: true,
        active: true
      }
    });
    
    console.log('\n✅ Verification:');
    console.table([user]);
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();


const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@example.com'
  const password = 'password123'
  const hashedPassword = await hash(password, 10)

  try {
    const school = await prisma.school.create({
      data: {
        name: 'Demo School',
        code: 'demo',
        email: email,
        password_hash: hashedPassword,
        contact_person: 'Admin User',
        active: true,
        is_super_admin: true,
        credits_balance: 100
      }
    })
    console.log(`Created school admin: ${email} / ${password}`)
  } catch (e) {
    if (e.code === 'P2002') {
      console.log(`User ${email} already exists.`)
    } else {
      console.error(e)
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


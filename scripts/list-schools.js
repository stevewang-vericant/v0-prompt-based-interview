const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        code: true,
        is_super_admin: true,
        active: true
      }
    });
    console.log('Current Schools in DB:');
    console.table(schools);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();


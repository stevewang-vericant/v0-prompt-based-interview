const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const NEW_PASSWORD = 'asdf123!';

async function main() {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, saltRounds);

    console.log(`Resetting all school passwords to: ${NEW_PASSWORD}`);
    
    const updateResult = await prisma.school.updateMany({
      data: {
        password_hash: hashedPassword
      }
    });

    console.log(`Successfully updated ${updateResult.count} schools.`);
    
  } catch (e) {
    console.error('Error resetting passwords:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();


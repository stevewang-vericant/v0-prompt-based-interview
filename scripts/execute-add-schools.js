const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  const sqlPath = path.join(__dirname, '241229_add_schools.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  
  // 移除验证查询（SELECT），只执行 INSERT
  const insertSql = sql.split('-- Verify inserted schools')[0].trim()
  
  console.log('🚀 开始执行 SQL 脚本...\n')
  console.log(`📄 文件: ${sqlPath}\n`)
  
  try {
    // 执行 INSERT 语句
    await prisma.$executeRawUnsafe(insertSql)
    console.log('✅ SQL 脚本执行成功！\n')
    
    // 验证插入的学校数量
    const count = await prisma.school.count({
      where: {
        code: {
          in: [
            'the-lawrenceville-school',
            'middlesex-school',
            'concord-academy',
            'the-webb-schools-ca',
            'peddie-school',
            'st-andrews-school-de',
            'the-taft-school',
            'st-marks-school',
            'st-stephens-episcopal-school-tx',
            'blair-academy',
            'kent-school',
            'the-loomis-chaffee-school',
            'western-reserve-academy',
            'mercersburg-academy',
            'georgetown-preparatory-school',
            'lake-forest-academy',
            'westtown-school',
            'the-madeira-school',
            'saint-andrews-school-fl',
            'tabor-academy',
            'george-school',
            'the-cambridge-school-of-weston',
            'brooks-school',
            'north-broward-preparatory-school',
            'the-hun-school-of-princeton',
            'miss-porters-school',
            'virginia-episcopal-school',
            'cranbrook-schools',
            'cushing-academy',
            'woodside-priory-school',
            'canterbury-school',
            'elite-preparatory-academy',
            'san-domenico-school',
            'wilbraham-monson-academy',
            'mccallie-school',
            'lawrence-academy',
            'saint-james-school',
            'wyoming-seminary',
            'asheville-school',
            'john-bapst-memorial-high-school',
            'trinity-pawling-school',
            'church-farm-school',
            'foxcroft-school',
            'the-winchendon-school',
            'sandy-spring-friends-school',
            'chadwick-school',
            'lakefield-college-school',
            'pickering-college',
            'ridley-college',
            'north-country-school',
            'the-fessenden-school',
            'hotchkiss-summer-portals',
            'choate-summer-programs',
            'lawrenceville-summer-scholars',
            'loomis-summer',
            'mercersburg-summer-institute',
            'summer-at-st-margarets',
            'cambridge-school-of-weston-summer-enrichment',
          ],
        },
      },
    })
    
    console.log(`📊 验证结果: 成功添加 ${count} 个学校`)
    
    // 显示前10个学校作为示例
    const sampleSchools = await prisma.school.findMany({
      where: {
        code: {
          in: [
            'the-lawrenceville-school',
            'middlesex-school',
            'concord-academy',
            'the-webb-schools-ca',
            'peddie-school',
            'st-andrews-school-de',
            'the-taft-school',
            'st-marks-school',
            'st-stephens-episcopal-school-tx',
            'blair-academy',
          ],
        },
      },
      select: {
        code: true,
        name: true,
        email: true,
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    console.log('\n📋 示例学校（前10个）:')
    sampleSchools.forEach(school => {
      console.log(`  - ${school.name} (${school.code}) - ${school.email}`)
    })
    
  } catch (error) {
    console.error('❌ SQL 脚本执行失败:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


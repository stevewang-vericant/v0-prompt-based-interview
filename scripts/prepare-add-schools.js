const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

// 学校列表
const schools = [
  'The Lawrenceville School',
  'Middlesex School',
  'Concord Academy',
  'The Webb Schools (CA)',
  'Peddie School',
  "St. Andrew's School, DE",
  'The Taft School',
  "St. Mark's School",
  'Episcopal High School',
  "St. Stephen's Episcopal School TX",
  'Emma Willard School',
  'Blair Academy',
  'Kent School',
  'The Loomis Chaffee School',
  'Western Reserve Academy',
  'The Pennington School',
  'Mercersburg Academy',
  'Georgetown Preparatory School',
  'Lake Forest Academy',
  'Westtown School',
  'Berkshire School',
  "The Governor's Academy",
  'The Madeira School',
  "Saint Andrew's School (FL)",
  'Tabor Academy',
  'George School',
  'The Cambridge School Of Weston',
  'Brooks School',
  'Pomfret School',
  'North Broward Preparatory School',
  'The Hun School of Princeton',
  "Miss Porter's School",
  'Virginia Episcopal School',
  'Kimball Union Academy',
  'Cranbrook Schools',
  'Cushing Academy',
  'Woodside Priory School',
  'Canterbury School',
  'Elite Preparatory Academy',
  'San Domenico School',
  'Wilbraham & Monson Academy',
  'McCallie School',
  'Lawrence Academy',
  'Saint James School',
  'Wyoming Seminary',
  'Asheville School',
  'The Northwest School',
  'John Bapst Memorial High School',
  'Trinity-Pawling School',
  'Church Farm School',
  'Foxcroft School',
  'The Winchendon School',
  'Sandy Spring Friends School',
  'Chadwick School',
  'Lakefield College School',
  'Pickering College',
  'Ridley College',
  'North Country School',
  'The Fessenden School',
  'Hotchkiss Summer Portals',
  'Choate Summer Programs',
  'Lawrenceville Summer Scholars',
  'Loomis Summer',
  'Mercersburg Summer Institute',
  'Summer at St. Margaret\'s',
  'Cambridge School of Weston Summer Enrichment',
]

// 生成 school code
function generateCode(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符替换为单个
    .replace(/^-|-$/g, '') // 移除首尾连字符
}

async function main() {
  console.log('🔍 检查现有学校...\n')
  
  const existingSchools = await prisma.school.findMany({
    select: {
      code: true,
      name: true,
    },
  })
  
  const existingCodes = new Set(existingSchools.map(s => s.code?.toLowerCase()))
  const existingNames = new Set(existingSchools.map(s => s.name.toLowerCase()))
  
  console.log(`找到 ${existingSchools.length} 个现有学校\n`)
  
  // 准备要添加的学校
  const schoolsToAdd = []
  const skipped = []
  
  for (const schoolName of schools) {
    const code = generateCode(schoolName)
    const normalizedName = schoolName.toLowerCase()
    
    // 检查是否已存在（通过 code 或 name）
    const existsByCode = existingCodes.has(code)
    const existsByName = existingNames.has(normalizedName)
    
    if (existsByCode || existsByName) {
      skipped.push({
        name: schoolName,
        code,
        reason: existsByCode ? 'code exists' : 'name exists',
      })
      continue
    }
    
    schoolsToAdd.push({
      name: schoolName,
      code,
      email: `admin@${code}.com`,
    })
  }
  
  console.log(`\n📊 统计结果:`)
  console.log(`  - 需要添加: ${schoolsToAdd.length} 个学校`)
  console.log(`  - 跳过（已存在）: ${skipped.length} 个学校`)
  
  if (skipped.length > 0) {
    console.log(`\n⏭️  跳过的学校:`)
    skipped.forEach(s => {
      console.log(`  - ${s.name} (${s.code}) - ${s.reason}`)
    })
  }
  
  if (schoolsToAdd.length > 0) {
    console.log(`\n✅ 将添加的学校:`)
    schoolsToAdd.forEach(s => {
      console.log(`  - ${s.name} (${s.code})`)
    })
    
    // 生成 SQL
    const defaultPassword = 'asdf123!'
    const passwordHash = await bcrypt.hash(defaultPassword, 10)
    
    // 获取默认的4个系统提示
    const defaultPrompts = await prisma.prompt.findMany({
      where: { school_id: null },
      orderBy: { created_at: 'asc' },
      take: 4,
      select: { id: true },
    })
    
    const defaultPromptIds = defaultPrompts.map(p => `'${p.id}'`).join(', ')
    
    const sql = `-- File: 241229_add_schools.sql
-- Purpose: Add new schools to the database
-- Affected Tables: schools
-- Dependencies: None
-- Date: 2024-12-29
--
-- This script adds ${schoolsToAdd.length} new schools to the database.
-- Default password for all schools: ${defaultPassword}
-- Default email format: admin@<code>.com

-- Generate password hash (use this value for all schools)
-- Password: ${defaultPassword}
-- Hash: ${passwordHash}

INSERT INTO public.schools (id, code, name, email, password_hash, active, is_super_admin, credits_balance, selected_prompt_ids, created_at, updated_at)
VALUES
${schoolsToAdd
  .map(
    (s, i) =>
      `  (gen_random_uuid(), '${s.code}', '${s.name.replace(/'/g, "''")}', '${s.email}', '${passwordHash}', true, false, 0, ARRAY[${defaultPromptIds}]::text[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)${i < schoolsToAdd.length - 1 ? ',' : ''}`
  )
  .join('\n')}
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;

-- Verify inserted schools
SELECT 
  code,
  name,
  email,
  active,
  created_at
FROM public.schools 
WHERE code IN (${schoolsToAdd.map(s => `'${s.code}'`).join(', ')})
ORDER BY name;
`
    
    console.log(`\n📝 生成的 SQL 脚本:`)
    console.log('='.repeat(80))
    console.log(sql)
    console.log('='.repeat(80))
    
    // 写入文件
    const fs = require('fs')
    const path = require('path')
    const sqlPath = path.join(__dirname, '241229_add_schools.sql')
    fs.writeFileSync(sqlPath, sql)
    console.log(`\n💾 SQL 脚本已保存到: ${sqlPath}`)
  } else {
    console.log('\n✅ 所有学校都已存在，无需添加')
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


const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const schools = [
  'Phillips Academy Andover',
  'Phillips Exeter Academy',
  'Choate Rosemary Hall',
  'Groton School',
  'St. Paul\'s School',
  'The Hotchkiss School',
  'Deerfield Academy',
  'Milton Academy',
  'Cate School',
  'The Thacher School',
  'Suffield Academy',
  'Dana Hall School',
  'The Hill School',
  'St. George\'s School',
  'Williston Northampton School',
  'The Stony Brook School',
  'Northfield Mount Hermon School',
  'Stevenson School',
  'Culver Academies',
  'Westminster School, CT',
  'Princeton International School of Mathematics and Science',
  'The Athenian School',
  'The Bolles School',
  'Woodberry Forest School',
  'Holderness School',
  'Windermere Preparatory School',
  '\'lolani School',
  'The Ethel Walker School',
  'Baylor School',
  'The Village School',
  'Shady Side Academy',
  'Thomas Jefferson School',
  'Millbrook School',
  'Westover School',
  'The Grier School',
  'Portsmouth Abbey School',
  'The Masters School',
  'Avon Old Farms School',
  'Saint Mary\'s School',
  'Fountain Valley School',
  'Chaminade College Prep School',
  'Indian Springs School',
  'Wayland Academy',
  'Cheshire Academy',
  'Darlington School',
  'The Frederick Gunn School',
  'The Storm King School',
  'Santa Catalina School',
  'Worcester Academy',
  'Oregon Episcopal School',
  'Justin-Siena High School',
  'The MacDuffie School',
  'CATS Academy Boston',
  'The Webb School',
  'Annie Wright School',
  'Wasatch Academy',
  'Chatham Hall',
  'Gilmour Academy',
  'Thornton Academy',
  'The Knox School',
  'St. Anne\'s-Belfield School',
  'Linden Hall School for Girls',
  'Garrison Forest School',
  'Hoosac School',
  'Maumee Valley Country Day School',
  'Miss Hall\'s School',
  'St. Albans School',
  'Ross School',
  'Shattuck-St. Mary\'s School',
  'Dublin School',
  'The Perkiomen School',
  'Montverde Academy',
  'Saint John\'s Preparatory School',
  'St. Timothy\'s School',
  'Buffalo Seminary',
  'St. Johnsbury Academy',
  'Miller School of Albemarle',
  'Rabun Gap-Nacoochee School',
  'The Newman School',
  'The Putney School',
  'Marianapolis Preparatory School',
  'Gould Academy',
  'Stoneleigh-Burnham School',
  'Vermont Academy',
  'The Brook Hill School',
  'Springfield Commonwealth Academy',
  'Salisbury School',
  'Solebury School',
  'The Linsly School',
  'La Lumiere School',
  'St. Andrew\'s School - RI',
  'Proctor Academy',
  'Salem Academy',
  'Christ School',
  'Delphian School',
  'Mastery School of Hawken',
  'New Hampton School',
  'Chapel Hill-Chauncy Hall School',
  'Colorado Rocky Mountain School',
  'South Kent School',
  'The Harvey School',
  'Fryeburg Academy',
  'Lake Tahoe Preparatory School',
  'Midland School',
  'Hebron Academy',
  'Hawai\'i Preparatory Academy',
  'Maine Central Institute',
  'Villanova Preparatory School',
  'Mercyhurst Preparatory School',
  'Woodstock Academy',
  'Flintridge Sacred Heart Academy',
  'Woodlands Academy of the Sacred Heart',
  'Christchurch School',
  'Tallulah Falls School',
  'TMI - The Episcopal School of Texas',
  'Hyde School',
  'International Leadership of Texas (ILTexas)',
  'Dunn School',
  'Ben Lippen School',
  'Besant Hill School',
  'Kents Hill School',
  'Blue Ridge School',
  'Stuart Hall School',
  'Verde Valley School',
  'Tilton School',
  'Buxton School',
  'North Cross School',
  'Brewster Academy',
  'Oakwood Friends School',
  'Andrews Osborne Academy',
  'The Calverton School',
  'Oak Hill Academy',
  'Washington Academy',
  'The Kiski School',
  'St. Margaret\'s School',
  'West Nottingham Academy',
  'Saint Stanislaus',
  'EF Academy New York',
  'Oldfields School',
  'Northwood School',
  'Saint Bede Academy',
  'Monte Vista Christian School',
  'St. Andrew\'s-Sewanee School',
  'St. Croix Lutheran Academy',
  'The Marvelwood School',
  'Martin Luther High School',
  'Lyndon Institute',
  'Oak Grove School',
  'Scattergood Friends School',
  'Lexington Christian Academy',
  'Foxcroft Academy',
  'Rice Memorial High School',
  'The Boys\' Latin School of Maryland',
  'Admiral Farragut Academy',
  'The King\'s Academy-TN',
  'Southwestern Academy (CA)',
  'Cotter Schools',
  'North Cedar Academy',
  'Academy of the New Church Secondary Schools',
  'Florida Preparatory Academy',
  'Subiaco Academy',
  'San Marcos Academy',
  'South Hills Academy',
  'St. Bernard Preparatory School',
  'George Stevens Academy',
  'Ojai Valley School',
  'St. Thomas More School',
  'Academy of the Sacred Heart',
  'Rock Point School',
  'Houghton Academy',
  'Archbishop Riordan High School',
  'Olney Friends School',
  'Maur Hill - Mount Academy',
  'The Woodhall School',
  'Forman School',
  'EF Academy Pasadena',
  'Putnam Science Academy CT',
  'The Leelanau School',
  'Marshall School',
  'Darrow School',
  'The Phelps School',
  'High Mowing School',
  'Steamboat Mountain School',
  'Asia Pacific International School',
  'Thomas More Prep-Marian',
  'The Montfort Academy',
  'Academy of the Holy Family',
  'Auburn Adventist Academy',
  'Grand River Academy',
  'Bridgton Academy',
  'Oakdale Christian Academy',
  'Robinson School',
  'Lee Academy',
  'Lustre Christian High School',
  'The Hill School, Middleburg VA',
  'Merrick Preparatory School',
  'St. Margaret\'s School',
  'Erie First Christian Academy',
  'The Orme School',
  'Ashley Hall',
  'Brandon Hall School',
  'Whittle School and Studios',
  'Randolph-Macon Academy',
  'Canyonville Christian Academy',
  'Summer at Porter\'s',
  'Oprah Winfrey Leadership Academy Miss Porter\'s School Global Summit',
  'Southwestern Academy AZ',
  'Shawnigan Lake School',
  'Bodwell High School',
  'Brentwood College School',
  'St. George\'s School, Vancouver',
  'St. Michaels University School',
  'The High School at Vancouver Island University',
  'The King\'s Academy, CA',
  'Idyllwild Arts Academy',
  'Walnut Hill School for the Arts',
  'St. John\'s-Ravenscourt School',
  'Interlochen Arts Academy',
  'Rothesay Netherwood',
  'Purnell School',
  'Bronte College',
  'Fulford Academy',
  'J. Addison School',
  'Nancy Campbell Academy',
  'Robert Land Academy',
  'Rosseau Lake College',
  'Branksome Hall',
  'Havergal College',
  'The Bishop Strachan School',
  'Trinity College School',
  'Upper Canada College',
  'The Webb Schools Summer Program – Junior Scholars Program',
  'Appleby College',
  'Albert College',
  'Ashbury College',
  'Bishop\'s College School',
  'Stanstead College',
  'Ashley Hall School',
  'Indian Mountain School',
  'Eaglebrook School',
  'The Rectory School',
  'Applewild School',
  'St. Catherine\'s Academy',
  'Hampshire Country School',
  'Oakland School',
  'Rumsey Hall School',
  'Hillside School, MA',
  'Fay School',
  'Bement School',
  'Cardigan Mountain School',
  'St. Mark\'s School Of Texas',
  'Glenlyon Norfolk School',
  'Capecod Academy',
  'Ranney School',
  'Army and Navy Academy',
  'Léman Manhattan Preparatory School',
  'Missouri Military Academy',
  'Hackley School',
  'International Junior Golf Academy',
  'Villanova College',
  'American Heritage Schools',
  'Ideaventions Academy',
  'Valley Forge Military Academy',
  'Summer at Stevenson',
  'Fryeburg Academy',
  'Fryeburg Academy Summer',
  'Queen Ethelburga\'s College',
  'Moravian Academy',
  'Fork Union Military Academy',
  'TASIS England',
  'Truro School',
  'St Leonards School',
  'Mid-Pacific Institute',
  'Leighton Park School',
  'Epsom College Malaysia',
  'Institut Montana Switzerland',
  'Hawaii Preparatory Academy',
  'Farlington School'
]

function normalizeCode(name) {
  let code = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  // Truncate to 50 characters if too long
  if (code.length > 50) {
    code = code.substring(0, 50).replace(/-+$/, '')
  }
  
  return code
}

async function main() {
  console.log('Checking existing schools...')
  
  // Get all existing schools
  const existingSchools = await prisma.school.findMany({
    select: { code: true, name: true }
  })
  
  const existingCodes = new Set(existingSchools.map(s => s.code?.toLowerCase()))
  const existingNames = new Set(existingSchools.map(s => s.name?.toLowerCase()))
  
  console.log(`Found ${existingSchools.length} existing schools`)
  
  // Process schools
  const schoolsToAdd = []
  const skipped = []
  
  for (const schoolName of schools) {
    const code = normalizeCode(schoolName)
    
    // Check if code or name already exists
    if (existingCodes.has(code) || existingNames.has(schoolName.toLowerCase())) {
      skipped.push({ name: schoolName, code, reason: 'already exists' })
      continue
    }
    
    schoolsToAdd.push({ name: schoolName, code })
  }
  
  console.log(`\nSchools to add: ${schoolsToAdd.length}`)
  console.log(`Schools skipped: ${skipped.length}`)
  
  if (skipped.length > 0) {
    console.log('\nSkipped schools:')
    skipped.forEach(s => console.log(`  - ${s.name} (${s.code})`))
  }
  
  if (schoolsToAdd.length === 0) {
    console.log('\nNo new schools to add.')
    return
  }
  
  // Generate SQL
  const defaultPassword = 'asdf123!'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)
  
  // Get default prompts
  const defaultPrompts = await prisma.prompt.findMany({
    where: { school_id: null },
    orderBy: { created_at: 'asc' },
    take: 4,
    select: { id: true }
  })
  
  const defaultPromptIds = defaultPrompts.map(p => p.id)
  
  const sqlStatements = schoolsToAdd.map(({ name, code }) => {
    const email = `admin@${code}.com`
    const promptIdsArray = defaultPromptIds.length === 4 
      ? `ARRAY[${defaultPromptIds.map(id => `'${id}'`).join(', ')}]`
      : `ARRAY[]::uuid[]`
    
    return `INSERT INTO public.schools (id, code, name, email, password_hash, active, selected_prompt_ids, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '${code}',
  '${name.replace(/'/g, "''")}',
  '${email}',
  '${hashedPassword}',
  true,
  ${promptIdsArray},
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP;`
  })
  
  const sqlContent = `-- File: 240104_add_schools_batch2.sql
-- Purpose: Add additional schools to the database
-- Affected Tables: schools
-- Dependencies: None
-- Date: 2024-01-04
--
-- This script adds new schools to the schools table.
-- Schools that already exist (by code or name) are skipped.
-- Default password: asdf123!
-- Default prompts are automatically assigned.

${sqlStatements.join('\n\n')}
`
  
  const sqlFile = path.join(__dirname, '240104_add_schools_batch2.sql')
  fs.writeFileSync(sqlFile, sqlContent)
  
  console.log(`\n✅ SQL file generated: ${sqlFile}`)
  console.log(`\nSummary:`)
  console.log(`  - Total schools in list: ${schools.length}`)
  console.log(`  - Schools to add: ${schoolsToAdd.length}`)
  console.log(`  - Schools skipped: ${skipped.length}`)
  console.log(`\nDefault password for all schools: ${defaultPassword}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())


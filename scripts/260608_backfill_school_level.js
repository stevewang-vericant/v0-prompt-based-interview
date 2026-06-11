// File: 260608_backfill_school_level.js
// Purpose: Backfill schools.level for existing rows. Classify schools whose name
//          clearly indicates higher education (university / college / institute of
//          technology, etc.) as "undergraduate"; everything else stays "k12".
// Affected Tables: schools (only the `level` column; never touches password_hash)
// Date: 2026-06-08
//
// Usage:
//   node scripts/260608_backfill_school_level.js          # dry-run, prints proposed mapping
//   node scripts/260608_backfill_school_level.js --apply  # actually writes level
//
// The mapping is heuristic; review the dry-run output first. The School Management
// UI allows manual per-school correction afterwards.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

// Whole-word / phrase indicators of higher education.
// Kept conservative: K-12 prep/boarding schools should NOT match these.
const UNDERGRAD_PATTERNS = [
  /\buniversity\b/i,
  /\buniversities\b/i,
  /\bcollege\b/i, // NOTE: some K-12 names contain "College"; reviewed via dry-run
  /\binstitute of technology\b/i,
  /\bpolytechnic\b/i,
  /\buniversit/i, // catches non-English variants like "Universidad", "Université"
]

// Explicit overrides for known false positives/negatives (by lowercased code or name).
// Add entries here if the dry-run reveals a misclassification you want baked in.
const FORCE_K12 = new Set([
  // Pickering College: name contains "College" but is a K-12 boarding school
  // (Newmarket, Ontario, Canada), not a higher-ed institution.
  'pickering-college',
])
const FORCE_UNDERGRAD = new Set([
  // e.g. a university whose name doesn't contain an obvious keyword
])

function classify(school) {
  const name = (school.name || '').trim()
  const code = (school.code || '').trim().toLowerCase()
  const nameKey = name.toLowerCase()

  if (FORCE_UNDERGRAD.has(code) || FORCE_UNDERGRAD.has(nameKey)) return 'undergraduate'
  if (FORCE_K12.has(code) || FORCE_K12.has(nameKey)) return 'k12'

  const isUndergrad = UNDERGRAD_PATTERNS.some((re) => re.test(name))
  return isUndergrad ? 'undergraduate' : 'k12'
}

async function main() {
  const schools = await prisma.school.findMany({
    where: { NOT: { code: '_system' } },
    select: { id: true, name: true, code: true, level: true },
    orderBy: { name: 'asc' },
  })

  const rows = schools.map((s) => {
    const proposed = classify(s)
    return {
      name: s.name,
      code: s.code,
      current: s.level,
      proposed,
      change: s.level !== proposed ? '*' : '',
    }
  })

  console.log(`\n[Backfill] ${schools.length} schools (excluding _system)\n`)
  console.table(rows)

  const undergrad = rows.filter((r) => r.proposed === 'undergraduate')
  console.log(`\n[Backfill] Proposed undergraduate (${undergrad.length}):`)
  undergrad.forEach((r) => console.log(`  - ${r.name} (${r.code})`))

  const changes = rows.filter((r) => r.change === '*')
  console.log(`\n[Backfill] ${changes.length} rows would change level.`)

  if (!APPLY) {
    console.log('\n[Backfill] DRY-RUN only. Re-run with --apply to write changes.\n')
    return
  }

  console.log('\n[Backfill] Applying changes...')
  let updated = 0
  for (const s of schools) {
    const proposed = classify(s)
    if (s.level === proposed) continue
    await prisma.school.update({
      where: { id: s.id },
      data: { level: proposed },
    })
    updated += 1
  }
  console.log(`[Backfill] Done. Updated ${updated} schools.\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

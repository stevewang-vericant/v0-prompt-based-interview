/**
 * Migration script: auto-approve all existing interviews that already have scores.
 * This preserves backward compatibility -- school users can continue seeing
 * scores that were already visible before the rater approval feature.
 *
 * Run with: npx tsx scripts/auto-approve-existing-scores.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.interview.updateMany({
    where: {
      total_score: { not: null },
      score_approved: false,
    },
    data: {
      score_approved: true,
      score_approved_at: new Date(),
    },
  })

  console.log(`Auto-approved ${result.count} existing scored interviews.`)
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

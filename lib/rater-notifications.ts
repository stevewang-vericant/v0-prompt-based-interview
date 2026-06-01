import { prisma } from '@/lib/prisma'
import { sendRaterReviewNotificationEmail } from '@/lib/email'

export interface NotifyRatersAfterScoringParams {
  interviewDbId: string
  interviewId: string
  finalScore: number
  logPrefix?: string
}

interface RaterRecipient {
  email: string
  name: string | null
}

async function getActiveRaterRecipients(): Promise<RaterRecipient[]> {
  const [adminRaters, schoolRaters] = await Promise.all([
    prisma.schoolAdmin.findMany({
      where: { is_rater: true, active: true },
      select: { email: true, name: true },
    }),
    prisma.school.findMany({
      where: {
        is_rater: true,
        active: true,
        email: { not: null },
      },
      select: { email: true, name: true },
    }),
  ])

  const byEmail = new Map<string, RaterRecipient>()

  for (const rater of [...adminRaters, ...schoolRaters]) {
    const email = rater.email?.trim()
    if (!email) continue

    const key = email.toLowerCase()
    if (!byEmail.has(key)) {
      byEmail.set(key, { email, name: rater.name })
    }
  }

  return Array.from(byEmail.values())
}

/**
 * Best-effort: notify all active raters that an interview needs review.
 * Failures are logged and do not throw to callers.
 */
export async function notifyRatersAfterScoring(
  params: NotifyRatersAfterScoringParams
): Promise<void> {
  const { interviewDbId, interviewId, finalScore, logPrefix = '[RaterNotify]' } =
    params

  try {
    const raters = await getActiveRaterRecipients()
    if (raters.length === 0) {
      console.warn(`${logPrefix} No active raters found; skipping notification`)
      return
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewDbId },
      select: {
        interview_id: true,
        student: { select: { name: true } },
        school: { select: { name: true } },
      },
    })

    if (!interview) {
      console.warn(
        `${logPrefix} Interview not found (${interviewDbId}); skipping notification`
      )
      return
    }

    const externalInterviewId = interview.interview_id || interviewId
    const reviewUrl = `/school/rating/${encodeURIComponent(externalInterviewId)}`

    const results = await Promise.allSettled(
      raters.map((rater) =>
        sendRaterReviewNotificationEmail(rater.email, {
          raterName: rater.name,
          studentName: interview.student?.name,
          schoolName: interview.school?.name,
          interviewId: externalInterviewId,
          finalScore,
          reviewUrl,
        })
      )
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.length - succeeded

    console.log(
      `${logPrefix} Rater notifications sent: ${succeeded}/${results.length} succeeded`
    )

    if (failed > 0) {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(
            `${logPrefix} Failed to notify rater ${raters[index]?.email}:`,
            result.reason
          )
        }
      })
    }
  } catch (error) {
    console.error(`${logPrefix} Rater notification batch failed:`, error)
  }
}

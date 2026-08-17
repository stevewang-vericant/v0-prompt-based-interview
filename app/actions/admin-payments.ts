"use server"

import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-guards"
import { toClientError } from "@/lib/errors"

export interface AdminPaymentRecord {
  id: string
  interviewId: string
  schoolName: string
  schoolCode: string
  studentName: string
  studentEmail: string
  amountCents: number
  currency: string
  paymentStatus: string
  entitlementStatus: string
  stripePaymentIntentId: string | null
  paidAt: string | null
  createdAt: string
  restartCount: number
  interviewStatus: string
  interviewStartedAt: string | null
  interviewCompletedAt: string | null
  videoUrl: string | null
  attemptCount: number
}

export async function listInterviewPayments(): Promise<{
  success: boolean
  payments?: AdminPaymentRecord[]
  error?: string
}> {
  try {
    await requireSuperAdmin()

    const payments = await prisma.interviewPayment.findMany({
      orderBy: { created_at: "desc" },
      include: {
        school: {
          select: { name: true, code: true },
        },
        interviews: {
          orderBy: { attempt_number: "desc" },
          include: {
            student: { select: { name: true, email: true } },
          },
        },
      },
    })

    const legacyInterviewIds = payments
      .filter((payment) => payment.interviews.length === 0)
      .map((payment) => payment.interview_id)
    const legacyInterviews =
      legacyInterviewIds.length > 0
        ? await prisma.interview.findMany({
            where: { interview_id: { in: legacyInterviewIds } },
            include: {
              student: { select: { name: true, email: true } },
            },
          })
        : []
    const legacyByExternalId = new Map(
      legacyInterviews.map((interview) => [interview.interview_id, interview])
    )

    return {
      success: true,
      payments: payments.map((payment) => {
        const currentInterview =
          payment.interviews.find(
            (interview) => interview.interview_id === payment.interview_id
          ) ||
          legacyByExternalId.get(payment.interview_id) ||
          payment.interviews[0] ||
          null

        return {
          id: payment.id,
          interviewId: payment.interview_id,
          schoolName: payment.school.name,
          schoolCode: payment.school.code || "",
          studentName: payment.student_name,
          studentEmail: payment.student_email,
          amountCents: payment.amount_cents,
          currency: payment.currency,
          paymentStatus: payment.status,
          entitlementStatus: payment.entitlement_status,
          stripePaymentIntentId: payment.stripe_payment_intent_id,
          paidAt: payment.paid_at?.toISOString() || null,
          createdAt: payment.created_at.toISOString(),
          restartCount: payment.restart_count,
          interviewStatus: currentInterview?.status || "not_started",
          interviewStartedAt: currentInterview?.started_at?.toISOString() || null,
          interviewCompletedAt: currentInterview?.completed_at?.toISOString() || null,
          videoUrl: currentInterview?.video_url || null,
          attemptCount:
            payment.interviews.length ||
            (legacyByExternalId.has(payment.interview_id) ? 1 : 0),
        }
      }),
    }
  } catch (error) {
    console.error("[AdminPayments] Failed to list payments:", error)
    return { success: false, error: toClientError(error) }
  }
}

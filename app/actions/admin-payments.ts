"use server"

import crypto from "crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-guards"
import { toClientError } from "@/lib/errors"
import { requestInterviewAccessCodeByInterviewId } from "@/app/actions/payment-access"

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
  lastAdminAction: string | null
  lastAdminActionAt: string | null
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
        audit_logs: {
          orderBy: { created_at: "desc" },
          take: 1,
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
          lastAdminAction: payment.audit_logs[0]?.action || null,
          lastAdminActionAt: payment.audit_logs[0]?.created_at.toISOString() || null,
        }
      }),
    }
  } catch (error) {
    console.error("[AdminPayments] Failed to list payments:", error)
    return { success: false, error: toClientError(error) }
  }
}

export async function updatePaymentRecoveryEmail(params: {
  paymentId: string
  email: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireSuperAdmin()
    const email = params.email.trim().toLowerCase()
    const reason = params.reason.trim()
    if (!email.includes("@") || !reason) {
      return { success: false, error: "A valid email and a reason are required." }
    }

    const payment = await prisma.interviewPayment.findUnique({
      where: { id: params.paymentId },
      select: { student_info: true, entitlement_status: true, student_email: true },
    })
    if (!payment) return { success: false, error: "Payment record not found." }
    if (payment.entitlement_status !== "active") {
      return { success: false, error: "Only an active paid interview can be updated." }
    }
    const studentInfo =
      payment.student_info &&
      typeof payment.student_info === "object" &&
      !Array.isArray(payment.student_info)
        ? (payment.student_info as Record<string, unknown>)
        : {}

    await prisma.$transaction([
      prisma.interviewPayment.update({
        where: { id: params.paymentId },
        data: {
          student_email: email,
          student_info: { ...studentInfo, email } as Prisma.InputJsonValue,
        },
      }),
      prisma.paymentAuditLog.create({
        data: {
          payment_id: params.paymentId,
          action: "recovery_email_changed",
          actor_email: user.email,
          reason,
          metadata: {
            previousEmail: payment.student_email,
            newEmail: email,
          },
        },
      }),
    ])
    return { success: true }
  } catch (error) {
    console.error("[AdminPayments] Failed to update recovery email:", error)
    return { success: false, error: toClientError(error) }
  }
}

export async function resendPaymentAccessCode(params: {
  paymentId: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireSuperAdmin()
    const reason = params.reason.trim()
    if (!reason) return { success: false, error: "A reason is required." }
    const payment = await prisma.interviewPayment.findUnique({
      where: { id: params.paymentId },
      include: { school: { select: { code: true } } },
    })
    if (!payment || !payment.school.code) {
      return { success: false, error: "Payment record not found." }
    }
    const result = await requestInterviewAccessCodeByInterviewId({
      interviewId: payment.interview_id,
      schoolCode: payment.school.code,
    })
    if (!result.success) return result
    await prisma.paymentAuditLog.create({
      data: {
        payment_id: payment.id,
        action: "verification_code_resent",
        actor_email: user.email,
        reason,
      },
    })
    return { success: true }
  } catch (error) {
    console.error("[AdminPayments] Failed to resend access code:", error)
    return { success: false, error: toClientError(error) }
  }
}

export async function restartPaidInterviewAsAdmin(params: {
  paymentId: string
  reason: string
}): Promise<{ success: boolean; interviewId?: string; error?: string }> {
  try {
    const user = await requireSuperAdmin()
    const reason = params.reason.trim()
    if (!reason) return { success: false, error: "A reason is required." }

    const payment = await prisma.interviewPayment.findUnique({
      where: { id: params.paymentId },
      include: { interviews: { select: { attempt_number: true } } },
    })
    if (!payment || payment.status !== "paid" || payment.entitlement_status !== "active") {
      return { success: false, error: "Only an active paid interview can be restarted." }
    }
    const currentInterview = await prisma.interview.findUnique({
      where: { interview_id: payment.interview_id },
      select: { id: true, status: true, video_url: true, metadata: true },
    })
    const metadata =
      currentInterview?.metadata &&
      typeof currentInterview.metadata === "object" &&
      !Array.isArray(currentInterview.metadata)
        ? (currentInterview.metadata as Record<string, unknown>)
        : {}
    const submitted =
      currentInterview?.status === "processing" ||
      currentInterview?.status === "completed" ||
      currentInterview?.video_url !== null ||
      metadata.status === "uploaded" ||
      metadata.merged === true
    if (submitted) {
      return { success: false, error: "A submitted or completed interview cannot be restarted." }
    }

    const interviewId = `interview-${Date.now()}-${crypto.randomUUID()}`
    await prisma.$transaction(async (tx) => {
      if (currentInterview) {
        await tx.interview.update({
          where: { id: currentInterview.id },
          data: {
            status: "reset",
            metadata: {
              ...metadata,
              resetAt: new Date().toISOString(),
              resetReason: "super_admin",
            } as Prisma.InputJsonValue,
          },
        })
      }
      await tx.interviewPayment.update({
        where: { id: payment.id },
        data: {
          interview_id: interviewId,
          restart_count: { increment: 1 },
        },
      })
      await tx.paymentAuditLog.create({
        data: {
          payment_id: payment.id,
          action: "interview_restarted",
          actor_email: user.email,
          reason,
          metadata: { previousInterviewId: payment.interview_id, newInterviewId: interviewId },
        },
      })
    })
    return { success: true, interviewId }
  } catch (error) {
    console.error("[AdminPayments] Failed to restart interview:", error)
    return { success: false, error: toClientError(error) }
  }
}

export async function voidTestPayment(params: {
  paymentId: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireSuperAdmin()
    const reason = params.reason.trim()
    const isTestEnvironment =
      process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ||
      process.env.APP_URL?.includes("staging.")
    if (!isTestEnvironment) {
      return { success: false, error: "Test payments can only be voided in staging/test mode." }
    }
    if (!reason) return { success: false, error: "A reason is required." }
    await prisma.$transaction([
      prisma.interviewPayment.update({
        where: { id: params.paymentId },
        data: { status: "voided", entitlement_status: "voided" },
      }),
      prisma.paymentAccessCode.updateMany({
        where: { payment_id: params.paymentId, consumed_at: null },
        data: { consumed_at: new Date() },
      }),
      prisma.paymentAuditLog.create({
        data: {
          payment_id: params.paymentId,
          action: "test_payment_voided",
          actor_email: user.email,
          reason,
        },
      }),
    ])
    return { success: true }
  } catch (error) {
    console.error("[AdminPayments] Failed to void test payment:", error)
    return { success: false, error: toClientError(error) }
  }
}

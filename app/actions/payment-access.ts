"use server"

import crypto from "crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { toClientError } from "@/lib/errors"
import { sendInterviewAccessCodeEmail } from "@/lib/email"
import { issuePaymentAccessSession } from "@/lib/payment-access"

const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_CODE_ATTEMPTS = 5

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashAccessCode(paymentId: string, code: string): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not configured")
  return crypto
    .createHash("sha256")
    .update(`${paymentId}:${code}:${secret}`)
    .digest("hex")
}

function codesMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

async function findActivePayment(schoolCode: string, email: string) {
  return prisma.interviewPayment.findFirst({
    where: {
      student_email: { equals: normalizeEmail(email), mode: "insensitive" },
      status: "paid",
      entitlement_status: "active",
      school: { code: schoolCode },
    },
    orderBy: { paid_at: "desc" },
    include: {
      school: { select: { name: true, code: true } },
    },
  })
}

export async function requestInterviewAccessCode(params: {
  schoolCode: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  // Deliberately return the same response when no payment exists, so this
  // endpoint cannot be used to discover who has paid.
  const genericSuccess = { success: true }

  try {
    const schoolCode = params.schoolCode.trim()
    const email = normalizeEmail(params.email)
    if (!schoolCode || !email || !email.includes("@")) {
      return { success: false, error: "Enter a valid payment email address." }
    }

    const payment = await findActivePayment(schoolCode, email)
    if (!payment) return genericSuccess

    const latestCode = await prisma.paymentAccessCode.findFirst({
      where: { payment_id: payment.id },
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    })
    if (
      latestCode &&
      Date.now() - latestCode.created_at.getTime() < RESEND_COOLDOWN_MS
    ) {
      return genericSuccess
    }

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
    await prisma.paymentAccessCode.create({
      data: {
        payment_id: payment.id,
        code_hash: hashAccessCode(payment.id, code),
        expires_at: new Date(Date.now() + CODE_TTL_MS),
      },
    })

    await sendInterviewAccessCodeEmail({
      to: payment.student_email,
      code,
      schoolName: payment.school.name,
    })
    return genericSuccess
  } catch (error) {
    console.error("[PaymentAccess] Failed to send access code:", error)
    return { success: false, error: toClientError(error, "Unable to send verification code.") }
  }
}

export async function verifyInterviewAccessCode(params: {
  schoolCode: string
  email: string
  code: string
  restart: boolean
}): Promise<{
  success: boolean
  interviewId?: string
  error?: string
}> {
  try {
    const schoolCode = params.schoolCode.trim()
    const email = normalizeEmail(params.email)
    const code = params.code.trim()
    if (!schoolCode || !email || !/^\d{6}$/.test(code)) {
      return { success: false, error: "Enter the 6-digit verification code." }
    }

    const payment = await findActivePayment(schoolCode, email)
    if (!payment) {
      return { success: false, error: "The verification code is invalid or expired." }
    }

    const accessCode = await prisma.paymentAccessCode.findFirst({
      where: {
        payment_id: payment.id,
        consumed_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    })
    if (!accessCode || accessCode.attempts >= MAX_CODE_ATTEMPTS) {
      return { success: false, error: "The verification code is invalid or expired." }
    }

    const expectedHash = hashAccessCode(payment.id, code)
    if (!codesMatch(accessCode.code_hash, expectedHash)) {
      await prisma.paymentAccessCode.update({
        where: { id: accessCode.id },
        data: { attempts: { increment: 1 } },
      })
      return { success: false, error: "The verification code is invalid or expired." }
    }

    let interviewId = payment.interview_id
    await prisma.$transaction(async (tx) => {
      await tx.paymentAccessCode.update({
        where: { id: accessCode.id },
        data: { consumed_at: new Date() },
      })

      if (!params.restart) return

      const currentInterview = await tx.interview.findUnique({
        where: { interview_id: payment.interview_id },
        select: {
          id: true,
          status: true,
          video_url: true,
          metadata: true,
        },
      })
      const metadata =
        currentInterview?.metadata &&
        typeof currentInterview.metadata === "object" &&
        !Array.isArray(currentInterview.metadata)
          ? (currentInterview.metadata as Record<string, unknown>)
          : {}
      const processingStarted =
        currentInterview?.status === "processing" ||
        currentInterview?.status === "completed" ||
        currentInterview?.video_url !== null ||
        metadata.status === "uploaded" ||
        metadata.merged === true

      if (processingStarted) {
        throw new Error(
          "This interview has already been submitted or completed and cannot be restarted."
        )
      }

      if (currentInterview) {
        await tx.interview.update({
          where: { id: currentInterview.id },
          data: {
            status: "reset",
            metadata: {
              ...metadata,
              resetAt: new Date().toISOString(),
              resetReason: "student_email_otp",
            } as Prisma.InputJsonValue,
          },
        })
      }

      interviewId = `interview-${Date.now()}-${crypto.randomUUID()}`
      await tx.interviewPayment.update({
        where: { id: payment.id },
        data: {
          interview_id: interviewId,
          restart_count: { increment: 1 },
        },
      })
    })

    await issuePaymentAccessSession(payment.id, interviewId)
    return { success: true, interviewId }
  } catch (error) {
    console.error("[PaymentAccess] Failed to verify access code:", error)
    return { success: false, error: toClientError(error, "Unable to verify access.") }
  }
}

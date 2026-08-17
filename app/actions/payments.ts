"use server"

import { prisma } from "@/lib/prisma"
import { toClientError } from "@/lib/errors"
import {
  BILLING_MODE_STUDENT_PAY,
  isStudentPayMode,
  parsePaidStudentInfo,
  type PaidStudentInfo,
} from "@/lib/billing"
import { getAppUrl, getStripe } from "@/lib/stripe"
import { getStudentInterviewPrice, markInterviewPaymentPaid } from "@/lib/interview-payment"
import { Prisma } from "@prisma/client"

export async function getInterviewPaymentStatus(interviewId: string): Promise<{
  success: boolean
  paid?: boolean
  status?: string | null
  studentInfo?: PaidStudentInfo | null
  error?: string
}> {
  try {
    if (!interviewId) {
      return { success: false, error: "Interview ID is required" }
    }

    const payment = await prisma.interviewPayment.findUnique({
      where: { interview_id: interviewId },
      select: {
        status: true,
        student_info: true,
      },
    })

    if (!payment) {
      return { success: true, paid: false, status: null, studentInfo: null }
    }

    return {
      success: true,
      paid: payment.status === "paid",
      status: payment.status,
      studentInfo: parsePaidStudentInfo(payment.student_info),
    }
  } catch (error) {
    console.error("[Payments] Failed to load interview payment status:", error)
    return { success: false, error: toClientError(error) }
  }
}

export async function createInterviewCheckoutSession(params: {
  interviewId: string
  schoolCode: string
  studentInfo: PaidStudentInfo
}): Promise<{
  success: boolean
  url?: string
  alreadyPaid?: boolean
  studentInfo?: PaidStudentInfo | null
  error?: string
}> {
  try {
    const interviewId = params.interviewId?.trim()
    const schoolCode = params.schoolCode?.trim()
    const studentInfo = params.studentInfo

    if (!interviewId || !schoolCode) {
      return { success: false, error: "School code and interview ID are required" }
    }

    if (!studentInfo?.email?.trim() || !studentInfo?.name?.trim()) {
      return { success: false, error: "Student name and email are required" }
    }

    const school = await prisma.school.findFirst({
      where: { code: schoolCode },
      select: {
        id: true,
        name: true,
        code: true,
        billing_mode: true,
        active: true,
      },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    if (!school.active) {
      return { success: false, error: "This school is not accepting interviews right now." }
    }

    if (!isStudentPayMode(school.billing_mode)) {
      return {
        success: false,
        error: "This school uses interview credits. Student payment is not available.",
      }
    }

    const existing = await prisma.interviewPayment.findUnique({
      where: { interview_id: interviewId },
    })

    if (existing?.status === "paid") {
      if (existing.school_id !== school.id) {
        return { success: false, error: "This interview payment belongs to a different school." }
      }
      return {
        success: true,
        alreadyPaid: true,
        studentInfo: parsePaidStudentInfo(existing.student_info) || studentInfo,
      }
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        success: false,
        error: "Payment is not configured. Please contact the school administrator.",
      }
    }

    const { amountCents, currency } = await getStudentInterviewPrice()
    const stripe = getStripe()
    const appUrl = getAppUrl()
    const successUrl =
      `${appUrl}/student/interview?school=${encodeURIComponent(schoolCode)}` +
      `&interviewId=${encodeURIComponent(interviewId)}` +
      `&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl =
      `${appUrl}/student/interview?school=${encodeURIComponent(schoolCode)}` +
      `&interviewId=${encodeURIComponent(interviewId)}` +
      `&payment=cancelled`

    if (existing?.stripe_checkout_session_id) {
      try {
        await stripe.checkout.sessions.expire(existing.stripe_checkout_session_id)
      } catch (error) {
        console.warn("[Payments] Could not expire previous Stripe session:", error)
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: studentInfo.email.trim(),
      client_reference_id: interviewId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: "Guided Interview",
              description: `Video interview for ${school.name}`,
            },
          },
        },
      ],
      metadata: {
        interviewId,
        schoolId: school.id,
        schoolCode: school.code || schoolCode,
      },
    })

    if (!session.url) {
      return { success: false, error: "Failed to create Stripe checkout session" }
    }

    const paymentData = {
      school_id: school.id,
      student_email: studentInfo.email.trim(),
      student_name: studentInfo.name.trim(),
      student_info: studentInfo as Prisma.InputJsonValue,
      amount_cents: amountCents,
      currency,
      stripe_checkout_session_id: session.id,
      status: "pending",
      paid_at: null,
      stripe_payment_intent_id: null,
    }

    if (existing) {
      await prisma.interviewPayment.update({
        where: { id: existing.id },
        data: paymentData,
      })
    } else {
      await prisma.interviewPayment.create({
        data: {
          interview_id: interviewId,
          ...paymentData,
        },
      })
    }

    return { success: true, url: session.url }
  } catch (error) {
    console.error("[Payments] Failed to create checkout session:", error)
    return { success: false, error: toClientError(error) }
  }
}

export async function confirmInterviewPayment(params: {
  interviewId: string
  sessionId: string
  schoolCode: string
}): Promise<{
  success: boolean
  paid?: boolean
  studentInfo?: PaidStudentInfo | null
  error?: string
}> {
  try {
    const interviewId = params.interviewId?.trim()
    const sessionId = params.sessionId?.trim()
    const schoolCode = params.schoolCode?.trim()

    if (!interviewId || !sessionId || !schoolCode) {
      return { success: false, error: "Missing payment confirmation details" }
    }

    const school = await prisma.school.findFirst({
      where: { code: schoolCode },
      select: { id: true, billing_mode: true },
    })

    if (!school || school.billing_mode !== BILLING_MODE_STUDENT_PAY) {
      return { success: false, error: "Student payment is not enabled for this school." }
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return { success: false, error: "Payment is not configured. Please contact the school administrator." }
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.interviewId && session.metadata.interviewId !== interviewId) {
      return { success: false, error: "Payment does not match this interview." }
    }

    if (session.metadata?.schoolId && session.metadata.schoolId !== school.id) {
      return { success: false, error: "Payment does not match this school." }
    }

    if (session.payment_status !== "paid") {
      return {
        success: false,
        paid: false,
        error: "Payment was not completed. The interview cannot start until payment succeeds.",
      }
    }

    const marked = await markInterviewPaymentPaid({ checkoutSession: session })
    if (!marked.success) {
      return { success: false, error: "Payment could not be confirmed. Please contact support." }
    }

    const payment = await prisma.interviewPayment.findUnique({
      where: { interview_id: interviewId },
      select: { school_id: true, student_info: true, status: true },
    })

    if (!payment || payment.school_id !== school.id || payment.status !== "paid") {
      return { success: false, error: "Payment could not be confirmed. Please contact support." }
    }

    return {
      success: true,
      paid: true,
      studentInfo: marked.studentInfo || parsePaidStudentInfo(payment.student_info),
    }
  } catch (error) {
    console.error("[Payments] Failed to confirm interview payment:", error)
    return { success: false, error: toClientError(error) }
  }
}

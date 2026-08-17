import { prisma } from "@/lib/prisma"
import {
  DEFAULT_STUDENT_INTERVIEW_CURRENCY,
  DEFAULT_STUDENT_INTERVIEW_PRICE_CENTS,
  parsePaidStudentInfo,
  STUDENT_INTERVIEW_CURRENCY_KEY,
  STUDENT_INTERVIEW_PRICE_CENTS_KEY,
  type PaidStudentInfo,
} from "@/lib/billing"
import { getStripePaymentIntentId } from "@/lib/stripe"
import type Stripe from "stripe"

export async function getStudentInterviewPrice(): Promise<{
  amountCents: number
  currency: string
}> {
  const settings = await prisma.systemSettings.findMany({
    where: {
      key: {
        in: [STUDENT_INTERVIEW_PRICE_CENTS_KEY, STUDENT_INTERVIEW_CURRENCY_KEY],
      },
    },
  })

  const priceSetting = settings.find((s) => s.key === STUDENT_INTERVIEW_PRICE_CENTS_KEY)
  const currencySetting = settings.find((s) => s.key === STUDENT_INTERVIEW_CURRENCY_KEY)
  const parsedCents = priceSetting ? parseInt(priceSetting.value, 10) : NaN

  return {
    amountCents:
      Number.isInteger(parsedCents) && parsedCents > 0
        ? parsedCents
        : DEFAULT_STUDENT_INTERVIEW_PRICE_CENTS,
    currency: (currencySetting?.value || DEFAULT_STUDENT_INTERVIEW_CURRENCY).toLowerCase(),
  }
}

export async function markInterviewPaymentPaid(params: {
  checkoutSession: Stripe.Checkout.Session
}): Promise<{ success: boolean; studentInfo: PaidStudentInfo | null }> {
  const session = params.checkoutSession
  if (session.payment_status !== "paid") {
    return { success: false, studentInfo: null }
  }

  const paymentIntentId = getStripePaymentIntentId(session.payment_intent)

  const existing = await prisma.interviewPayment.findUnique({
    where: { stripe_checkout_session_id: session.id },
  })

  if (!existing) {
    console.error("[Payments] No interview payment found for Stripe session", session.id)
    return { success: false, studentInfo: null }
  }

  if (existing.status === "paid") {
    return { success: true, studentInfo: parsePaidStudentInfo(existing.student_info) }
  }

  const updated = await prisma.interviewPayment.update({
    where: { id: existing.id },
    data: {
      status: "paid",
      paid_at: new Date(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId || existing.stripe_payment_intent_id,
    },
  })

  return { success: true, studentInfo: parsePaidStudentInfo(updated.student_info) }
}

export async function markInterviewPaymentStatus(
  checkoutSessionId: string,
  status: "expired" | "failed"
): Promise<void> {
  const existing = await prisma.interviewPayment.findUnique({
    where: { stripe_checkout_session_id: checkoutSessionId },
    select: { id: true, status: true },
  })

  if (!existing || existing.status === "paid") {
    return
  }

  await prisma.interviewPayment.update({
    where: { id: existing.id },
    data: { status },
  })
}

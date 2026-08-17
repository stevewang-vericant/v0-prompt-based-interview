import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

const COOKIE_NAME = "student_payment_access"
const ALG = "HS256"
const SESSION_TTL_SECONDS = 12 * 60 * 60

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret === "default_secret_key_change_me") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required for student payment access")
    }
    return new TextEncoder().encode("dev_only_student_payment_access_secret")
  }
  return new TextEncoder().encode(`${secret}:student-payment-access`)
}

export async function issuePaymentAccessSession(
  paymentId: string,
  interviewId: string
): Promise<void> {
  const token = await new SignJWT({ interviewId, purpose: "student-payment-access" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(paymentId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function getPaymentAccessSession(): Promise<{
  paymentId: string
  interviewId: string
} | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: [ALG],
    })
    if (
      payload.purpose !== "student-payment-access" ||
      typeof payload.sub !== "string" ||
      typeof payload.interviewId !== "string"
    ) {
      return null
    }

    return {
      paymentId: payload.sub,
      interviewId: payload.interviewId,
    }
  } catch {
    return null
  }
}

export async function requirePaymentAccess(params: {
  paymentId?: string
  interviewId?: string
}): Promise<void> {
  const session = await getPaymentAccessSession()
  if (!session) {
    throw new Error("Email verification is required to access this paid interview.")
  }
  if (params.paymentId && session.paymentId !== params.paymentId) {
    throw new Error("This payment access session does not match the interview.")
  }
  if (params.interviewId && session.interviewId !== params.interviewId) {
    throw new Error("This payment access session has expired. Verify your email again.")
  }

  const payment = await prisma.interviewPayment.findUnique({
    where: { id: session.paymentId },
    select: {
      interview_id: true,
      status: true,
      entitlement_status: true,
    },
  })
  if (
    !payment ||
    payment.status !== "paid" ||
    payment.entitlement_status !== "active" ||
    payment.interview_id !== session.interviewId
  ) {
    throw new Error("This paid interview is no longer available.")
  }
}

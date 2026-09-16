import { NextResponse } from "next/server"
import { getCurrentUser, type CurrentUser } from "@/app/actions/auth"
import { prisma } from "@/lib/prisma"
import { isStudentPayMode } from "@/lib/billing"
import { requirePaymentAccess } from "@/lib/payment-access"
import { isAllowedProxyUrl } from "@/lib/proxy-allowlist"

/**
 * Shared authorization guards for server actions and API route handlers.
 *
 * IMPORTANT: These guards do NOT change how users authenticate. They reuse the
 * existing JWT session cookie issued by `signIn` in `app/actions/auth.ts`, so a
 * user who logs in with their existing email/password keeps the exact same
 * session. These helpers only *read* that session to enforce access control on
 * endpoints that previously had none.
 */

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

/** Throwing guard for server actions: requires any authenticated user. */
export async function requireUser(): Promise<CurrentUser> {
  const { user, success } = await getCurrentUser()
  if (!success || !user) {
    throw new AuthError("Not authenticated", 401)
  }
  return user
}

/** Throwing guard for server actions: requires a super admin. */
export async function requireSuperAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  if (!user.school.is_super_admin) {
    throw new AuthError("Not authorized", 403)
  }
  return user
}

type ApiGuardResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; response: NextResponse }

function denied(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status })
}

/** Non-throwing guard for API route handlers: requires any authenticated user. */
export async function requireUserApi(): Promise<ApiGuardResult> {
  const { user, success } = await getCurrentUser()
  if (!success || !user) {
    return { ok: false, response: denied("Not authenticated", 401) }
  }
  return { ok: true, user }
}

/** Non-throwing guard for API route handlers: requires a super admin. */
export async function requireSuperAdminApi(): Promise<ApiGuardResult> {
  const result = await requireUserApi()
  if (!result.ok) return result
  if (!result.user.school.is_super_admin) {
    return {
      ok: false,
      response: denied("Insufficient permissions. Super admin access required.", 403),
    }
  }
  return result
}

/**
 * Guard for internal worker / background-processing endpoints that have no
 * legitimate browser caller (e.g. video merge, transcription processing).
 *
 * Opt-in by design so we never break an existing scheduler/cron: the lockdown
 * only activates once `INTERNAL_API_SECRET` is configured. Callers then must
 * either present the matching `x-internal-secret` header, or be a logged-in
 * super admin. When the secret is unset, access is allowed but a warning is
 * logged so the gap is visible.
 */
export async function requireInternalOrSuperAdminApi(
  request: Request
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const configured = process.env.INTERNAL_API_SECRET

  if (!configured) {
    console.warn(
      "[Security] INTERNAL_API_SECRET is not set — worker endpoint is reachable without authentication. Set INTERNAL_API_SECRET to lock it down."
    )
    return { ok: true }
  }

  const provided = request.headers.get("x-internal-secret")
  if (provided && provided === configured) {
    return { ok: true }
  }

  const adminCheck = await requireSuperAdminApi()
  if (!adminCheck.ok) return { ok: false, response: adminCheck.response }
  return { ok: true }
}

function segmentUrlBelongsToInterview(url: string, interviewId: string): boolean {
  if (!isAllowedProxyUrl(url)) return false
  try {
    const parsed = new URL(url)
    return parsed.pathname.includes(`/interviews/${interviewId}/`)
  } catch {
    return false
  }
}

/**
 * Authorize POST /api/merge-videos for student/parent browser callers.
 *
 * - Internal secret or super admin: always allowed (ops / workers)
 * - Parent interviews: intentionally open (same policy as parent upload)
 * - Student-pay interviews: require the payment-access cookie
 * - Credits interviews: interview must already exist (created by gated first upload)
 * - Segment URLs must be B2 URLs under this interview's prefix
 */
export async function authorizeMergeVideosApi(
  request: Request,
  interviewId: string,
  segments: Array<{ url?: string }> | null | undefined
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (!interviewId || typeof interviewId !== "string") {
    return { ok: false, response: denied("interviewId is required", 400) }
  }

  if (!Array.isArray(segments) || segments.length === 0) {
    return { ok: false, response: denied("No segments provided", 400) }
  }

  for (const segment of segments) {
    if (!segment?.url || !segmentUrlBelongsToInterview(segment.url, interviewId)) {
      return {
        ok: false,
        response: denied(
          "Invalid segment URL. Segments must belong to this interview on allowed storage.",
          400
        ),
      }
    }
  }

  const configured = process.env.INTERNAL_API_SECRET
  const provided = request.headers.get("x-internal-secret")
  if (configured && provided && provided === configured) {
    return { ok: true }
  }

  const adminCheck = await requireSuperAdminApi()
  if (adminCheck.ok) return { ok: true }

  const interview = await prisma.interview.findUnique({
    where: { interview_id: interviewId },
    select: {
      id: true,
      interview_type: true,
      payment_id: true,
      school: { select: { billing_mode: true } },
    },
  })

  if (!interview) {
    return {
      ok: false,
      response: denied("Interview not found. Upload segments before requesting a merge.", 404),
    }
  }

  if (interview.interview_type === "parent") {
    return { ok: true }
  }

  const payment =
    (interview.payment_id
      ? await prisma.interviewPayment.findUnique({
          where: { id: interview.payment_id },
          select: {
            id: true,
            interview_id: true,
            status: true,
            entitlement_status: true,
          },
        })
      : null) ||
    (await prisma.interviewPayment.findUnique({
      where: { interview_id: interviewId },
      select: {
        id: true,
        interview_id: true,
        status: true,
        entitlement_status: true,
      },
    }))

  if (payment || isStudentPayMode(interview.school?.billing_mode)) {
    if (
      !payment ||
      payment.status !== "paid" ||
      payment.entitlement_status !== "active" ||
      payment.interview_id !== interviewId
    ) {
      return {
        ok: false,
        response: denied("Payment access is required to merge this interview.", 403),
      }
    }
    try {
      await requirePaymentAccess({
        paymentId: payment.id,
        interviewId,
      })
    } catch (error) {
      return {
        ok: false,
        response: denied(
          error instanceof Error ? error.message : "Payment access is required.",
          403
        ),
      }
    }
    return { ok: true }
  }

  // Credits-mode student interview: existence + segment ownership is the gate.
  return { ok: true }
}

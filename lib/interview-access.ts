import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"

const LEGACY_COOKIE_NAME = "student_interview_access"
const COOKIE_PREFIX = "student_interview_access_"
const ALG = "HS256"
const SESSION_TTL_SECONDS = 12 * 60 * 60

function getCookieName(interviewId: string): string {
  const suffix = createHash("sha256")
    .update(interviewId)
    .digest("base64url")
    .slice(0, 24)
  return `${COOKIE_PREFIX}${suffix}`
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret === "default_secret_key_change_me") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required for student interview access")
    }
    return new TextEncoder().encode("dev_only_student_interview_access_secret")
  }
  return new TextEncoder().encode(`${secret}:student-interview-access`)
}

/** Issue anonymous credits-mode ownership after the first segment creates the interview. */
export async function issueInterviewAccessSession(
  interviewDbId: string,
  interviewId: string
): Promise<void> {
  const token = await new SignJWT({
    interviewId,
    purpose: "student-interview-access",
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(interviewDbId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey())

  const cookieStore = await cookies()
  cookieStore.set(getCookieName(interviewId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

/** Require the browser session issued when this anonymous interview was created. */
export async function requireInterviewAccess(params: {
  interviewDbId?: string
  interviewId: string
}): Promise<void> {
  const cookieStore = await cookies()
  const token =
    cookieStore.get(getCookieName(params.interviewId))?.value ||
    cookieStore.get(LEGACY_COOKIE_NAME)?.value
  if (!token) {
    throw new Error("Interview access session is required.")
  }

  let subject: string
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: [ALG],
    })
    if (
      payload.purpose !== "student-interview-access" ||
      typeof payload.sub !== "string" ||
      payload.interviewId !== params.interviewId
    ) {
      throw new Error("Interview access session does not match.")
    }
    subject = payload.sub
  } catch {
    throw new Error("Interview access session is invalid or expired.")
  }

  if (params.interviewDbId && subject !== params.interviewDbId) {
    throw new Error("Interview access session does not match.")
  }

  const interview = await prisma.interview.findUnique({
    where: { id: subject },
    select: { interview_id: true, status: true },
  })
  if (!interview || interview.interview_id !== params.interviewId) {
    throw new Error("Interview access session is no longer valid.")
  }
}

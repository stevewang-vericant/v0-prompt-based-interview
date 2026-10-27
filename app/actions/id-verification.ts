"use server"

import { prisma } from "@/lib/prisma"
import { toClientError } from "@/lib/errors"
import { requireSuperAdmin } from "@/lib/auth-guards"
import { requiresIdVerification, UNIVERSITY_LEVEL } from "@/lib/school-level"
import {
  uploadVerificationImage,
  type VerificationDecision,
  type VerificationImageKind,
} from "@/lib/id-verification"

export interface IdVerificationRecord {
  id: string
  interviewId: string
  studentName: string
  studentEmail: string
  schoolName: string
  schoolCode: string | null
  status: string
  idPhotoUrl: string | null
  screenshotUrl: string | null
  note: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
  completedAt: string | null
}

function mapRecord(row: {
  id: string
  interview_id: string | null
  verification_status: string | null
  id_photo_url: string | null
  verification_screenshot_url: string | null
  verification_note: string | null
  verification_reviewed_at: Date | null
  verification_reviewed_by: string | null
  created_at: Date
  completed_at: Date | null
  school: { name: string; code: string | null }
  student: { name: string; email: string } | null
}): IdVerificationRecord {
  return {
    id: row.id,
    interviewId: row.interview_id || row.id,
    studentName: row.student?.name || "Unknown student",
    studentEmail: row.student?.email || "",
    schoolName: row.school.name,
    schoolCode: row.school.code,
    status: row.verification_status || "pending",
    idPhotoUrl: row.id_photo_url,
    screenshotUrl: row.verification_screenshot_url,
    note: row.verification_note,
    reviewedAt: row.verification_reviewed_at?.toISOString() || null,
    reviewedBy: row.verification_reviewed_by,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at?.toISOString() || null,
  }
}

export async function uploadIdVerificationImage(formData: FormData): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const interviewId = String(formData.get("interviewId") || "")
    const schoolCode = String(formData.get("schoolCode") || "")
    const kind = String(formData.get("kind") || "")
    const file = formData.get("file")

    if (kind !== "id_photo" && kind !== "screenshot") {
      return { success: false, error: "Unknown photo type." }
    }
    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return { success: false, error: "No photo provided." }
    }

    const uploaded = await uploadVerificationImage({
      interviewPublicId: interviewId,
      schoolCode,
      kind: kind as VerificationImageKind,
      file,
    })
    return { success: true, url: uploaded.url }
  } catch (error) {
    console.error("[ID Verification] Upload failed:", error)
    return { success: false, error: toClientError(error, "Photo upload failed.") }
  }
}

export async function listIdVerifications(params?: {
  status?: string
  query?: string
}): Promise<{ success: boolean; records?: IdVerificationRecord[]; error?: string }> {
  try {
    await requireSuperAdmin()

    const status = params?.status && params.status !== "all" ? params.status : null
    const query = params?.query?.trim()

    const records = await prisma.interview.findMany({
      where: {
        interview_type: "student",
        school: { level: UNIVERSITY_LEVEL },
        OR: [{ id_photo_url: { not: null } }, { verification_screenshot_url: { not: null } }],
        ...(status ? { verification_status: status } : {}),
        ...(query
          ? {
              AND: [
                {
                  OR: [
                    { interview_id: { contains: query, mode: "insensitive" } },
                    { student: { name: { contains: query, mode: "insensitive" } } },
                    { student: { email: { contains: query, mode: "insensitive" } } },
                    { school: { name: { contains: query, mode: "insensitive" } } },
                    { school: { code: { contains: query, mode: "insensitive" } } },
                  ],
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        interview_id: true,
        verification_status: true,
        id_photo_url: true,
        verification_screenshot_url: true,
        verification_note: true,
        verification_reviewed_at: true,
        verification_reviewed_by: true,
        created_at: true,
        completed_at: true,
        school: { select: { name: true, code: true } },
        student: { select: { name: true, email: true } },
      },
      orderBy: { created_at: "desc" },
      take: 200,
    })

    return { success: true, records: records.map(mapRecord) }
  } catch (error) {
    console.error("[ID Verification] List failed:", error)
    return { success: false, error: toClientError(error) }
  }
}

export async function reviewIdVerification(params: {
  interviewDbId: string
  decision: VerificationDecision
  note?: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireSuperAdmin()
    const interviewDbId = params.interviewDbId?.trim()
    if (!interviewDbId) {
      return { success: false, error: "Interview is required." }
    }
    if (params.decision !== "approved" && params.decision !== "rejected") {
      return { success: false, error: "Decision must be approve or reject." }
    }

    const note = params.note?.trim() || null
    if (note && note.length > 500) {
      return { success: false, error: "Note must be 500 characters or fewer." }
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewDbId },
      select: {
        id: true,
        interview_type: true,
        student_id: true,
        id_photo_url: true,
        verification_screenshot_url: true,
        school: { select: { level: true } },
      },
    })
    if (!interview || interview.interview_type === "parent" || !requiresIdVerification(interview.school.level)) {
      return { success: false, error: "Student interview not found." }
    }
    if (!interview.id_photo_url) {
      return { success: false, error: "This interview has no ID photo yet." }
    }
    if (params.decision === "approved" && !interview.verification_screenshot_url) {
      return { success: false, error: "A screenshot from the interview is required before approval." }
    }

    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        verification_status: params.decision,
        verification_reviewed_at: new Date(),
        verification_reviewed_by: user.email,
        verification_note: params.decision === "rejected" ? note : null,
      },
    })

    if (interview.student_id) {
      await prisma.student.update({
        where: { id: interview.student_id },
        data: {
          id_verification_status: params.decision === "approved" ? "verified" : "rejected",
          id_document_url: interview.id_photo_url,
          selfie_url: interview.verification_screenshot_url,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("[ID Verification] Review failed:", error)
    return { success: false, error: toClientError(error) }
  }
}

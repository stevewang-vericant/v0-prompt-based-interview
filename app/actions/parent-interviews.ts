"use server"

import { prisma } from "@/lib/prisma"
import { toClientError } from "@/lib/errors"
import { requireUser } from "@/lib/auth-guards"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  region: process.env.B2_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
})

export interface ParentIntakeInfo {
  parentName: string
  parentEmail: string
  parentPhone?: string | null
  relationship?: string | null
  preferredLanguage: string
  studentName: string
  studentEmail?: string | null
  studentDateOfBirth?: string | null // ISO date (yyyy-mm-dd)
}

/**
 * Upload a single parent interview response segment to B2 and persist the
 * Parent / Interview / Prompt / InterviewResponse rows.
 *
 * Parent info is only passed on the first segment (responseOrder === 1), which
 * is when the Parent and Interview rows are created.
 */
export async function uploadParentVideoToB2AndSave(
  videoBlob: Blob,
  interviewId: string,
  responseOrder: number,
  promptText: string,
  promptCategory: string,
  promptResponseTime: number,
  promptPrepDuration: number,
  schoolCode: string | null,
  parentInfo?: ParentIntakeInfo,
) {
  try {
    if (!process.env.B2_BUCKET_NAME) throw new Error("B2_BUCKET_NAME not configured")

    const arrayBuffer = await videoBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const timestamp = Date.now()
    const filename =
      promptPrepDuration && promptPrepDuration > 0
        ? `interviews/${interviewId}/prep-response-${responseOrder}-${timestamp}.webm`
        : `interviews/${interviewId}/response-${responseOrder}-${timestamp}.webm`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: "video/webm",
      }),
    )

    const videoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${filename}`

    // Find or create the parent interview.
    let interview = await prisma.interview.findUnique({ where: { interview_id: interviewId } })

    if (!interview) {
      if (!schoolCode || !parentInfo) {
        return { success: true, videoUrl, data: null, dbError: "Missing school/parent info" }
      }

      const school = await prisma.school.findFirst({ where: { code: schoolCode } })
      if (!school) {
        return { success: true, videoUrl, data: null, dbError: "School not found" }
      }

      const parent = await prisma.parent.create({
        data: {
          school_id: school.id,
          name: parentInfo.parentName,
          email: parentInfo.parentEmail,
          phone: parentInfo.parentPhone || null,
          relationship: parentInfo.relationship || null,
          preferred_language: parentInfo.preferredLanguage || "English",
          student_name: parentInfo.studentName,
          student_email: parentInfo.studentEmail || null,
          student_date_of_birth: parentInfo.studentDateOfBirth
            ? new Date(parentInfo.studentDateOfBirth)
            : null,
        },
      })

      interview = await prisma.interview.create({
        data: {
          interview_id: interviewId,
          interview_type: "parent",
          school_id: school.id,
          school_code: schoolCode,
          parent_id: parent.id,
          response_language: parentInfo.preferredLanguage || "English",
          status: "in_progress",
          started_at: new Date(),
        },
      })
    }

    // Find or create the parent prompt (never touches student prompts).
    let prompt = await prisma.prompt.findFirst({
      where: { school_id: interview.school_id, prompt_text: promptText, prompt_type: "parent" },
    })

    if (!prompt && promptText) {
      prompt = await prisma.prompt.create({
        data: {
          school_id: interview.school_id,
          prompt_text: promptText,
          category: promptCategory || "General",
          preparation_time: 20,
          response_time: promptResponseTime || 90,
          prompt_type: "parent",
          is_active: true,
        },
      })
    }

    if (!prompt) {
      return { success: true, videoUrl, data: null, dbError: "Prompt not found" }
    }

    const response = await prisma.interviewResponse.create({
      data: {
        interview_id: interview.id,
        prompt_id: prompt.id,
        sequence_number: responseOrder,
        video_url: videoUrl,
        video_duration: 90,
        prep_duration:
          typeof promptPrepDuration === "number" && promptPrepDuration >= 0 ? promptPrepDuration : null,
      },
    })

    return { success: true, videoUrl, data: response }
  } catch (error) {
    console.error("[ParentInterview] Upload error:", error)
    return { success: false, error: toClientError(error, "Upload failed") }
  }
}

/**
 * Finalize the parent interview metadata after all segments are uploaded.
 */
export async function saveParentInterview(data: {
  interview_id: string
  total_duration?: number
  metadata?: Record<string, any>
}): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await prisma.interview.findUnique({
      where: { interview_id: data.interview_id },
      select: { id: true, interview_type: true },
    })
    if (!existing || existing.interview_type !== "parent") {
      return { success: false, error: "Parent interview not found" }
    }

    await prisma.interview.update({
      where: { interview_id: data.interview_id },
      data: {
        total_duration: data.total_duration,
        metadata: data.metadata || {},
        status: "processing",
        submitted_at: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error("[ParentInterview] Save error:", error)
    return { success: false, error: toClientError(error) }
  }
}

export interface ParentInterviewRecord {
  id: string
  interview_id: string | null
  created_at: string
  status: string | null
  // Owning school (useful when a super admin views interviews across schools).
  school_code: string | null
  school_name: string | null
  video_url: string | null
  video_with_prep_url: string | null
  subtitle_url: string | null
  caption_url: string | null
  total_duration: number | null
  response_language: string | null
  parent_name: string | null
  parent_email: string | null
  parent_relationship: string | null
  student_name: string | null
  student_email: string | null
  responseCount: number
  // Populated when the parent-provided student info matched a student interview.
  matched_interview_id: string | null
  matched_video_url: string | null
  matched_subtitle_url: string | null
  matched_student_name: string | null
  // True when the match was set manually by school staff (vs the automatic matcher).
  matched_manually: boolean
}

/**
 * List parent interviews. A super admin sees parent interviews across ALL
 * schools (mirroring the student dashboard); a regular school admin only sees
 * their own school's. Student interviews are never returned here.
 */
export async function getParentInterviewsBySchoolCode(
  schoolCode: string,
  limit: number = 100,
  offset: number = 0,
): Promise<{ success: boolean; interviews?: ParentInterviewRecord[]; count?: number; error?: string }> {
  try {
    const user = await requireUser()
    if (!user.school.is_super_admin && user.school.code !== schoolCode) {
      throw new Error("Not authorized")
    }

    // Super admins view every school's parent interviews; regular admins are
    // scoped to their own school.
    const where = user.school.is_super_admin
      ? { interview_type: "parent" }
      : { interview_type: "parent", school: { code: schoolCode } }

    const [interviews, count] = await prisma.$transaction([
      prisma.interview.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
        include: {
          parent: true,
          school: { select: { code: true, name: true } },
          _count: { select: { responses: true } },
        },
      }),
      prisma.interview.count({ where }),
    ])

    // Resolve matched student interviews in one query.
    const matchedIds = interviews
      .map((i) => i.matched_interview_id)
      .filter((id): id is string => Boolean(id))
    const matchedInterviews = matchedIds.length
      ? await prisma.interview.findMany({
          where: { interview_id: { in: matchedIds } },
          include: { student: { select: { name: true } } },
        })
      : []
    const matchedMap = new Map(matchedInterviews.map((m) => [m.interview_id, m]))

    const mapped: ParentInterviewRecord[] = interviews.map((i) => {
      const matched = i.matched_interview_id ? matchedMap.get(i.matched_interview_id) : undefined
      return {
        id: i.id,
        interview_id: i.interview_id,
        created_at: i.created_at.toISOString(),
        status: i.status,
        school_code: i.school?.code || null,
        school_name: i.school?.name || null,
        video_url: i.video_url,
        video_with_prep_url: i.video_with_prep_url,
        subtitle_url: i.subtitle_url,
        caption_url: i.caption_url,
        total_duration: i.total_duration,
        response_language: i.response_language,
        parent_name: i.parent?.name || null,
        parent_email: i.parent?.email || null,
        parent_relationship: i.parent?.relationship || null,
        student_name: i.parent?.student_name || null,
        student_email: i.parent?.student_email || null,
        responseCount: i._count?.responses ?? 0,
        matched_interview_id: i.matched_interview_id,
        matched_video_url: matched?.video_url || null,
        matched_subtitle_url: matched?.subtitle_url || null,
        matched_student_name: matched?.student?.name || null,
        matched_manually: i.matched_manually,
      }
    })

    return { success: true, interviews: mapped, count }
  } catch (error) {
    console.error("[ParentInterview] List error:", error)
    return { success: false, error: toClientError(error) }
  }
}

export interface StudentInterviewOption {
  interview_id: string
  student_name: string | null
  student_email: string | null
  created_at: string
  has_video: boolean
  school_code: string | null
  school_name: string | null
}

/**
 * List student interviews so staff can manually link a parent interview to the
 * correct student. A regular school admin is scoped to their own school; a super
 * admin may search students across ALL schools. Optional query filters by
 * student name/email.
 */
export async function getStudentInterviewsForSchool(
  schoolCode: string,
  query: string = '',
): Promise<{ success: boolean; interviews?: StudentInterviewOption[]; error?: string }> {
  try {
    const user = await requireUser()
    const isSuper = user.school.is_super_admin
    if (!isSuper && user.school.code !== schoolCode) {
      throw new Error('Not authorized')
    }

    const trimmed = query.trim()
    const interviews = await prisma.interview.findMany({
      where: {
        interview_type: 'student',
        interview_id: { not: null },
        // Super admins search every school; regular admins are scoped to theirs.
        ...(isSuper ? {} : { school: { code: schoolCode } }),
        ...(trimmed
          ? {
              student: {
                is: {
                  OR: [
                    { name: { contains: trimmed, mode: 'insensitive' } },
                    { email: { contains: trimmed, mode: 'insensitive' } },
                  ],
                },
              },
            }
          : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        student: { select: { name: true, email: true } },
        school: { select: { code: true, name: true } },
      },
    })

    const options: StudentInterviewOption[] = interviews.map((i) => ({
      interview_id: i.interview_id as string,
      student_name: i.student?.name || null,
      student_email: i.student?.email || null,
      created_at: i.created_at.toISOString(),
      has_video: Boolean(i.video_url),
      school_code: i.school?.code || null,
      school_name: i.school?.name || null,
    }))

    return { success: true, interviews: options }
  } catch (error) {
    console.error('[ParentInterview] List student interviews error:', error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Manually link (or unlink) a parent interview to a student interview. Pass a
 * null studentInterviewId to clear the link. Manual links set matched_manually
 * so the automatic matcher never overwrites them.
 */
export async function setParentInterviewMatch(
  parentInterviewId: string,
  studentInterviewId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser()

    const parentInterview = await prisma.interview.findUnique({
      where: { interview_id: parentInterviewId },
      select: { id: true, interview_type: true, school: { select: { code: true } } },
    })
    if (!parentInterview || parentInterview.interview_type !== 'parent') {
      return { success: false, error: 'Parent interview not found' }
    }
    if (!user.school.is_super_admin && user.school.code !== parentInterview.school?.code) {
      return { success: false, error: 'Not authorized' }
    }

    if (studentInterviewId) {
      // Validate the target is a student interview at the same school.
      const studentInterview = await prisma.interview.findUnique({
        where: { interview_id: studentInterviewId },
        select: { interview_type: true, school: { select: { code: true } } },
      })
      if (!studentInterview || studentInterview.interview_type !== 'student') {
        return { success: false, error: 'Selected student interview not found' }
      }
      // Regular admins may only link within their own school; super admins can
      // link a parent interview to a student interview at any school.
      if (
        !user.school.is_super_admin &&
        studentInterview.school?.code !== parentInterview.school?.code
      ) {
        return { success: false, error: 'Student interview belongs to a different school' }
      }
    }

    await prisma.interview.update({
      where: { id: parentInterview.id },
      data: {
        matched_interview_id: studentInterviewId,
        matched_manually: Boolean(studentInterviewId),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[ParentInterview] Set match error:', error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Conservative matching: find a completed student interview at the same school
 * whose student matches the parent-provided student identity.
 *
 * Rule: student full name matches (case-insensitive, trimmed) AND either the
 * student email matches or the date of birth matches. Returns the matching
 * interview_id, or null if there is no confident match.
 *
 * Exported for use by the video processing pipeline.
 */
export async function findMatchingStudentInterviewId(parentInterviewId: string): Promise<string | null> {
  try {
    const parentInterview = await prisma.interview.findUnique({
      where: { interview_id: parentInterviewId },
      select: { school_id: true, parent: true },
    })
    if (!parentInterview?.parent) return null

    const parent = parentInterview.parent
    const targetName = parent.student_name?.trim().toLowerCase()
    if (!targetName) return null

    const candidates = await prisma.interview.findMany({
      where: {
        interview_type: "student",
        school_id: parentInterview.school_id,
        video_url: { not: null },
        student: { is: { name: { equals: parent.student_name, mode: "insensitive" } } },
      },
      orderBy: { created_at: "desc" },
      include: { student: true },
    })

    for (const candidate of candidates) {
      const student = candidate.student
      if (!student) continue

      const emailMatches =
        Boolean(parent.student_email) &&
        Boolean(student.email) &&
        parent.student_email!.trim().toLowerCase() === student.email.trim().toLowerCase()

      const dobMatches =
        Boolean(parent.student_date_of_birth) &&
        Boolean(student.date_of_birth) &&
        new Date(parent.student_date_of_birth as Date).toISOString().slice(0, 10) ===
          new Date(student.date_of_birth as Date).toISOString().slice(0, 10)

      if (emailMatches || dobMatches) {
        return candidate.interview_id
      }
    }

    return null
  } catch (error) {
    console.error("[ParentInterview] Matching error:", error)
    return null
  }
}

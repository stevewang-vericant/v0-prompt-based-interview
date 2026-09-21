"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "./auth"
import { requireSuperAdmin, requireUser } from "@/lib/auth-guards"
import { toClientError } from "@/lib/errors"
import { requirePaymentAccess } from "@/lib/payment-access"
import { isStudentPayMode } from "@/lib/billing"
import { requireInterviewAccess } from "@/lib/interview-access"

async function authorizePaidInterviewRead(interviewId: string): Promise<void> {
  const payment = await prisma.interviewPayment.findFirst({
    where: {
      OR: [
        { interview_id: interviewId },
        { interviews: { some: { interview_id: interviewId } } },
      ],
    },
    select: { id: true, interview_id: true },
  })
  if (!payment) return

  const currentUser = await getCurrentUser()
  if (currentUser.success && currentUser.user?.school.is_super_admin) return

  await requirePaymentAccess({
    paymentId: payment.id,
    interviewId: payment.interview_id,
  })
}

/**
 * 面试数据类型定义
 */
export interface InterviewData {
  interview_id: string
  student_email: string
  student_name?: string
  video_url?: string | null
  subtitle_url?: string | null
  total_duration?: number
  school_code?: string
  metadata?: Record<string, any>
}

/**
 * 数据库中的面试记录类型 (Simplified for frontend use)
 */
export interface InterviewRecord {
  id: string
  created_at: string
  updated_at: string
  interview_id: string | null
  student_id: string | null
  school_id: string | null
  school_code: string | null
  school_level: string | null
  student_email: string | null
  student_name: string | null
  // 新增学生额外信息字段
  student_gender: string | null
  student_grade: string | null
  student_city: string | null
  student_financial_aid: boolean | null
  student_uses_cbo: boolean | null
  student_cbo_organization: string | null
  video_url: string | null
  video_with_prep_url: string | null
  subtitle_url: string | null
  total_duration: number | null
  status: string | null
  started_at: string | null
  completed_at: string | null
  submitted_at: string | null
  metadata: Record<string, any> | null
  responseCount: number
  // Cathoven 评分字段
  total_score: number | null
  fluency_score: number | null
  coherence_score: number | null
  vocabulary_score: number | null
  grammar_score: number | null
  pronunciation_score: number | null
  // Score approval workflow
  score_approved: boolean
  score_approved_at: string | null
  score_approved_by: string | null
  // Rater override scores
  rater_total_score: number | null
  rater_fluency_score: number | null
  rater_coherence_score: number | null
  rater_vocabulary_score: number | null
  rater_grammar_score: number | null
  rater_pronunciation_score: number | null
}

// Helper to map Prisma interview to InterviewRecord
function mapInterviewToRecord(interview: any): InterviewRecord {
  return {
    ...interview,
    created_at: interview.created_at.toISOString(),
    updated_at: interview.updated_at.toISOString(),
    started_at: interview.started_at?.toISOString() || null,
    completed_at: interview.completed_at?.toISOString() || null,
    submitted_at: interview.submitted_at?.toISOString() || null,
    student_email: interview.student?.email || null,
    student_name: interview.student?.name || null,
    student_gender: interview.student?.gender || null,
    student_grade: interview.student?.current_grade || null,
    student_city: interview.student?.residency_city || null,
    student_financial_aid: interview.student?.need_financial_aid || null,
    student_uses_cbo: interview.student?.uses_cbo ?? null,
    student_cbo_organization: interview.student?.cbo_organization || null,
    school_code: interview.school?.code || null,
    school_level: interview.school?.level || null,
    responseCount: interview._count?.responses ?? 0,
    metadata: interview.metadata as Record<string, any> || {},
    total_score: interview.total_score ? Number(interview.total_score) : null,
    fluency_score: interview.fluency_score ? Number(interview.fluency_score) : null,
    coherence_score: interview.coherence_score ? Number(interview.coherence_score) : null,
    vocabulary_score: interview.vocabulary_score ? Number(interview.vocabulary_score) : null,
    grammar_score: interview.grammar_score ? Number(interview.grammar_score) : null,
    pronunciation_score: interview.pronunciation_score ? Number(interview.pronunciation_score) : null,
    score_approved: interview.score_approved ?? false,
    score_approved_at: interview.score_approved_at?.toISOString() || null,
    score_approved_by: interview.score_approved_by || null,
    rater_total_score: interview.rater_total_score ? Number(interview.rater_total_score) : null,
    rater_fluency_score: interview.rater_fluency_score ? Number(interview.rater_fluency_score) : null,
    rater_coherence_score: interview.rater_coherence_score ? Number(interview.rater_coherence_score) : null,
    rater_vocabulary_score: interview.rater_vocabulary_score ? Number(interview.rater_vocabulary_score) : null,
    rater_grammar_score: interview.rater_grammar_score ? Number(interview.rater_grammar_score) : null,
    rater_pronunciation_score: interview.rater_pronunciation_score ? Number(interview.rater_pronunciation_score) : null,
  }
}

/**
 * 保存面试记录到数据库
 */
export async function saveInterview(data: InterviewData): Promise<{
  success: boolean
  error?: string
  interview?: InterviewRecord
}> {
  try {
    if (!data || typeof data.interview_id !== "string" || !data.interview_id.trim()) {
      return { success: false, error: "A valid interview_id is required." }
    }
    console.log("[DB] Saving interview to database:", data.interview_id)

    const existingForAuth = await prisma.interview.findUnique({
      where: { interview_id: data.interview_id },
      select: {
        id: true,
        payment_id: true,
        interview_type: true,
        student: { select: { email: true } },
        school: {
          select: { billing_mode: true, id: true, code: true },
        },
      },
    })

    // The upload action is the only public creation path. It establishes school,
    // student and either payment or anonymous interview ownership first.
    if (!existingForAuth) {
      return { success: false, error: "Interview not found." }
    }
    if (existingForAuth.interview_type === "parent") {
      return { success: false, error: "Parent interviews use a separate save flow." }
    }
    if (!existingForAuth.school.code || !existingForAuth.student) {
      return { success: false, error: "Interview ownership data is incomplete." }
    }
    if (
      data.school_code &&
      data.school_code.toLowerCase() !== existingForAuth.school.code.toLowerCase()
    ) {
      return { success: false, error: "Interview school does not match." }
    }
    if (
      data.student_email &&
      data.student_email.toLowerCase() !== existingForAuth.student.email.toLowerCase()
    ) {
      return { success: false, error: "Interview student does not match." }
    }

    const currentUser = await getCurrentUser()
    const staffAuthorized =
      currentUser.success &&
      !!currentUser.user &&
      (currentUser.user.school.is_super_admin ||
        currentUser.user.school.id === existingForAuth.school.id)

    if (!staffAuthorized) {
      const payment =
        (existingForAuth.payment_id
          ? await prisma.interviewPayment.findUnique({
              where: { id: existingForAuth.payment_id },
              select: { id: true, interview_id: true, status: true, entitlement_status: true },
            })
          : null) ||
        (await prisma.interviewPayment.findUnique({
          where: { interview_id: data.interview_id },
          select: { id: true, interview_id: true, status: true, entitlement_status: true },
        }))

      if (payment || isStudentPayMode(existingForAuth.school.billing_mode)) {
        if (
          !payment ||
          payment.status !== "paid" ||
          payment.entitlement_status !== "active" ||
          payment.interview_id !== data.interview_id
        ) {
          return { success: false, error: "Payment access is required to save this interview." }
        }
        await requirePaymentAccess({
          paymentId: payment.id,
          interviewId: data.interview_id,
        })
      } else {
        await requireInterviewAccess({
          interviewDbId: existingForAuth.id,
          interviewId: data.interview_id,
        })
      }
    }
    
    // 准备插入数据
    const interviewStatus = data.video_url ? 'completed' : 'processing'
    const completedAt = data.video_url ? new Date() : null
    const submittedAt = new Date()

    const interview = await prisma.interview.update({
      where: { interview_id: data.interview_id },
      data: {
        video_url: data.video_url,
        subtitle_url: data.subtitle_url,
        total_duration: data.total_duration,
        metadata: data.metadata || {},
        status: interviewStatus,
        completed_at: completedAt,
        submitted_at: submittedAt
      },
      include: {
        student: true,
        school: true,
        _count: { select: { responses: true } }
      }
    })
    
    console.log("[DB] Interview saved/updated successfully:", interview.id)
    return {
      success: true,
      interview: mapInterviewToRecord(interview)
    }
  } catch (error) {
    console.error("[DB] Unexpected error:", error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * 获取所有完成的面试列表
 */
export async function getInterviews(
  limit: number = 100,
  offset: number = 0
): Promise<{
  success: boolean
  interviews?: InterviewRecord[]
  count?: number
  error?: string
}> {
  try {
    // Listing every interview across all schools is a super-admin-only operation.
    await requireSuperAdmin()

    console.log("[DB] Fetching interviews, limit:", limit, "offset:", offset)
    
    const [interviews, count] = await prisma.$transaction([
      prisma.interview.findMany({
        where: { interview_type: 'student' },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: { student: true, school: true, _count: { select: { responses: true } } }
      }),
      prisma.interview.count({ where: { interview_type: 'student' } })
    ])
    
    console.log("[DB] Fetched", interviews.length, "interviews")
    return {
      success: true,
      interviews: interviews.map(mapInterviewToRecord),
      count
    }
  } catch (error) {
    console.error("[DB] Unexpected error:", error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * 根据 interview_id 获取单个面试记录
 */
export async function getInterviewById(interviewId: string): Promise<{
  success: boolean
  interview?: InterviewRecord
  error?: string
}> {
  try {
    console.log("[DB] Fetching interview by ID:", interviewId)
    await authorizePaidInterviewRead(interviewId)
    
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      include: { student: true, school: true, _count: { select: { responses: true } } }
    })
    
    if (!interview) {
      return { success: false, error: 'Interview not found' }
    }
    
    console.log("[DB] Interview found:", interview.id)
    return {
      success: true,
      interview: mapInterviewToRecord(interview)
    }
  } catch (error) {
    console.error("[DB] Unexpected error:", error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * 根据学生邮箱获取面试列表
 */
export async function getInterviewsByEmail(studentEmail: string): Promise<{
  success: boolean
  interviews?: InterviewRecord[]
  error?: string
}> {
  try {
    await requireSuperAdmin()

    console.log("[DB] Fetching interviews for student:", studentEmail)
    
    // 需要先找到学生 ID
    // 或者直接关联查询
    const interviews = await prisma.interview.findMany({
      where: {
        interview_type: 'student',
        student: {
          email: studentEmail
        }
      },
      orderBy: { created_at: 'desc' },
      include: { student: true, school: true, _count: { select: { responses: true } } }
    })
    
    console.log("[DB] Found", interviews.length, "interviews for student")
    return {
      success: true,
      interviews: interviews.map(mapInterviewToRecord)
    }
  } catch (error) {
    console.error("[DB] Unexpected error:", error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * 更新面试状态
 */
export async function updateInterviewStatus(
  interviewId: string,
  status: 'not_started' | 'in_progress' | 'completed' | 'reviewing' | 'scored'
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await requireSuperAdmin()

    console.log("[DB] Updating interview status:", interviewId, "->", status)
    
    await prisma.interview.update({
      where: { interview_id: interviewId },
      data: { status }
    })
    
    console.log("[DB] Status updated successfully")
    return { success: true }
  } catch (error) {
    console.error("[DB] Unexpected error:", error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * 根据学校代码获取面试列表
 */
export async function getInterviewsBySchoolCode(
  schoolCode: string,
  limit: number = 100,
  offset: number = 0
): Promise<{
  success: boolean
  interviews?: InterviewRecord[]
  count?: number
  error?: string
}> {
  try {
    // A school admin may only read their own school's interviews; super admins
    // may read any school. This prevents cross-tenant data access via a forged
    // school code.
    const user = await requireUser()
    if (!user.school.is_super_admin && user.school.code !== schoolCode) {
      throw new Error("Not authorized")
    }

    console.log("[DB] Fetching interviews for school:", schoolCode)
    
    const [interviews, count] = await prisma.$transaction([
      prisma.interview.findMany({
        where: {
          interview_type: 'student',
          school: {
            code: schoolCode
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: { student: true, school: true, _count: { select: { responses: true } } }
      }),
      prisma.interview.count({
        where: {
          interview_type: 'student',
          school: {
            code: schoolCode
          }
        }
      })
    ])
    
    console.log("[DB] Found", interviews.length, "interviews for school")
    return {
      success: true,
      interviews: interviews.map(mapInterviewToRecord),
      count
    }
  } catch (error) {
    console.error("[DB] Unexpected error:", error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * Delete an incomplete interview and its cascaded responses.
 * Safety guard: only deletes if video_url is null (not yet fully processed).
 */
export async function deleteIncompleteInterview(interviewId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.log("[DB] Attempting to delete incomplete interview:", interviewId)

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: { id: true, video_url: true, payment_id: true }
    })

    if (!interview) {
      console.log("[DB] Interview not found, nothing to delete")
      return { success: true }
    }

    if (interview.video_url) {
      console.log("[DB] Interview already has a merged video, refusing to delete")
      return { success: false, error: "Cannot delete a completed interview with a processed video" }
    }

    const paidInterview =
      interview.payment_id ||
      (await prisma.interviewPayment.findUnique({
        where: { interview_id: interviewId },
        select: { id: true },
      }))?.id
    if (paidInterview) {
      return {
        success: false,
        error: "Paid interviews must be restarted through email verification.",
      }
    }

    await prisma.interview.delete({
      where: { interview_id: interviewId }
    })

    console.log("[DB] Incomplete interview deleted successfully")
    return { success: true }
  } catch (error) {
    console.error("[DB] Failed to delete incomplete interview:", error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * 根据管理员邮箱获取学校信息和权限
 */
export async function getSchoolByAdminEmail(adminEmail: string): Promise<{
  success: boolean
  school?: {
    code: string
    name: string
    is_super_admin: boolean
  }
  error?: string
}> {
  try {
    await requireSuperAdmin()

    console.log("[DB] Fetching school for admin:", adminEmail)
    
    // 新架构：管理员就是学校本身，或者学校有管理员
    // Schema: School table has email and is_super_admin
    
    const school = await prisma.school.findUnique({
      where: { email: adminEmail },
      select: {
        code: true,
        name: true,
        is_super_admin: true
      }
    })
    
    if (!school) {
      return { success: false, error: 'Admin not found' }
    }
    
    console.log("[DB] Admin found, school:", school.code, "super admin:", school.is_super_admin)
    return {
      success: true,
      school: {
        code: school.code || '',
        name: school.name,
        is_super_admin: school.is_super_admin
      }
    }
  } catch (error) {
    console.error("[DB] Unexpected error:", error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * 检查用户是否为超级管理员
 */
export async function checkSuperAdmin(email: string): Promise<{
  success: boolean
  is_super_admin: boolean
  error?: string
}> {
  try {
    await requireSuperAdmin()

    console.log("[DB] Checking super admin status for:", email)
    
    const school = await prisma.school.findUnique({
      where: { email },
      select: { is_super_admin: true }
    })
    
    const isSuperAdmin = !!school?.is_super_admin
    console.log("[DB] Super admin status:", isSuperAdmin)
    
    return {
      success: true,
      is_super_admin: isSuperAdmin
    }
  } catch (error) {
    console.error("[DB] Unexpected error:", error)
    return {
      success: false,
      is_super_admin: false,
      error: toClientError(error)
    }
  }
}

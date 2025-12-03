"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "./auth"

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
  student_email: string | null
  student_name: string | null
  // 新增学生额外信息字段
  student_gender: string | null
  student_grade: string | null
  student_city: string | null
  student_financial_aid: boolean | null
  video_url: string | null
  subtitle_url: string | null
  total_duration: number | null
  status: string | null
  started_at: string | null
  completed_at: string | null
  submitted_at: string | null
  metadata: Record<string, any> | null
  // 评分字段
  total_score: number | null
  fluency_score: number | null
  coherence_score: number | null
  vocabulary_score: number | null
  grammar_score: number | null
  pronunciation_score: number | null
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
    school_code: interview.school?.code || null,
    metadata: interview.metadata as Record<string, any> || {},
    total_score: interview.total_score ? Number(interview.total_score) : null,
    fluency_score: interview.fluency_score ? Number(interview.fluency_score) : null,
    coherence_score: interview.coherence_score ? Number(interview.coherence_score) : null,
    vocabulary_score: interview.vocabulary_score ? Number(interview.vocabulary_score) : null,
    grammar_score: interview.grammar_score ? Number(interview.grammar_score) : null,
    pronunciation_score: interview.pronunciation_score ? Number(interview.pronunciation_score) : null,
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
    console.log("[DB] Saving interview to database:", data.interview_id)
    
    // 准备插入数据
    const interviewStatus = data.video_url ? 'completed' : 'processing'
    const completedAt = data.video_url ? new Date() : null
    const submittedAt = new Date()

    // 我们需要先找到或创建 School 和 Student，因为 Prisma 需要 connect
    // 假设 School 和 Student 已经存在。如果不存在，逻辑会变得复杂。
    // 为了简化迁移，我们尝试查找关联记录。

    // 1. Find School by code
    let schoolId: string | undefined
    if (data.school_code) {
      const school = await prisma.school.findFirst({ where: { code: data.school_code } })
      if (school) schoolId = school.id
    }

    // 2. Find Student by email
    let studentId: string | undefined
    if (data.student_email) {
      const student = await prisma.student.findUnique({ where: { email: data.student_email } })
      if (student) studentId = student.id
    }

    // 如果缺少关联 ID，我们可能无法创建记录（Prisma 外键约束）
    // 但我们可以尝试 upsert。如果是 update，就不需要关联 ID。
    // 如果是 create，必须要有。
    
    // 如果没有 schoolId 或 studentId，我们无法创建。
    // 这里必须假设数据完整性。如果缺失，返回错误。
    if (!schoolId || !studentId) {
        // 尝试仅更新现有记录
        const existing = await prisma.interview.findUnique({
            where: { interview_id: data.interview_id }
        })
        
        if (existing) {
             const updated = await prisma.interview.update({
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
                 include: { student: true, school: true }
             })
             return { success: true, interview: mapInterviewToRecord(updated) }
        } else {
             return { success: false, error: "Cannot create interview: School or Student not found" }
        }
    }

    const interview = await prisma.interview.upsert({
      where: { interview_id: data.interview_id },
      update: {
        video_url: data.video_url,
        subtitle_url: data.subtitle_url,
        total_duration: data.total_duration,
        metadata: data.metadata || {},
        status: interviewStatus,
        completed_at: completedAt,
        submitted_at: submittedAt
      },
      create: {
        interview_id: data.interview_id,
        student_id: studentId,
        school_id: schoolId,
        video_url: data.video_url,
        subtitle_url: data.subtitle_url,
        total_duration: data.total_duration,
        metadata: data.metadata || {},
        status: interviewStatus,
        completed_at: completedAt,
        submitted_at: submittedAt,
        started_at: new Date() // 假设现在开始，如果前端没传
      },
      include: {
        student: true,
        school: true
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
      error: error instanceof Error ? error.message : 'Unknown error'
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
    console.log("[DB] Fetching interviews, limit:", limit, "offset:", offset)
    
    const [interviews, count] = await prisma.$transaction([
      prisma.interview.findMany({
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: { student: true, school: true }
      }),
      prisma.interview.count()
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
      error: error instanceof Error ? error.message : 'Unknown error'
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
    
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      include: { student: true, school: true }
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
      error: error instanceof Error ? error.message : 'Unknown error'
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
    console.log("[DB] Fetching interviews for student:", studentEmail)
    
    // 需要先找到学生 ID
    // 或者直接关联查询
    const interviews = await prisma.interview.findMany({
      where: {
        student: {
          email: studentEmail
        }
      },
      orderBy: { created_at: 'desc' },
      include: { student: true, school: true }
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
      error: error instanceof Error ? error.message : 'Unknown error'
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
      error: error instanceof Error ? error.message : 'Unknown error'
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
    console.log("[DB] Fetching interviews for school:", schoolCode)
    
    const [interviews, count] = await prisma.$transaction([
      prisma.interview.findMany({
        where: {
          school: {
            code: schoolCode
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: { student: true, school: true }
      }),
      prisma.interview.count({
        where: {
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
      error: error instanceof Error ? error.message : 'Unknown error'
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
      error: error instanceof Error ? error.message : 'Unknown error'
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
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * 面试数据类型定义
 */
export interface InterviewData {
  interview_id: string
  student_email: string
  student_name?: string
  video_url: string
  subtitle_url?: string
  total_duration?: number
  school_code?: string
  metadata?: Record<string, any>
}

/**
 * 数据库中的面试记录类型
 */
export interface InterviewRecord {
  id: string
  created_at: string
  updated_at: string
  interview_id: string
  student_id: string | null
  school_id: string | null
  school_code: string | null
  student_email: string | null
  student_name: string | null
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

/**
 * 保存面试记录到数据库
 * 
 * @param data 面试数据
 * @returns 保存结果
 */
export async function saveInterview(data: InterviewData): Promise<{
  success: boolean
  error?: string
  interview?: InterviewRecord
}> {
  try {
    console.log("[DB] Saving interview to database:", data.interview_id)
    
    // 使用 admin client 绕过 RLS（服务器端操作）
    const supabase = createAdminClient()
    
    // 准备插入数据
    const insertData = {
      interview_id: data.interview_id,
      student_email: data.student_email,
      student_name: data.student_name,
      video_url: data.video_url,
      subtitle_url: data.subtitle_url,
      total_duration: data.total_duration,
      school_code: data.school_code,
      metadata: data.metadata || {},
      status: 'completed',
      completed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    }
    
    // 使用 upsert 避免重复键错误（第一个分段可能已经创建了记录）
    const { data: interview, error } = await supabase
      .from('interviews')
      .upsert(insertData, {
        onConflict: 'interview_id', // 基于 interview_id 进行冲突检测
        ignoreDuplicates: false // 如果冲突，更新记录
      })
      .select()
      .single()
    
    if (error) {
      console.error("[DB] Error saving interview:", error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log("[DB] Interview saved/updated successfully:", interview.id)
    return {
      success: true,
      interview
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
 * 
 * @param limit 返回数量限制（默认100）
 * @param offset 分页偏移量
 * @returns 面试列表
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
    
    const supabase = await createClient()
    
    // 查询面试列表，按创建时间倒序排列
    const { data: interviews, error, count } = await supabase
      .from('interviews')
      .select('*', { count: 'exact' })
      .not('video_url', 'is', null) // 只获取有视频的面试
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error("[DB] Error fetching interviews:", error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log("[DB] Fetched", interviews?.length || 0, "interviews")
    return {
      success: true,
      interviews: interviews || [],
      count: count || 0
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
 * 
 * @param interviewId 面试ID（客户端生成的）
 * @returns 面试记录
 */
export async function getInterviewById(interviewId: string): Promise<{
  success: boolean
  interview?: InterviewRecord
  error?: string
}> {
  try {
    console.log("[DB] Fetching interview by ID:", interviewId)
    
    const supabase = await createClient()
    
    const { data: interview, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('interview_id', interviewId)
      .single()
    
    if (error) {
      console.error("[DB] Error fetching interview:", error)
      return {
        success: false,
        error: error.message
      }
    }
    
    if (!interview) {
      return {
        success: false,
        error: 'Interview not found'
      }
    }
    
    console.log("[DB] Interview found:", interview.id)
    return {
      success: true,
      interview
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
 * 
 * @param studentEmail 学生邮箱
 * @returns 面试列表
 */
export async function getInterviewsByEmail(studentEmail: string): Promise<{
  success: boolean
  interviews?: InterviewRecord[]
  error?: string
}> {
  try {
    console.log("[DB] Fetching interviews for student:", studentEmail)
    
    const supabase = await createClient()
    
    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('student_email', studentEmail)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error("[DB] Error fetching interviews:", error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log("[DB] Found", interviews?.length || 0, "interviews for student")
    return {
      success: true,
      interviews: interviews || []
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
 * 
 * @param interviewId 面试ID
 * @param status 新状态
 * @returns 更新结果
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
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('interviews')
      .update({ status })
      .eq('interview_id', interviewId)
    
    if (error) {
      console.error("[DB] Error updating status:", error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log("[DB] Status updated successfully")
    return {
      success: true
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
 * 根据学校代码获取面试列表
 * 
 * @param schoolCode 学校代码（如 harvard）
 * @param limit 返回数量限制
 * @param offset 分页偏移量
 * @returns 面试列表
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
    
    const supabase = await createClient()
    
    const { data: interviews, error, count } = await supabase
      .from('interviews')
      .select('*', { count: 'exact' })
      .eq('school_code', schoolCode)
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error("[DB] Error fetching interviews:", error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log("[DB] Found", interviews?.length || 0, "interviews for school")
    return {
      success: true,
      interviews: interviews || [],
      count: count || 0
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
 * 
 * @param adminEmail 管理员邮箱
 * @returns 学校信息和权限
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
    
    const supabase = await createClient()
    
    // 查找管理员记录
    const { data: adminRecords, error } = await supabase
      .from('school_admins')
      .select(`
        id,
        email,
        is_super_admin,
        schools:school_id (
          id,
          code,
          name
        )
      `)
      .eq('email', adminEmail)
      .limit(1)
      .single()
    
    if (error) {
      console.error("[DB] Error fetching admin:", error)
      return {
        success: false,
        error: error.message
      }
    }
    
    if (!adminRecords) {
      return {
        success: false,
        error: 'Admin not found'
      }
    }
    
    const schoolData = adminRecords.schools as any
    
    console.log("[DB] Admin found, school:", schoolData?.code, "super admin:", adminRecords.is_super_admin)
    return {
      success: true,
      school: {
        code: schoolData?.code || '',
        name: schoolData?.name || '',
        is_super_admin: adminRecords.is_super_admin || false
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
 * 
 * @param email 用户邮箱
 * @returns 是否为超级管理员
 */
export async function checkSuperAdmin(email: string): Promise<{
  success: boolean
  is_super_admin: boolean
  error?: string
}> {
  try {
    console.log("[DB] Checking super admin status for:", email)
    
    const supabase = await createClient()
    
    const { data: admin, error } = await supabase
      .from('school_admins')
      .select('is_super_admin')
      .eq('email', email)
      .eq('is_super_admin', true)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("[DB] Error checking super admin:", error)
      return {
        success: false,
        is_super_admin: false,
        error: error.message
      }
    }
    
    const isSuperAdmin = !!admin
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



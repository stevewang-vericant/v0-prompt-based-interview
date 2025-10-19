"use server"

import { createClient } from "@/lib/supabase/server"

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
  student_email: string | null
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
    
    const supabase = await createClient()
    
    // 准备插入数据
    const insertData = {
      interview_id: data.interview_id,
      student_email: data.student_email,
      video_url: data.video_url,
      subtitle_url: data.subtitle_url,
      total_duration: data.total_duration,
      metadata: data.metadata || {},
      status: 'completed',
      completed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    }
    
    // 插入到数据库
    const { data: interview, error } = await supabase
      .from('interviews')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error("[DB] Error saving interview:", error)
      return {
        success: false,
        error: error.message
      }
    }
    
    console.log("[DB] Interview saved successfully:", interview.id)
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


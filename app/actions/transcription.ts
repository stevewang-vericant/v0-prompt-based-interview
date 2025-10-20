"use server"

import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * 转录状态类型
 */
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * 转录元数据接口
 */
export interface TranscriptionMetadata {
  language?: string
  duration?: number
  confidence?: number
  segments?: Array<{
    start: number
    end: number
    text: string
    confidence?: number
  }>
  createdAt: string
  model: string
}

/**
 * 创建转录任务
 * 
 * @param interviewId 面试 ID
 * @param videoUrl 视频 URL
 * @returns 任务创建结果
 */
export async function createTranscriptionJob(
  interviewId: string,
  videoUrl: string
): Promise<{
  success: boolean
  error?: string
  jobId?: string
}> {
  try {
    console.log("[Transcription] Creating job for interview:", interviewId)
    
    const supabase = await createClient()
    
    // 检查是否已有进行中的任务
    const { data: existingJob } = await supabase
      .from('transcription_jobs')
      .select('*')
      .eq('interview_id', interviewId)
      .in('status', ['pending', 'processing'])
      .single()
    
    if (existingJob) {
      console.log("[Transcription] Job already exists:", existingJob.job_id)
      return {
        success: true,
        jobId: existingJob.job_id
      }
    }
    
    // 生成任务 ID
    const jobId = `transcription_${interviewId}_${Date.now()}`
    
    // 创建转录任务记录
    const { data: job, error: jobError } = await supabase
      .from('transcription_jobs')
      .insert({
        interview_id: interviewId,
        job_id: jobId,
        status: 'pending'
      })
      .select()
      .single()
    
    if (jobError) {
      console.error("[Transcription] Error creating job:", jobError)
      return {
        success: false,
        error: jobError.message
      }
    }
    
    // 更新面试记录的转录状态
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        transcription_status: 'pending',
        transcription_job_id: jobId
      })
      .eq('interview_id', interviewId)
    
    if (updateError) {
      console.error("[Transcription] Error updating interview:", updateError)
      return {
        success: false,
        error: updateError.message
      }
    }
    
    console.log("[Transcription] Job created successfully:", jobId)
    return {
      success: true,
      jobId
    }
    
  } catch (error) {
    console.error("[Transcription] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 处理转录任务（从视频 URL 获取音频并转录）
 * 
 * @param jobId 任务 ID
 * @param videoUrl 视频 URL
 * @returns 处理结果
 */
export async function processTranscriptionJob(
  jobId: string,
  videoUrl: string
): Promise<{
  success: boolean
  error?: string
  transcription?: string
  metadata?: TranscriptionMetadata
}> {
  try {
    console.log("[Transcription] Processing job:", jobId)
    
    const supabase = await createClient()
    
    // 更新任务状态为处理中
    await supabase
      .from('transcription_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
    
    // 从视频 URL 下载音频
    console.log("[Transcription] Downloading video from:", videoUrl)
    const videoResponse = await fetch(videoUrl)
    
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }
    
    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    
    // 使用 FFmpeg 提取音频（这里简化处理，实际项目中可能需要服务端 FFmpeg）
    // 注意：在 Vercel 环境中，我们可能需要使用不同的方法
    // 暂时假设视频 URL 可以直接用于 Whisper API
    console.log("[Transcription] Video downloaded, size:", videoBlob.size, "bytes")
    
    // 调用 OpenAI Whisper API
    console.log("[Transcription] Calling OpenAI Whisper API...")
    const transcription = await openai.audio.transcriptions.create({
      file: new File([videoBlob], "interview.mp4", { type: "video/mp4" }),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    })
    
    console.log("[Transcription] Whisper API completed")
    
    // 准备元数据
    const segments = transcription.segments || []
    const metadata: TranscriptionMetadata = {
      language: transcription.language,
      duration: transcription.duration,
      confidence: segments.length > 0 
        ? segments.reduce((acc, seg) => acc + (seg.avg_logprob || 0), 0) / segments.length
        : undefined,
      segments: segments.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.avg_logprob
      })),
      createdAt: new Date().toISOString(),
      model: "whisper-1"
    }
    
    // 更新任务状态为完成
    await supabase
      .from('transcription_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
    
    // 更新面试记录
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        transcription_status: 'completed',
        transcription_text: transcription.text,
        transcription_metadata: metadata
      })
      .eq('transcription_job_id', jobId)
    
    if (updateError) {
      console.error("[Transcription] Error updating interview:", updateError)
      throw new Error(updateError.message)
    }
    
    console.log("[Transcription] Job completed successfully")
    return {
      success: true,
      transcription: transcription.text,
      metadata
    }
    
  } catch (error) {
    console.error("[Transcription] Job failed:", error)
    
    // 更新任务状态为失败
    const supabase = await createClient()
    await supabase
      .from('transcription_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
    
    // 更新面试记录
    await supabase
      .from('interviews')
      .update({
        transcription_status: 'failed'
      })
      .eq('transcription_job_id', jobId)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 获取转录状态
 * 
 * @param interviewId 面试 ID
 * @returns 转录状态信息
 */
export async function getTranscriptionStatus(interviewId: string): Promise<{
  success: boolean
  status?: TranscriptionStatus
  transcription?: string
  metadata?: TranscriptionMetadata
  error?: string
}> {
  try {
    console.log("[Transcription] Getting status for interview:", interviewId)
    
    const supabase = await createClient()
    
    const { data: interview, error } = await supabase
      .from('interviews')
      .select(`
        transcription_status,
        transcription_text,
        transcription_metadata,
        transcription_job_id
      `)
      .eq('interview_id', interviewId)
      .single()
    
    if (error) {
      console.error("[Transcription] Error fetching status:", error)
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
    
    return {
      success: true,
      status: interview.transcription_status as TranscriptionStatus,
      transcription: interview.transcription_text,
      metadata: interview.transcription_metadata as TranscriptionMetadata
    }
    
  } catch (error) {
    console.error("[Transcription] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 启动转录任务（异步处理）
 * 
 * @param interviewId 面试 ID
 * @param videoUrl 视频 URL
 * @returns 启动结果
 */
export async function startTranscription(interviewId: string, videoUrl: string): Promise<{
  success: boolean
  error?: string
  jobId?: string
}> {
  try {
    // 创建任务
    const createResult = await createTranscriptionJob(interviewId, videoUrl)
    
    if (!createResult.success) {
      return createResult
    }
    
    // 异步处理任务（不等待完成）
    processTranscriptionJob(createResult.jobId!, videoUrl).catch(error => {
      console.error("[Transcription] Async job failed:", error)
    })
    
    return {
      success: true,
      jobId: createResult.jobId
    }
    
  } catch (error) {
    console.error("[Transcription] Error starting transcription:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

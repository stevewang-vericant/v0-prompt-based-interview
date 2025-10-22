"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
  videoUrl: string,
  interviewUuid: string
): Promise<{
  success: boolean
  error?: string
  jobId?: string
}> {
  try {
    console.log("[Transcription] ========== CREATE JOB START ==========")
    console.log("[Transcription] Interview ID (custom):", interviewId)
    console.log("[Transcription] Video URL:", videoUrl)
    
    const supabase = createAdminClient()
    
    console.log("[Transcription] Using provided interview UUID:", interviewUuid)
    
    // 检查是否已有进行中的任务
    console.log("[Transcription] Checking for existing jobs...")
    const { data: existingJob } = await supabase
      .from('transcription_jobs')
      .select('*')
      .eq('interview_id', interviewUuid)
      .in('status', ['pending', 'processing'])
      .single()
    
    if (existingJob) {
      console.log("[Transcription] ⚠️ Job already exists:", existingJob.job_id)
      console.log("[Transcription] Status:", existingJob.status)
      console.log("[Transcription] ========== CREATE JOB END (SKIPPED) ==========")
      return {
        success: true,
        jobId: existingJob.job_id
      }
    }
    
    console.log("[Transcription] No existing job found, creating new one...")
    
    // 生成任务 ID
    const jobId = `transcription_${interviewId}_${Date.now()}`
    console.log("[Transcription] Generated Job ID:", jobId)
    
    // 创建转录任务记录（使用 UUID）
    console.log("[Transcription] Inserting into transcription_jobs table...")
    const { data: job, error: jobError } = await supabase
      .from('transcription_jobs')
      .insert({
        interview_id: interviewUuid,
        job_id: jobId,
        status: 'pending',
        video_url: videoUrl
      })
      .select()
      .single()
    
    if (jobError) {
      console.error("[Transcription] ✗ Error creating job in database")
      console.error("[Transcription] Error:", jobError)
      console.error("[Transcription] ========== CREATE JOB END (FAILED) ==========")
      return {
        success: false,
        error: jobError.message
      }
    }
    
    console.log("[Transcription] ✓ Job record created in database")
    
    // 更新面试记录的转录状态（使用 UUID）
    console.log("[Transcription] Updating interviews table with job info...")
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        transcription_status: 'pending',
        transcription_job_id: jobId
      })
      .eq('id', interviewUuid)
    
    if (updateError) {
      console.error("[Transcription] ✗ Error updating interview status")
      console.error("[Transcription] Error:", updateError)
      console.error("[Transcription] ========== CREATE JOB END (PARTIAL FAILURE) ==========")
      return {
        success: false,
        error: updateError.message
      }
    }
    
    console.log("[Transcription] ✓ Interview status updated successfully")
    console.log("[Transcription] ✓ Job created successfully:", jobId)
    console.log("[Transcription] ========== CREATE JOB END (SUCCESS) ==========")
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
  interviewUUID?: string
): Promise<{
  success: boolean
  error?: string
  transcription?: string
  metadata?: TranscriptionMetadata
}> {
  try {
    console.log("[Transcription] ========== PROCESS JOB START ==========")
    console.log("[Transcription] Job ID:", jobId)
    console.log("[Transcription] Interview UUID:", interviewUUID)
    
    const supabase = createAdminClient()
    
    // 1. Fetch job details to get video URL
    const { data: job, error: jobError } = await supabase
      .from('transcription_jobs')
      .select('interview_id, video_url, metadata')
      .eq('job_id', jobId)
      .single()

    if (jobError || !job) {
      console.error("[Transcription] Job not found or error fetching job:", jobError)
      return { success: false, error: jobError?.message || 'Job not found' }
    }

    const actualInterviewUUID = interviewUUID || job.interview_id
    const videoUrl = job.video_url
    console.log("[Transcription] Video URL:", videoUrl)
    
    // 更新任务状态为处理中
    console.log("[Transcription] Updating job status to 'processing'...")
    const { error: updateStatusError } = await supabase
      .from('transcription_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
    
    if (updateStatusError) {
      console.error("[Transcription] ⚠️ Failed to update job status:", updateStatusError)
    } else {
      console.log("[Transcription] ✓ Job status updated to 'processing'")
    }
    
    // 从视频 URL 下载音频
    console.log("[Transcription] Downloading video from B2...")
    console.log("[Transcription] URL:", videoUrl)
    const videoResponse = await fetch(videoUrl)
    
    if (!videoResponse.ok) {
      console.error("[Transcription] ✗ Failed to download video")
      console.error("[Transcription] Status:", videoResponse.status, videoResponse.statusText)
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }
    
    console.log("[Transcription] ✓ Video download successful")
    console.log("[Transcription] Response status:", videoResponse.status)
    console.log("[Transcription] Content-Type:", videoResponse.headers.get('Content-Type'))
    
    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    
    console.log("[Transcription] ✓ Video buffer created")
    console.log("[Transcription] Buffer size:", videoBuffer.byteLength, "bytes")
    console.log("[Transcription] Blob size:", videoBlob.size, "bytes")
    console.log("[Transcription] Blob type:", videoBlob.type)
    
    // 检查 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Transcription] ✗ OPENAI_API_KEY not configured!")
      throw new Error("OPENAI_API_KEY environment variable not set")
    }
    console.log("[Transcription] ✓ OpenAI API Key is configured")
    
    // 调用 OpenAI Whisper API
    console.log("[Transcription] Calling OpenAI Whisper API...")
    console.log("[Transcription] Model: whisper-1")
    console.log("[Transcription] File size:", videoBlob.size, "bytes")
    console.log("[Transcription] Format: verbose_json with segments")
    
    const startTime = Date.now()
    const transcription = await openai.audio.transcriptions.create({
      file: new File([videoBlob], "interview.mp4", { type: "video/mp4" }),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    })
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log("[Transcription] ✓ Whisper API completed successfully!")
    console.log("[Transcription] Elapsed time:", elapsedTime, "seconds")
    console.log("[Transcription] Transcription text length:", transcription.text?.length || 0, "characters")
    console.log("[Transcription] Language detected:", transcription.language)
    console.log("[Transcription] Duration:", transcription.duration, "seconds")
    console.log("[Transcription] Segments count:", transcription.segments?.length || 0)
    
    // 准备元数据
    console.log("[Transcription] Preparing metadata...")
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
    console.log("[Transcription] ✓ Metadata prepared")
    console.log("[Transcription] Average confidence:", metadata.confidence?.toFixed(4))
    
    // 更新任务状态为完成
    console.log("[Transcription] Updating job status to 'completed'...")
    const { error: jobUpdateError } = await supabase
      .from('transcription_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
    
    if (jobUpdateError) {
      console.error("[Transcription] ⚠️ Failed to update job status:", jobUpdateError)
    } else {
      console.log("[Transcription] ✓ Job status updated to 'completed'")
    }
    
    // 生成AI摘要
    console.log("[Transcription] Generating AI summary...")
    let aiSummary = null
    
    try {
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: transcription.text }),
      })
      
      const summaryData = await summaryResponse.json()
      
      if (summaryData.success) {
        aiSummary = summaryData.summary
        console.log("[Transcription] ✓ AI summary generated successfully")
      } else {
        console.warn("[Transcription] ⚠️ Failed to generate AI summary:", summaryData.error)
      }
    } catch (error) {
      console.warn("[Transcription] ⚠️ AI summary generation failed:", error)
    }
    
    // 更新面试记录
    console.log("[Transcription] Updating interview with transcription results...")
    const updateData: any = {
      transcription_status: 'completed',
      transcription_text: transcription.text,
      transcription_metadata: metadata
    }
    
    // 如果ai_summary字段存在，则包含它
    if (aiSummary) {
      updateData.ai_summary = aiSummary
    }
    
    // 直接使用传入的interviewUUID来更新
    if (!interviewUUID) {
      throw new Error('Interview UUID is required for updating interview record')
    }
    
    console.log("[Transcription] Updating interview record with UUID:", interviewUUID)
    const { error: updateError } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', interviewUUID)
    
    if (updateError) {
      console.error("[Transcription] ✗ Failed to update interview:", updateError)
      console.error("[Transcription] ========== PROCESS JOB END (FAILED) ==========")
      throw new Error(updateError.message)
    }
    
    console.log("[Transcription] ✓ Interview updated with transcription")
    console.log("[Transcription] ✓ Job completed successfully!")
    console.log("[Transcription] ========== PROCESS JOB END (SUCCESS) ==========")
    return {
      success: true,
      transcription: transcription.text,
      metadata
    }
    
  } catch (error) {
    console.error("[Transcription] ✗ Job processing failed with exception")
    console.error("[Transcription] Error:", error)
    console.error("[Transcription] Stack:", error instanceof Error ? error.stack : 'No stack trace')
    console.error("[Transcription] ========== PROCESS JOB END (EXCEPTION) ==========")
    
    // 更新任务状态为失败
    const supabase = createAdminClient()
    console.log("[Transcription] Updating job status to 'failed'...")
    const { error: jobUpdateError } = await supabase
      .from('transcription_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
    
    if (jobUpdateError) {
      console.error("[Transcription] ⚠️ Failed to update job status:", jobUpdateError)
    } else {
      console.log("[Transcription] ✓ Job marked as failed in database")
    }
    
    // 更新面试记录
    console.log("[Transcription] Updating interview status to 'failed'...")
    const { error: interviewUpdateError } = await supabase
      .from('interviews')
      .update({
        transcription_status: 'failed'
      })
      .eq('transcription_job_id', jobId)
    
    if (interviewUpdateError) {
      console.error("[Transcription] ⚠️ Failed to update interview status:", interviewUpdateError)
    } else {
      console.log("[Transcription] ✓ Interview marked as failed in database")
    }
    
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
  aiSummary?: string
  metadata?: TranscriptionMetadata
  error?: string
}> {
  try {
    console.log("[Transcription] Getting status for interview:", interviewId)
    
    const supabase = createAdminClient()
    
    const { data: interview, error } = await supabase
      .from('interviews')
      .select(`
        transcription_status,
        transcription_text,
        ai_summary,
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
    
    console.log("[Transcription] Interview data:", {
      transcription_status: interview.transcription_status,
      has_transcription_text: !!interview.transcription_text,
      transcription_text_length: interview.transcription_text?.length || 0
    })
    
    return {
      success: true,
      status: interview.transcription_status as TranscriptionStatus,
      transcription: interview.transcription_text,
      aiSummary: interview.ai_summary,
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
    console.log("[Transcription] ========== START TRANSCRIPTION ==========")
    console.log("[Transcription] Initiating transcription workflow...")
    
    const supabase = createAdminClient()
    
    // 首先获取interview的UUID
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id')
      .eq('interview_id', interviewId)
      .single()
    
    if (interviewError || !interview) {
      console.error("[Transcription] ✗ Interview not found in database")
      console.error("[Transcription] Error:", interviewError)
      return {
        success: false,
        error: 'Interview not found in database'
      }
    }
    
    const interviewUuid = interview?.id
    console.log("[Transcription] ✓ Found interview UUID:", interviewUuid)
    
    // 创建任务
    const createResult = await createTranscriptionJob(interviewId, videoUrl, interviewUuid)
    
    if (!createResult.success) {
      console.error("[Transcription] ✗ Failed to create transcription job")
      console.error("[Transcription] ========== START TRANSCRIPTION END (FAILED) ==========")
      return createResult
    }
    
    console.log("[Transcription] ✓ Job created, starting async processing...")
    
    // 异步处理任务（不等待完成）
    processTranscriptionJob(createResult.jobId!, interviewUuid).catch(error => {
      console.error("[Transcription] ✗ Async job processing failed:", error)
      console.error("[Transcription] Job ID:", createResult.jobId)
      console.error("[Transcription] Stack:", error instanceof Error ? error.stack : 'No stack trace')
    })
    
    console.log("[Transcription] ✓ Async processing initiated")
    console.log("[Transcription] ========== START TRANSCRIPTION END (SUCCESS) ==========")
    
    return {
      success: true,
      jobId: createResult.jobId
    }
    
  } catch (error) {
    console.error("[Transcription] ✗ Exception in startTranscription:", error)
    console.error("[Transcription] Stack:", error instanceof Error ? error.stack : 'No stack trace')
    console.error("[Transcription] ========== START TRANSCRIPTION END (EXCEPTION) ==========")
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

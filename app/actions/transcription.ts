"use server"

import { prisma } from "@/lib/prisma"
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
    
    console.log("[Transcription] Using provided interview UUID:", interviewUuid)
    
    // 检查是否已有进行中的任务
    console.log("[Transcription] Checking for existing jobs...")
    const existingJob = await prisma.transcriptionJob.findFirst({
      where: {
        interview_id: interviewUuid,
        status: { in: ['pending', 'processing'] }
      }
    })
    
    if (existingJob) {
      console.log("[Transcription] ⚠️ Job already exists:", existingJob.job_id)
      console.log("[Transcription] Status:", existingJob.status)
      return { success: true, jobId: existingJob.job_id }
    }
    
    console.log("[Transcription] No existing job found, creating new one...")
    
    // 生成任务 ID
    const jobId = `transcription_${interviewId}_${Date.now()}`
    console.log("[Transcription] Generated Job ID:", jobId)
    
    // 创建转录任务记录
    const job = await prisma.transcriptionJob.create({
      data: {
        interview_id: interviewUuid,
        job_id: jobId,
        status: 'pending',
        video_url: videoUrl
      }
    })
    
    console.log("[Transcription] ✓ Job record created in database")
    
    // 更新面试记录的转录状态
    await prisma.interview.update({
      where: { id: interviewUuid },
      data: {
        transcription_status: 'pending',
        transcription_job_id: jobId
      }
    })
    
    console.log("[Transcription] ✓ Interview status updated successfully")
    return { success: true, jobId }
    
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
    
    // 1. Fetch job details
    const job = await prisma.transcriptionJob.findUnique({
      where: { job_id: jobId }
    })

    if (!job) {
      return { success: false, error: 'Job not found' }
    }

    const actualInterviewUUID = interviewUUID || job.interview_id
    const videoUrl = job.video_url
    console.log("[Transcription] Video URL:", videoUrl)
    
    // 更新任务状态为处理中
    await prisma.transcriptionJob.update({
      where: { job_id: jobId },
      data: {
        status: 'processing',
        started_at: new Date()
      }
    })
    console.log("[Transcription] ✓ Job status updated to 'processing'")
    
    // 从视频 URL 下载音频
    console.log("[Transcription] Downloading video from B2...")
    const videoResponse = await fetch(videoUrl)
    
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }
    
    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    
    // 检查 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable not set")
    }
    
    // 调用 OpenAI Whisper API
    console.log("[Transcription] Calling OpenAI Whisper API...")
    const startTime = Date.now()
    const transcription = await openai.audio.transcriptions.create({
      file: new File([videoBlob], "interview.mp4", { type: "video/mp4" }),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    })
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log("[Transcription] ✓ Whisper API completed successfully! Time:", elapsedTime)

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
    await prisma.transcriptionJob.update({
      where: { job_id: jobId },
      data: {
        status: 'completed',
        completed_at: new Date(),
        metadata: metadata as any
      }
    })
    
    // 生成AI摘要 (Assuming API endpoint exists and is reachable)
    console.log("[Transcription] Generating AI summary...")
    let aiSummary = null
    try {
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcription.text }),
      })
      const summaryData = await summaryResponse.json()
      if (summaryData.success) {
        aiSummary = summaryData.summary
      }
    } catch (error) {
      console.warn("[Transcription] ⚠️ AI summary generation failed:", error)
    }
    
    // 更新面试记录
    if (!actualInterviewUUID) throw new Error('Interview UUID required')
    
    const updateData: any = {
      transcription_status: 'completed',
      transcription_text: transcription.text,
      transcription_metadata: metadata as any
    }
    if (aiSummary) updateData.ai_summary = aiSummary
    
    await prisma.interview.update({
      where: { id: actualInterviewUUID },
      data: updateData
    })
    
    console.log("[Transcription] ========== PROCESS JOB END (SUCCESS) ==========")
    return {
      success: true,
      transcription: transcription.text,
      metadata
    }
    
  } catch (error) {
    console.error("[Transcription] ✗ Job processing failed:", error)
    
    // 更新状态为失败
    await prisma.transcriptionJob.update({
      where: { job_id: jobId },
      data: {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date()
      }
    })
    
    await prisma.interview.updateMany({
      where: { transcription_job_id: jobId },
      data: { transcription_status: 'failed' }
    })
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 获取转录状态
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
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: {
        transcription_status: true,
        transcription_text: true,
        ai_summary: true,
        transcription_metadata: true,
        transcription_job_id: true
      }
    })
    
    if (!interview) {
      return { success: false, error: 'Interview not found' }
    }
    
    return {
      success: true,
      status: interview.transcription_status as TranscriptionStatus,
      transcription: interview.transcription_text || undefined,
      aiSummary: interview.ai_summary || undefined,
      metadata: interview.transcription_metadata as unknown as TranscriptionMetadata
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 启动转录任务（异步处理）
 */
export async function startTranscription(interviewId: string, videoUrl: string): Promise<{
  success: boolean
  error?: string
  jobId?: string
}> {
  try {
    console.log("[Transcription] ========== START TRANSCRIPTION ==========")
    
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: { id: true }
    })
    
    if (!interview) {
      return { success: false, error: 'Interview not found in database' }
    }
    
    const createResult = await createTranscriptionJob(interviewId, videoUrl, interview.id)
    
    if (!createResult.success) return createResult
    
    // 异步处理
    processTranscriptionJob(createResult.jobId!, interview.id).catch(error => {
      console.error("[Transcription] ✗ Async job processing failed:", error)
    })
    
    return { success: true, jobId: createResult.jobId }
    
  } catch (error) {
    console.error("[Transcription] ✗ Exception in startTranscription:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

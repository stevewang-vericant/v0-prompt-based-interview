"use server"

import { prisma } from "@/lib/prisma"

// AssemblyAI API 配置
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_AI_API_KEY
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2"

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
 * 提交视频到 AssemblyAI 进行转录
 */
async function submitToAssemblyAI(videoUrl: string): Promise<{ transcriptId: string }> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY environment variable not set")
  }

  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: 'POST',
    headers: {
      'Authorization': ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: videoUrl,
      language_detection: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AssemblyAI submission failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return { transcriptId: data.id }
}

/**
 * 轮询 AssemblyAI 获取转录结果
 */
async function pollAssemblyAIResult(transcriptId: string, maxWaitMs: number = 600000): Promise<{
  text: string
  language: string
  duration: number
  words: Array<{ start: number; end: number; text: string; confidence: number }>
}> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY environment variable not set")
  }

  const startTime = Date.now()
  const pollInterval = 3000 // 3 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`AssemblyAI polling failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status === 'completed') {
      return {
        text: data.text,
        language: data.language_code,
        duration: data.audio_duration,
        words: data.words || [],
      }
    } else if (data.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${data.error}`)
    }

    // Wait before next poll
    console.log(`[Transcription] AssemblyAI status: ${data.status}, waiting...`)
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  throw new Error('AssemblyAI transcription timeout')
}

/**
 * 处理转录任务（使用 AssemblyAI）
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
    
    // 检查 AssemblyAI API Key
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error("ASSEMBLYAI_API_KEY environment variable not set")
    }
    
    // 更新任务状态为处理中
    await prisma.transcriptionJob.update({
      where: { job_id: jobId },
      data: {
        status: 'processing',
        started_at: new Date()
      }
    })
    console.log("[Transcription] ✓ Job status updated to 'processing'")
    
    // 提交到 AssemblyAI（直接使用 URL，无需下载）
    console.log("[Transcription] Submitting to AssemblyAI...")
    const startTime = Date.now()
    const { transcriptId } = await submitToAssemblyAI(videoUrl)
    console.log("[Transcription] ✓ Submitted to AssemblyAI, transcript ID:", transcriptId)
    
    // 轮询获取结果
    console.log("[Transcription] Polling for results...")
    const result = await pollAssemblyAIResult(transcriptId)
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log("[Transcription] ✓ AssemblyAI completed! Time:", elapsedTime, "seconds")

    // 将 words 转换为 segments（按句子分组）
    const segments: Array<{ start: number; end: number; text: string; confidence?: number }> = []
    if (result.words && result.words.length > 0) {
      let currentSegment = {
        start: result.words[0].start / 1000, // Convert ms to seconds
        end: result.words[0].end / 1000,
        text: result.words[0].text,
        confidenceSum: result.words[0].confidence,
        wordCount: 1
      }
      
      for (let i = 1; i < result.words.length; i++) {
        const word = result.words[i]
        const wordStartSec = word.start / 1000
        const wordEndSec = word.end / 1000
        
        // 如果间隔超过1秒或遇到句号，创建新段落
        const gap = wordStartSec - currentSegment.end
        const endsWithPunctuation = /[.!?]$/.test(currentSegment.text)
        
        if (gap > 1.0 || endsWithPunctuation) {
          segments.push({
            start: currentSegment.start,
            end: currentSegment.end,
            text: currentSegment.text.trim(),
            confidence: currentSegment.confidenceSum / currentSegment.wordCount
          })
          currentSegment = {
            start: wordStartSec,
            end: wordEndSec,
            text: word.text,
            confidenceSum: word.confidence,
            wordCount: 1
          }
        } else {
          currentSegment.end = wordEndSec
          currentSegment.text += ' ' + word.text
          currentSegment.confidenceSum += word.confidence
          currentSegment.wordCount++
        }
      }
      
      // Add last segment
      segments.push({
        start: currentSegment.start,
        end: currentSegment.end,
        text: currentSegment.text.trim(),
        confidence: currentSegment.confidenceSum / currentSegment.wordCount
      })
    }

    // 准备元数据
    const metadata: TranscriptionMetadata = {
      language: result.language,
      duration: result.duration,
      confidence: segments.length > 0
        ? segments.reduce((acc, seg) => acc + (seg.confidence || 0), 0) / segments.length
        : undefined,
      segments: segments,
      createdAt: new Date().toISOString(),
      model: "assemblyai"
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
    
    // 生成AI摘要
    console.log("[Transcription] Generating AI summary...")
    let aiSummary = null
    try {
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: result.text }),
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
      transcription_text: result.text,
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
      transcription: result.text,
      metadata
    }
    
  } catch (error) {
    console.error("[Transcription] ✗ Job processing failed:", error)
    
    // 更新状态为失败
    try {
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
    } catch (updateError) {
      console.error("[Transcription] Failed to update status:", updateError)
    }
    
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

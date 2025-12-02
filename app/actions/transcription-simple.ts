"use server"

import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import { TranscriptionMetadata, TranscriptionStatus } from "./transcription"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * 简单的转录函数 - 直接处理，不创建任务表
 */
export async function transcribeVideo(
  interviewId: string,
  videoUrl: string
): Promise<{
  success: boolean
  transcription?: string
  metadata?: TranscriptionMetadata
  error?: string
}> {
  try {
    console.log("[Transcription] ========== START SIMPLE TRANSCRIPTION ==========")
    
    // 1. 更新状态为处理中
    await prisma.interview.update({
      where: { interview_id: interviewId },
      data: { transcription_status: 'processing' }
    })
    
    // 2. 下载视频
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }
    
    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    
    // 3. 调用OpenAI Whisper
    const startTime = Date.now()
    const transcription = await openai.audio.transcriptions.create({
      file: new File([videoBlob], "interview.mp4", { type: "video/mp4" }),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    })
    console.log("[Transcription] ✓ Whisper API completed! Time:", ((Date.now() - startTime)/1000).toFixed(2))
    
    const metadata: TranscriptionMetadata = {
      model: "whisper-1",
      language: transcription.language,
      duration: transcription.duration,
      segments: transcription.segments?.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.avg_logprob
      })),
      createdAt: new Date().toISOString()
    }
    
    // 4. 更新数据库
    const updateData = {
      transcription_status: 'completed',
      transcription_text: transcription.text,
      transcription_metadata: metadata as any
    }
    
    await prisma.interview.update({
      where: { interview_id: interviewId },
      data: updateData
    })
    
    console.log("[Transcription] ========== TRANSCRIPTION COMPLETED SUCCESSFULLY ==========")
    
    return {
      success: true,
      transcription: transcription.text,
      metadata
    }
    
  } catch (error) {
    console.error("[Transcription] ========== TRANSCRIPTION FAILED ==========")
    console.error(error)
    
    // 更新状态为失败
    try {
      await prisma.interview.update({
        where: { interview_id: interviewId },
        data: { transcription_status: 'failed' }
      })
    } catch (e) {
      console.error("Failed to update status to failed:", e)
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

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
        transcription_metadata: true
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

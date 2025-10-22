"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface TranscriptionMetadata {
  model: string
  language?: string
  duration?: number
  segments?: Array<{
    id: number
    seek: number
    start: number
    end: number
    text: string
    tokens: number[]
    temperature: number
    avg_logprob: number
    compression_ratio: number
    no_speech_prob: number
  }>
}

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
    console.log("[Transcription] Interview ID:", interviewId)
    console.log("[Transcription] Video URL:", videoUrl)
    
    const supabase = createAdminClient()
    
    // 1. 更新状态为处理中
    console.log("[Transcription] Step 1: Updating status to 'processing'...")
    const { error: statusError } = await supabase
      .from('interviews')
      .update({ transcription_status: 'processing' })
      .eq('interview_id', interviewId)
    
    if (statusError) {
      console.error("[Transcription] ✗ Failed to update status:", statusError)
      throw new Error(`Status update failed: ${statusError.message}`)
    }
    console.log("[Transcription] ✓ Status updated to 'processing'")
    
    // 2. 下载视频
    console.log("[Transcription] Step 2: Downloading video...")
    console.log("[Transcription] Video URL:", videoUrl)
    
    const videoResponse = await fetch(videoUrl)
    console.log("[Transcription] Video response status:", videoResponse.status)
    console.log("[Transcription] Video response headers:", Object.fromEntries(videoResponse.headers.entries()))
    
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`)
    }
    
    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    
    console.log("[Transcription] ✓ Video downloaded successfully")
    console.log("[Transcription] Video buffer size:", videoBuffer.byteLength, "bytes")
    console.log("[Transcription] Video blob size:", videoBlob.size, "bytes")
    console.log("[Transcription] Video blob type:", videoBlob.type)
    
    // 3. 调用OpenAI Whisper
    console.log("[Transcription] Step 3: Calling OpenAI Whisper API...")
    console.log("[Transcription] OpenAI API Key configured:", !!process.env.OPENAI_API_KEY)
    
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
    
    const metadata: TranscriptionMetadata = {
      model: "whisper-1", // Use the model we called
      language: transcription.language,
      duration: transcription.duration,
      segments: transcription.segments,
    }
    
    console.log("[Transcription] ✓ Metadata prepared")
    
    // 4. 更新数据库
    console.log("[Transcription] Step 4: Updating database...")
    const updateData = {
      transcription_status: 'completed',
      transcription_text: transcription.text,
      transcription_metadata: metadata
    }
    
    console.log("[Transcription] Update data:", {
      transcription_status: updateData.transcription_status,
      transcription_text_length: updateData.transcription_text?.length || 0,
      metadata_keys: Object.keys(updateData.transcription_metadata)
    })
    
    const { error: updateError } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('interview_id', interviewId)
    
    if (updateError) {
      console.error("[Transcription] ✗ Database update failed:", updateError)
      console.error("[Transcription] Update error details:", JSON.stringify(updateError, null, 2))
      throw new Error(`Database update failed: ${updateError.message}`)
    }
    
    console.log("[Transcription] ✓ Database updated successfully")
    console.log("[Transcription] ========== TRANSCRIPTION COMPLETED SUCCESSFULLY ==========")
    
    return {
      success: true,
      transcription: transcription.text,
      metadata
    }
    
  } catch (error) {
    console.error("[Transcription] ========== TRANSCRIPTION FAILED ==========")
    console.error("[Transcription] ❌ Error type:", typeof error)
    console.error("[Transcription] ❌ Error message:", error instanceof Error ? error.message : String(error))
    console.error("[Transcription] ❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    console.error("[Transcription] ❌ Full error object:", JSON.stringify(error, null, 2))
    
    // 更新状态为失败
    console.log("[Transcription] Updating status to 'failed'...")
    try {
      const supabase = createAdminClient()
      const { error: failError } = await supabase
        .from('interviews')
        .update({ transcription_status: 'failed' })
        .eq('interview_id', interviewId)
      
      if (failError) {
        console.error("[Transcription] ✗ Failed to update status to 'failed':", failError)
      } else {
        console.log("[Transcription] ✓ Status updated to 'failed'")
      }
    } catch (updateError) {
      console.error("[Transcription] ✗ Exception while updating status:", updateError)
    }
    
    console.log("[Transcription] ========== TRANSCRIPTION FAILED END ==========")
    
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
    const supabase = createAdminClient()
    
    const { data: interview, error } = await supabase
      .from('interviews')
      .select(`
        transcription_status,
        transcription_text,
        ai_summary,
        transcription_metadata
      `)
      .eq('interview_id', interviewId)
      .single()
    
    if (error) {
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
      aiSummary: interview.ai_summary,
      metadata: interview.transcription_metadata as TranscriptionMetadata
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { startTranscription } from "./transcription"

/**
 * 保存视频元数据到数据库（视频已由客户端直接上传到 B2）
 * 
 * @param videoUrl 视频的公开 URL
 * @param interviewId 面试 ID（自定义字符串）
 * @param promptId 问题 ID
 * @param responseOrder 视频序号（0 表示完整视频）
 * @returns 保存结果
 */
export async function saveVideoMetadata(
  videoUrl: string,
  interviewId: string,
  promptId: string,
  responseOrder: number,
): Promise<{
  success: boolean
  error?: string
  data?: any
}> {
  try {
    console.log("[v0] ===== Saving video metadata =====")
    console.log("[v0] Video URL:", videoUrl)
    console.log("[v0] Interview ID:", interviewId)
    console.log("[v0] Prompt ID:", promptId)
    console.log("[v0] Response Order:", responseOrder)

    // Check Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("[v0] ⚠️ Supabase not configured, skipping database save")
      return { success: true, data: null }
    }

    const supabase = await createClient()

    // 首先，根据 custom interview_id 获取 UUID id，如果不存在则创建
    let { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id')
      .eq('interview_id', interviewId)
      .single()

    let interviewUuid: string

    if (interviewError || !interview) {
      // Interview 记录不存在，创建一个基础记录
      console.log("[v0] Interview record not found, creating one...")

      const { data: newInterview, error: createError } = await supabase
        .from('interviews')
        .insert({
          interview_id: interviewId,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError || !newInterview) {
        console.error("[v0] ⚠️ Failed to create interview record:", createError)
        return { success: false, error: 'Failed to create interview record' }
      }

      interviewUuid = newInterview.id
      console.log("[v0] Created new interview record with UUID:", interviewUuid)
    } else {
      interviewUuid = interview.id
      console.log("[v0] Found existing interview UUID:", interviewUuid)
    }

    // 插入 interview_responses 记录
    const { data, error } = await supabase
      .from("interview_responses")
      .insert({
        interview_id: interviewUuid,
        prompt_id: promptId,
        video_url: videoUrl,
        sequence_number: responseOrder,
        video_duration: 90,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] ⚠️ Database save error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] ✓ Database save successful")

    // 如果是完整视频（responseOrder === 0），启动转录任务
    if (responseOrder === 0) {
      console.log("[v0] ========== TRANSCRIPTION WORKFLOW START ==========")
      console.log("[v0] Complete video detected, initiating transcription...")
      console.log("[v0] Interview ID (custom):", interviewId)
      console.log("[v0] Interview UUID:", interviewUuid)
      console.log("[v0] Video URL:", videoUrl)
      console.log("[v0] OpenAI API Key configured:", !!process.env.OPENAI_API_KEY)

      try {
        const transcriptionResult = await startTranscription(interviewId, videoUrl)
        if (transcriptionResult.success) {
          console.log("[v0] ✓ Transcription job created successfully!")
          console.log("[v0] Job ID:", transcriptionResult.jobId)
          console.log("[v0] Note: Transcription will process asynchronously")
        } else {
          console.error("[v0] ✗ Failed to start transcription")
          console.error("[v0] Error:", transcriptionResult.error)
        }
      } catch (error) {
        console.error("[v0] ✗ Transcription start exception:", error)
        console.error("[v0] Stack:", error instanceof Error ? error.stack : 'No stack trace')
        // 不阻止视频上传成功，转录失败不影响主流程
      }

      console.log("[v0] ========== TRANSCRIPTION WORKFLOW END ==========")
    }

    console.log("[v0] ===== Metadata save complete =====")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] ❌ Metadata save error:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.stack : error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Save failed",
    }
  }
}


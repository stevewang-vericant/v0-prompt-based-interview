"use server"

import { createClient } from "@/lib/supabase/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { startTranscription } from "./transcription"

const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  region: process.env.B2_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true, // Required for B2
})

export async function uploadVideoToB2AndSave(
  videoBlob: Blob,
  interviewId: string,
  promptId: string,
  responseOrder: number,
  schoolCode?: string | null,
  studentEmail?: string
) {
  try {
    console.log("[v0] ===== Starting video upload =====")
    console.log("[v0] Blob size:", videoBlob.size, "bytes")
    console.log("[v0] Interview ID:", interviewId)
    console.log("[v0] Prompt ID:", promptId)
    console.log("[v0] Response Order:", responseOrder)
    
    // Check environment variables
    if (!process.env.B2_BUCKET_NAME) {
      throw new Error("B2_BUCKET_NAME not configured")
    }
    if (!process.env.B2_BUCKET_REGION) {
      throw new Error("B2_BUCKET_REGION not configured")
    }
    if (!process.env.B2_APPLICATION_KEY_ID) {
      throw new Error("B2_APPLICATION_KEY_ID not configured")
    }
    if (!process.env.B2_APPLICATION_KEY) {
      throw new Error("B2_APPLICATION_KEY not configured")
    }
    
    console.log("[v0] Bucket:", process.env.B2_BUCKET_NAME)
    console.log("[v0] Region:", process.env.B2_BUCKET_REGION)
    console.log("[v0] Key ID configured:", !!process.env.B2_APPLICATION_KEY_ID)

    console.log("[v0] Converting blob to buffer...")
    const arrayBuffer = await videoBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log("[v0] Buffer created, size:", buffer.length, "bytes")

    const timestamp = Date.now()
    // 如果 responseOrder 为 0，表示这是完整的合并视频（MP4格式）
    const filename = responseOrder === 0 
      ? `interviews/${interviewId}/complete-interview-${timestamp}.mp4`
      : `interviews/${interviewId}/response-${responseOrder}-${timestamp}.webm`
    console.log("[v0] Filename:", filename)

    console.log("[v0] Uploading to B2...")
    // 根据文件扩展名设置正确的 Content-Type
    const contentType = filename.endsWith('.mp4') ? 'video/mp4' : 'video/webm'
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(uploadCommand)
    console.log("[v0] ✓ B2 upload successful!")

    const videoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${filename}`
    console.log("[v0] Video URL:", videoUrl)

    // Save to database (optional - if this fails, video is still uploaded)
    console.log("[v0] Saving to database...")
    
    // Check Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("[v0] ⚠️ Supabase not configured, skipping database save")
      console.log("[v0] Video uploaded successfully (without database record)")
      return { success: true, videoUrl, data: null }
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
      console.log("[v0] School code:", schoolCode || "Not provided")
      console.log("[v0] Student email:", studentEmail || "Not provided")
      
      const { data: newInterview, error: createError } = await supabase
        .from('interviews')
        .insert({
          interview_id: interviewId,
          school_code: schoolCode || null,
          student_email: studentEmail || null,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (createError || !newInterview) {
        console.error("[v0] ⚠️ Failed to create interview record:", createError)
        console.log("[v0] Video uploaded successfully (but not saved to database)")
        return { success: true, videoUrl, data: null, dbError: 'Failed to create interview record' }
      }
      
      interviewUuid = newInterview.id
      console.log("[v0] Created new interview record with UUID:", interviewUuid)
    } else {
      interviewUuid = interview.id
      console.log("[v0] Found existing interview UUID:", interviewUuid)
    }
    
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
      console.log("[v0] Video uploaded successfully (but not saved to database)")
      // Don't fail the whole operation - video is already uploaded
      // Continue to transcription even if interview_responses save failed
    } else {
      console.log("[v0] ✓ Database save successful")
    }
    
    // 如果是完整视频（responseOrder === 0），启动转录任务
    // 即使 interview_responses 保存失败也要执行转录
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
    
    console.log("[v0] ===== Upload complete =====")
    return { success: true, videoUrl, data: data || null, dbError: error ? error.message : undefined }
  } catch (error) {
    console.error("[v0] ❌ Upload error:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.stack : error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

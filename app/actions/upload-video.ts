"use server"

import { createClient } from "@/lib/supabase/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

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
    const { data, error } = await supabase
      .from("interview_responses")
      .insert({
        interview_id: interviewId,
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
      return { success: true, videoUrl, data: null, dbError: error.message }
    }

    console.log("[v0] ✓ Database save successful")
    console.log("[v0] ===== Upload complete =====")
    return { success: true, videoUrl, data }
  } catch (error) {
    console.error("[v0] ❌ Upload error:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.stack : error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

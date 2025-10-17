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
    console.log("[v0] Starting video upload to B2...")
    console.log("[v0] Bucket:", process.env.B2_BUCKET_NAME)
    console.log("[v0] Region:", process.env.B2_BUCKET_REGION)

    const arrayBuffer = await videoBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const timestamp = Date.now()
    const filename = `interviews/${interviewId}/response-${responseOrder}-${timestamp}.webm`

    console.log("[v0] Uploading file:", filename)

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: filename,
      Body: buffer,
      ContentType: "video/webm",
    })

    await s3Client.send(uploadCommand)

    const videoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${filename}`

    console.log("[v0] Video uploaded successfully:", videoUrl)
    console.log("[v0] Saving to database...")

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
      console.error("[v0] Database save error:", error)
      throw new Error(`Failed to save video URL to database: ${error.message}`)
    }

    console.log("[v0] Video uploaded and saved successfully")
    return { success: true, videoUrl, data }
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

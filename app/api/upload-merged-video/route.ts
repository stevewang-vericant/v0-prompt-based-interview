import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    const { cloudinaryUrl, interviewId } = await request.json()

    if (!cloudinaryUrl || !interviewId) {
      return NextResponse.json({
        success: false,
        error: 'Missing cloudinaryUrl or interviewId'
      }, { status: 400 })
    }

    console.log(`[Server B2] Uploading merged video from Cloudinary to B2...`)
    console.log(`[Server B2] Cloudinary URL:`, cloudinaryUrl)
    console.log(`[Server B2] Interview ID:`, interviewId)

    // 检查环境变量
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

    // 从 Cloudinary 下载视频
    console.log(`[Server B2] Downloading video from Cloudinary...`)
    const response = await fetch(cloudinaryUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download video from Cloudinary: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`[Server B2] Downloaded video, size: ${buffer.length} bytes`)

    // 生成 B2 文件名
    const timestamp = Date.now()
    const filename = `interviews/${interviewId}/merged-video-${timestamp}.mp4`
    console.log(`[Server B2] B2 filename:`, filename)

    // 上传到 B2
    console.log(`[Server B2] Uploading to B2...`)
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: 'video/mp4',
    })

    await s3Client.send(uploadCommand)
    console.log(`[Server B2] ✓ B2 upload successful!`)

    const videoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${filename}`
    console.log(`[Server B2] Video URL:`, videoUrl)

    return NextResponse.json({
      success: true,
      url: videoUrl,
      filename: filename
    })

  } catch (error) {
    console.error(`[Server B2] ✗ Upload error:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

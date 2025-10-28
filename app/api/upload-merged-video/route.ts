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
    console.log(`[Server B2] Cloudinary URL (input):`, cloudinaryUrl)
    console.log(`[Server B2] Interview ID:`, interviewId)

    // 如果是 Cloudinary 的 splice-only URL，则在 download 之前追加转码参数
    const ensureTranscode = (urlStr: string): string => {
      try {
        // 仅处理 Cloudinary upload 路径
        const marker = '/video/upload/'
        const pos = urlStr.indexOf(marker)
        if (pos === -1) return urlStr

        const after = urlStr.substring(pos + marker.length)
        // 版本段通常形如 v<digits>/...
        const versionMatch = after.match(/v\d+\//)
        if (!versionMatch) return urlStr

        const beforeVersion = after.substring(0, versionMatch.index!)
        const afterVersion = after.substring(versionMatch.index!)

        // 已经包含 vc_ 或 f_mp4 则直接返回
        if (/\bvc_/.test(beforeVersion) || /\bf_?mp4\b/.test(beforeVersion)) {
          return urlStr
        }

        const injected = beforeVersion.length > 0
          ? `${beforeVersion.replace(/\/$/, '')}/vc_h264:high:4.1,f_mp4/`
          : 'vc_h264:high:4.1,f_mp4/'

        const finalUrl = urlStr.substring(0, pos + marker.length) + injected + afterVersion
        console.log('[Server B2] Cloudinary URL (with transcode):', finalUrl)
        return finalUrl
      } catch {
        return urlStr
      }
    }

    const downloadUrl = ensureTranscode(cloudinaryUrl)

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

    // 从 Cloudinary 下载视频（带派生就绪检查）
    console.log(`[Server B2] Downloading video from Cloudinary with readiness check...`)
    
    // 检查派生是否就绪（最多重试5次，每次等待2秒）
    let response: Response | undefined
    let retryCount = 0
    const maxRetries = 5
    
    while (retryCount < maxRetries) {
      response = await fetch(downloadUrl)
      
      if (response.ok) {
        console.log(`[Server B2] Video ready after ${retryCount} retries`)
        break
      }
      
      if (response.status === 404) {
        console.log(`[Server B2] Video not ready yet (404), retrying in 2s... (${retryCount + 1}/${maxRetries})`)
        retryCount++
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
      }
      
      throw new Error(`Failed to download video from Cloudinary: ${response.status}`)
    }
    
    if (!response || !response.ok) {
      throw new Error(`Failed to download video from Cloudinary after ${maxRetries} retries: ${response?.status}`)
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

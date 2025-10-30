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

    // 构建若干候选下载URL（优先强制 Level 4.1，其次降级，最后原始）
    const buildCandidates = (): string[] => {
      try {
        const marker = '/video/upload/'
        const idx = cloudinaryUrl.indexOf(marker)
        if (idx === -1) return [cloudinaryUrl]
        const head = cloudinaryUrl.slice(0, idx + marker.length)
        const tail = cloudinaryUrl.slice(idx + marker.length)
        // 找到版本段 v<digits>/
        const m = tail.match(/v\d+\//)
        if (!m || m.index === undefined) return [cloudinaryUrl]
        const transforms = tail.slice(0, m.index)
        const rest = tail.slice(m.index)
        // 若已包含 vc_ 或 f_mp4 或 fps_ 则视为已转码
        if (/(^|\/)vc_/.test(transforms) || /(^|\/)f_?mp4(\/|$)/.test(transforms)) {
          return [cloudinaryUrl]
        }
        const base = (extra: string) => head + ((transforms ? transforms.replace(/\/$/, '') + '/' : '') + extra + '/') + rest
        const candidates: string[] = [
          base('vc_h264:high:4.1,f_mp4/fps_30/ac_aac,ab_128k'),
          base('vc_h264:high:4.1,f_mp4'),
          base('vc_h264:high:4.1'),
          cloudinaryUrl,
        ]
        console.log('[Server B2] Candidate Cloudinary URLs (in order):', candidates)
        return candidates
      } catch (e) {
        return [cloudinaryUrl]
      }
    }

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
    
    // 尝试依次使用候选URL，每个各自重试直到就绪
    const candidates = buildCandidates()
    let response: Response | undefined
    let lastStatus = 0
    let usedUrl = ''
    for (const candidate of candidates) {
      console.log('[Server B2] Trying candidate URL:', candidate)
      let retryCount = 0
      const maxRetries = 15
      while (retryCount < maxRetries) {
        response = await fetch(candidate)
        if (response.ok) {
          console.log(`[Server B2] Video ready using candidate after ${retryCount} retries`)
          usedUrl = candidate
          break
        }
        lastStatus = response.status
        const shouldRetry = lastStatus === 404 || lastStatus === 400 || lastStatus === 423
        if (!shouldRetry) break
        const delayMs = Math.min(2000 * Math.pow(1.5, retryCount), 8000)
        console.log(`[Server B2] Candidate not ready (${lastStatus}), retrying in ${Math.round(delayMs)}ms... (${retryCount + 1}/${maxRetries})`)
        retryCount++
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
      if (response && response.ok) break
    }
    if (!response || !response.ok) {
      throw new Error(`Failed to download video from Cloudinary: ${lastStatus}`)
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


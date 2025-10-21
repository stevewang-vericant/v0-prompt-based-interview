import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
import { startTranscription } from '@/app/actions/transcription'

const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  region: process.env.B2_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
})

export async function POST(request: NextRequest) {
  try {
    const { interviewId, segments } = await request.json()
    
    console.log('[Merge] Starting video merge for interview:', interviewId)
    console.log('[Merge] Segments count:', segments.length)
    
    if (!segments || segments.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No segments provided' 
      })
    }
    
    // 下载所有分段视频
    const videoBuffers: Buffer[] = []
    const segmentDurations: number[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      console.log(`[Merge] Downloading segment ${i + 1}/${segments.length}:`, segment.url)
      
      // 从URL中提取B2路径
      // B2 URL格式: https://f001.backblazeb2.com/file/bucket-name/path/to/file
      const urlParts = segment.url.split('/file/')
      if (urlParts.length !== 2) {
        throw new Error(`Invalid B2 URL format: ${segment.url}`)
      }
      
      // 移除bucket名称，只保留文件路径
      const fullPath = urlParts[1]
      const bucketName = process.env.B2_BUCKET_NAME!
      const key = fullPath.replace(`${bucketName}/`, '')
      console.log(`[Merge] B2 Key:`, key)
      
      const getCommand = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: key,
      })
      
      const response = await s3Client.send(getCommand)
      const chunks: Uint8Array[] = []
      
      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk)
        }
      }
      
      const buffer = Buffer.concat(chunks)
      videoBuffers.push(buffer)
      segmentDurations.push(segment.duration || 90)
      
      console.log(`[Merge] ✓ Downloaded segment ${i + 1}, size:`, buffer.length, 'bytes')
    }
    
    console.log('[Merge] All segments downloaded, starting merge...')
    
    // 简单的视频合并：将WebM文件连接起来
    // 注意：这是一个简化的实现，实际生产环境可能需要更复杂的处理
    const mergedBuffer = Buffer.concat(videoBuffers)
    const totalDuration = segmentDurations.reduce((sum, dur) => sum + dur, 0)
    
    console.log('[Merge] Merged buffer size:', mergedBuffer.length, 'bytes')
    console.log('[Merge] Total duration:', totalDuration, 'seconds')
    
    // 上传合并后的视频
    const timestamp = Date.now()
    const mergedKey = `interviews/${interviewId}/merged-interview-${timestamp}.webm`
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: mergedKey,
      Body: mergedBuffer,
      ContentType: 'video/webm',
    })
    
    await s3Client.send(putCommand)
    
    const mergedVideoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${mergedKey}`
    
    console.log('[Merge] ✓ Merged video uploaded:', mergedVideoUrl)
    
    // 更新数据库中的视频URL
    const supabase = createAdminClient()
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        video_url: mergedVideoUrl,
        total_duration: totalDuration,
        metadata: {
          merged: true,
          mergedAt: new Date().toISOString(),
          segmentCount: segments.length,
          totalDuration
        }
      })
      .eq('interview_id', interviewId)
    
    if (updateError) {
      console.error('[Merge] ⚠️ Failed to update database:', updateError)
    } else {
      console.log('[Merge] ✓ Database updated successfully')
    }
    
    // 触发转录任务
    console.log('[Merge] Starting transcription for merged video...')
    try {
      const transcriptionResult = await startTranscription(interviewId, mergedVideoUrl)
      if (transcriptionResult.success) {
        console.log('[Merge] ✓ Transcription job created successfully')
        console.log('[Merge] Job ID:', transcriptionResult.jobId)
      } else {
        console.error('[Merge] ✗ Failed to start transcription:', transcriptionResult.error)
      }
    } catch (error) {
      console.error('[Merge] ✗ Transcription start exception:', error)
    }
    
    return NextResponse.json({
      success: true,
      mergedVideoUrl,
      totalDuration,
      segmentCount: segments.length
    })
    
  } catch (error) {
    console.error('[Merge] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

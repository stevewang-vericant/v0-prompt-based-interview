import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
import { startTranscription } from '@/app/actions/transcription'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

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
    
    // 下载所有分段视频并获取实际时长
    const videoBuffers: Buffer[] = []
    const segmentDurations: number[] = []
    const tempDir = tmpdir()
    const tempFiles: string[] = []
    
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
      
      // 获取分段视频的实际时长
      try {
        const tempFile = join(tempDir, `segment_${i + 1}_duration_${Date.now()}.webm`)
        writeFileSync(tempFile, buffer as any)
        tempFiles.push(tempFile)
        
        const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${tempFile}"`
        const { stdout: durationOutput } = await execAsync(durationCommand)
        const actualDuration = parseFloat(durationOutput.trim())
        
        if (!isNaN(actualDuration) && actualDuration > 0) {
          segmentDurations.push(Math.round(actualDuration))
          console.log(`[Merge] ✓ Segment ${i + 1} actual duration:`, Math.round(actualDuration), 'seconds')
        } else {
          segmentDurations.push(segment.duration || 90)
          console.log(`[Merge] ⚠️ Could not get duration for segment ${i + 1}, using estimated:`, segment.duration || 90)
        }
      } catch (error) {
        console.warn(`[Merge] ⚠️ Failed to get duration for segment ${i + 1}:`, error)
        segmentDurations.push(segment.duration || 90)
      }
      
      console.log(`[Merge] ✓ Downloaded segment ${i + 1}, size:`, buffer.length, 'bytes')
    }
    
    console.log('[Merge] All segments downloaded, starting merge...')
    console.log('[Merge] Actual segment durations:', segmentDurations)
    
    // 使用FFmpeg正确合并WebM视频
    const inputFiles: string[] = []
    let mergedBuffer: Buffer
    let totalDuration: number
    
    try {
      // 将每个分段保存为临时文件
      for (let i = 0; i < videoBuffers.length; i++) {
        const tempFile = join(tempDir, `segment_${i + 1}_${Date.now()}.webm`)
        writeFileSync(tempFile, videoBuffers[i] as any)
        inputFiles.push(tempFile)
        tempFiles.push(tempFile)
        console.log(`[Merge] Created temp file: ${tempFile}`)
      }
      
      // 创建FFmpeg输入文件列表
      const concatFile = join(tempDir, `concat_${Date.now()}.txt`)
      const concatContent = inputFiles.map(file => `file '${file}'`).join('\n')
      writeFileSync(concatFile, concatContent)
      tempFiles.push(concatFile)
      
      // 输出文件
      const outputFile = join(tempDir, `merged_${Date.now()}.webm`)
      tempFiles.push(outputFile)
      
      console.log('[Merge] Running FFmpeg to merge videos...')
      console.log('[Merge] Input files:', inputFiles.length)
      console.log('[Merge] Concat file:', concatFile)
      console.log('[Merge] Output file:', outputFile)
      
      // 使用FFmpeg合并视频
      const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputFile}" -y`
      console.log('[Merge] FFmpeg command:', ffmpegCommand)
      
      const { stdout, stderr } = await execAsync(ffmpegCommand)
      console.log('[Merge] FFmpeg stdout:', stdout)
      if (stderr) console.log('[Merge] FFmpeg stderr:', stderr)
      
      if (!existsSync(outputFile)) {
        throw new Error('FFmpeg failed to create output file')
      }
      
      // 读取合并后的视频
      mergedBuffer = require('fs').readFileSync(outputFile)
      totalDuration = segmentDurations.reduce((sum, dur) => sum + dur, 0)
      
      console.log('[Merge] ✓ FFmpeg merge successful')
      console.log('[Merge] Merged buffer size:', mergedBuffer.length, 'bytes')
      console.log('[Merge] Total duration:', totalDuration, 'seconds')
      
      // 清理临时文件
      tempFiles.forEach(file => {
        try {
          if (existsSync(file)) {
            unlinkSync(file)
            console.log(`[Merge] Cleaned up: ${file}`)
          }
        } catch (e) {
          console.warn(`[Merge] Failed to clean up ${file}:`, e)
        }
      })
      
      // 清理分段时长检查的临时文件
      tempFiles.forEach(file => {
        try {
          if (existsSync(file)) {
            unlinkSync(file)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      })
      
    } catch (error) {
      console.error('[Merge] FFmpeg merge failed:', error)
      
      // 清理临时文件
      tempFiles.forEach(file => {
        try {
          if (existsSync(file)) {
            unlinkSync(file)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      })
      
      throw error
    }
    
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
    
    // 获取合并后视频的实际时长
    console.log('[Merge] Getting actual video duration...')
    let actualDuration = totalDuration // 默认使用估算时长
    
    try {
      // 使用本地临时文件来获取时长
      const tempDurationFile = join(tempDir, `duration_check_${Date.now()}.webm`)
      writeFileSync(tempDurationFile, mergedBuffer)
      
      const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${tempDurationFile}"`
      const { stdout: durationOutput } = await execAsync(durationCommand)
      const actualDurationSeconds = parseFloat(durationOutput.trim())
      
      // 清理临时文件
      if (existsSync(tempDurationFile)) {
        unlinkSync(tempDurationFile)
      }
      
      if (!isNaN(actualDurationSeconds) && actualDurationSeconds > 0) {
        actualDuration = Math.round(actualDurationSeconds)
        console.log('[Merge] ✓ Actual video duration:', actualDuration, 'seconds')
      } else {
        console.warn('[Merge] ⚠️ Could not get actual duration, using estimated:', actualDuration)
      }
    } catch (error) {
      console.warn('[Merge] ⚠️ Failed to get actual duration:', error)
      console.log('[Merge] Using estimated duration:', actualDuration)
    }
    
    // 更新数据库中的实际时长
    const { error: updateError2 } = await supabase
      .from('interviews')
      .update({
        total_duration: actualDuration,
        metadata: {
          merged: true,
          mergedAt: new Date().toISOString(),
          segmentCount: segments.length,
          totalDuration: actualDuration,
          actualDuration: actualDuration,
          estimatedDuration: totalDuration
        }
      })
      .eq('interview_id', interviewId)
    
    if (updateError2) {
      console.error('[Merge] ⚠️ Failed to update duration in database:', updateError2)
    } else {
      console.log('[Merge] ✓ Updated actual duration in database')
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
      totalDuration: actualDuration, // 返回实际时长
      segmentCount: segments.length,
      segmentDurations: segmentDurations // 返回每个分段的原始时长
    })
    
  } catch (error) {
    console.error('[Merge] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

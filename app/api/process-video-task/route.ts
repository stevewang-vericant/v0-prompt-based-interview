import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { transcribeVideo } from '@/app/actions/transcription-simple'
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

/**
 * 处理视频合并任务的核心函数
 */
export async function processVideoMergeTask(taskId: string) {
  try {
    // 获取任务信息
    const task = await prisma.videoProcessingTask.findUnique({
      where: { id: taskId }
    })
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }
    
    if (task.status === 'completed') {
      console.log(`[Task ${taskId}] Already completed`)
      return { success: true, task }
    }
    
    // 如果任务状态是 processing 但已经超过 1 小时，可能是卡住了，允许重新处理
    if (task.status === 'processing' && task.started_at) {
      const startedAt = new Date(task.started_at)
      const now = new Date()
      const hoursElapsed = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursElapsed < 0.5) {
        console.log(`[Task ${taskId}] Already processing (started ${Math.round(hoursElapsed * 60)} minutes ago)`)
        return { success: true, task }
      } else {
        console.log(`[Task ${taskId}] Task stuck in processing for ${Math.round(hoursElapsed * 60)} minutes, resetting to pending`)
        // 重置状态为 pending，允许重新处理
        await prisma.videoProcessingTask.update({
          where: { id: taskId },
          data: {
            status: 'pending',
            started_at: null,
            error_message: 'Previous processing was interrupted, retrying...'
          }
        })
      }
    }
    
    // 更新任务状态为 processing
    await prisma.videoProcessingTask.update({
      where: { id: taskId },
      data: {
        status: 'processing',
        started_at: new Date()
      }
    })
    
    const interviewId = task.interview_id
    const segments = task.segments as any[]
    console.log(`[Task ${taskId}] Processing video merge for interview: ${interviewId}`)
    
    if (!interviewId) {
      throw new Error(`Interview ID is missing in task ${taskId}`)
    }
    console.log(`[Task ${taskId}] Segments count:`, segments.length)
    
    // 下载所有分段视频并获取实际时长
    const videoBuffers: Buffer[] = []
    const segmentDurations: number[] = []
    const tempDir = tmpdir()
    const tempFiles: string[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      console.log(`[Task ${taskId}] Downloading segment ${i + 1}/${segments.length}:`, segment.url)
      
      const urlParts = segment.url.split('/file/')
      if (urlParts.length !== 2) {
        throw new Error(`Invalid B2 URL format: ${segment.url}`)
      }
      
      const fullPath = urlParts[1]
      const bucketName = process.env.B2_BUCKET_NAME!
      const key = fullPath.replace(`${bucketName}/`, '')
      
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
          console.log(`[Task ${taskId}] ✓ Segment ${i + 1} actual duration:`, Math.round(actualDuration), 'seconds')
        } else {
          segmentDurations.push(segment.duration || 90)
        }
      } catch (error) {
        console.warn(`[Task ${taskId}] ⚠️ Failed to get duration for segment ${i + 1}:`, error)
        segmentDurations.push(segment.duration || 90)
      }
    }
    
    // 使用FFmpeg合并视频
    const inputFiles: string[] = []
    let mergedBuffer: Buffer
    let totalDuration: number
    
    try {
      for (let i = 0; i < videoBuffers.length; i++) {
        const tempFile = join(tempDir, `segment_${i + 1}_${Date.now()}.webm`)
        writeFileSync(tempFile, videoBuffers[i] as any)
        inputFiles.push(tempFile)
        tempFiles.push(tempFile)
      }
      
      const concatFile = join(tempDir, `concat_${Date.now()}.txt`)
      const concatContent = inputFiles.map(file => `file '${file}'`).join('\n')
      writeFileSync(concatFile, concatContent)
      tempFiles.push(concatFile)
      
      const tempMergedFile = join(tempDir, `temp_merged_${Date.now()}.webm`)
      tempFiles.push(tempMergedFile)
      
      console.log(`[Task ${taskId}] Merging videos (WebM format, no transcoding)...`)
      
      const mergeCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${tempMergedFile}" -y`
      const { stdout: mergeStdout, stderr: mergeStderr } = await execAsync(mergeCommand)
      if (mergeStderr) console.log(`[Task ${taskId}] FFmpeg merge stderr:`, mergeStderr)
      
      if (!existsSync(tempMergedFile)) {
        throw new Error('FFmpeg failed to create merged file')
      }
      
      console.log(`[Task ${taskId}] ✓ Video merge completed (WebM format)`)
      
      mergedBuffer = require('fs').readFileSync(tempMergedFile)
      totalDuration = segmentDurations.reduce((sum, dur) => sum + dur, 0)
      
      tempFiles.forEach(file => {
        try { if (existsSync(file)) unlinkSync(file) } catch (e) {}
      })
      
    } catch (error) {
      console.error(`[Task ${taskId}] FFmpeg merge failed:`, error)
      tempFiles.forEach(file => {
        try { if (existsSync(file)) unlinkSync(file) } catch (e) {}
      })
      throw error
    }
    
    // 上传合并后的视频
    const timestamp = Date.now()
    if (!interviewId) throw new Error(`Interview ID is missing when uploading merged video for task ${taskId}`)
    
    const mergedKey = `interviews/${interviewId}/merged-interview-${timestamp}.webm`
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: mergedKey,
      Body: mergedBuffer,
      ContentType: 'video/webm',
    })
    
    await s3Client.send(putCommand)
    
    const mergedVideoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${mergedKey}`
    console.log(`[Task ${taskId}] ✓ Merged video uploaded:`, mergedVideoUrl)
    
    // 获取合并后视频的实际时长
    let actualDuration = totalDuration
    try {
      const tempDurationFile = join(tempDir, `duration_check_${Date.now()}.webm`)
      writeFileSync(tempDurationFile, mergedBuffer as any)
      const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${tempDurationFile}"`
      const { stdout: durationOutput } = await execAsync(durationCommand)
      const actualDurationSeconds = parseFloat(durationOutput.trim())
      if (existsSync(tempDurationFile)) unlinkSync(tempDurationFile)
      if (!isNaN(actualDurationSeconds) && actualDurationSeconds > 0) {
        actualDuration = Math.round(actualDurationSeconds)
        console.log(`[Task ${taskId}] ✓ Actual video duration:`, actualDuration, 'seconds')
      }
    } catch (error) {
      console.warn(`[Task ${taskId}] ⚠️ Failed to get actual duration:`, error)
    }
    
    // 生成字幕元数据
    console.log(`[Task ${taskId}] Generating subtitle metadata...`)
    const totalEstimatedDuration = segmentDurations.reduce((sum, dur) => sum + dur, 0)
    const scaleFactor = actualDuration / totalEstimatedDuration
    let cumulativeTime = 0
    const subtitleMetadata = {
      interviewId,
      totalDuration: actualDuration,
      createdAt: new Date().toISOString(),
      mergedVideoUrl: mergedVideoUrl,
      questions: segments.map((seg: any, index: number) => {
        const scaledDuration = Math.round(segmentDurations[index] * scaleFactor)
        const questionData = {
          id: seg.promptId || `question-${index + 1}`,
          questionNumber: seg.sequenceNumber || index + 1,
          category: seg.category || 'General',
          text: seg.questionText || `Question ${index + 1}`,
          startTime: cumulativeTime,
          endTime: cumulativeTime + scaledDuration,
          duration: scaledDuration
        }
        cumulativeTime += scaledDuration
        return questionData
      })
    }
    
    // 上传字幕元数据到 B2
    console.log(`[Task ${taskId}] Uploading subtitle metadata to B2...`)
    let subtitleUrl: string | null = null
    try {
      if (!interviewId) throw new Error(`Interview ID is missing when uploading subtitle metadata for task ${taskId}`)
      
      const jsonString = JSON.stringify(subtitleMetadata, null, 2)
      const buffer = Buffer.from(jsonString, 'utf-8')
      const timestamp = Date.now()
      const subtitleKey = `interviews/${interviewId}/interview-subtitles-${timestamp}.json`
      
      const putSubtitleCommand = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: subtitleKey,
        Body: buffer,
        ContentType: 'application/json',
      })
      
      await s3Client.send(putSubtitleCommand)
      subtitleUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${subtitleKey}`
      console.log(`[Task ${taskId}] ✓ Subtitle metadata uploaded:`, subtitleUrl)
    } catch (error) {
      console.error(`[Task ${taskId}] ⚠️ Failed to upload subtitle metadata:`, error)
    }
    
    // 更新数据库中的视频URL和字幕URL
    console.log(`[Task ${taskId}] Updating database for interview_id: ${interviewId}`)
    
    try {
        // 使用 external ID 查找 Interview
        const interview = await prisma.interview.findUnique({
            where: { interview_id: interviewId }
        })
        
        if (interview) {
            await prisma.interview.update({
                where: { id: interview.id },
                data: {
                    video_url: mergedVideoUrl,
                    subtitle_url: subtitleUrl,
                    total_duration: actualDuration,
                    status: 'completed',
                    completed_at: new Date(),
                    metadata: {
                        ...(interview.metadata as object),
                        merged: true,
                        mergedAt: new Date().toISOString(),
                        segmentCount: segments.length,
                        totalDuration: actualDuration,
                        actualDuration: actualDuration,
                        estimatedDuration: totalDuration,
                        subtitleMetadata: subtitleMetadata,
                        status: 'completed'
                    }
                }
            })
            console.log(`[Task ${taskId}] ✓ Database updated successfully`)
        } else {
             console.warn(`[Task ${taskId}] ⚠️ Update returned no rows - interview_id '${interviewId}' may not exist in database`)
        }
    } catch (updateError) {
        console.error(`[Task ${taskId}] ⚠️ Failed to update database:`, updateError)
    }
    
    // 更新任务状态为 completed
    await prisma.videoProcessingTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completed_at: new Date(),
        merged_video_url: mergedVideoUrl,
        total_duration: actualDuration,
        segment_durations: segmentDurations
      }
    })
    
    // 触发转录任务
    console.log(`[Task ${taskId}] Starting transcription...`)
    try {
      const transcriptionResult = await transcribeVideo(interviewId, mergedVideoUrl)
      if (transcriptionResult.success) {
        console.log(`[Task ${taskId}] ✓ Transcription completed`)
      } else {
        console.error(`[Task ${taskId}] ✗ Transcription failed:`, transcriptionResult.error)
      }
    } catch (error) {
      console.error(`[Task ${taskId}] ✗ Transcription exception:`, error)
    }
    
    return {
      success: true,
      mergedVideoUrl,
      totalDuration: actualDuration,
      segmentDurations
    }
    
  } catch (error) {
    console.error(`[Task ${taskId}] ❌ Error:`, error)
    
    // 更新任务状态为 failed
    try {
        await prisma.videoProcessingTask.update({
            where: { id: taskId },
            data: {
                status: 'failed',
                completed_at: new Date(),
                error_message: error instanceof Error ? error.message : 'Unknown error'
            }
        })
    } catch (e) {
        console.error("Failed to update task status to failed:", e)
    }
    
    throw error
  }
}

/**
 * POST /api/process-video-task
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json()
    
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 })
    }
    
    const result = await processVideoMergeTask(taskId)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[Process Task] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

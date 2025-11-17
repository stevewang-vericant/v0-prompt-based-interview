import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
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
 * 这个函数可以被 API route 调用，也可以被后台任务调用
 */
export async function processVideoMergeTask(taskId: string) {
  const supabase = createAdminClient()
  
  try {
    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('video_processing_tasks')
      .select('*')
      .eq('id', taskId)
      .single()
    
    if (taskError || !task) {
      throw new Error(`Task not found: ${taskId}`)
    }
    
    if (task.status === 'completed') {
      console.log(`[Task ${taskId}] Already completed`)
      return { success: true, task }
    }
    
    if (task.status === 'processing') {
      console.log(`[Task ${taskId}] Already processing`)
      return { success: true, task }
    }
    
    // 更新任务状态为 processing
    await supabase
      .from('video_processing_tasks')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', taskId)
    
    // 注意：数据库字段是 interview_id（下划线），不是 interviewId（驼峰）
    const interviewId = task.interview_id || task.interviewId
    const segments = task.segments
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
      
      // 从URL中提取B2路径
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
      // 将每个分段保存为临时文件
      for (let i = 0; i < videoBuffers.length; i++) {
        const tempFile = join(tempDir, `segment_${i + 1}_${Date.now()}.webm`)
        writeFileSync(tempFile, videoBuffers[i] as any)
        inputFiles.push(tempFile)
        tempFiles.push(tempFile)
      }
      
      // 创建FFmpeg输入文件列表
      const concatFile = join(tempDir, `concat_${Date.now()}.txt`)
      const concatContent = inputFiles.map(file => `file '${file}'`).join('\n')
      writeFileSync(concatFile, concatContent)
      tempFiles.push(concatFile)
      
      // 先合并为临时 webm 文件
      const tempMergedFile = join(tempDir, `temp_merged_${Date.now()}.webm`)
      tempFiles.push(tempMergedFile)
      
      console.log(`[Task ${taskId}] Step 1: Merging videos...`)
      
      // 第一步：合并视频（使用 copy 模式，快速）
      const mergeCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${tempMergedFile}" -y`
      const { stdout: mergeStdout, stderr: mergeStderr } = await execAsync(mergeCommand)
      if (mergeStderr) console.log(`[Task ${taskId}] FFmpeg merge stderr:`, mergeStderr)
      
      if (!existsSync(tempMergedFile)) {
        throw new Error('FFmpeg failed to create merged file')
      }
      
      // 第二步：转码为 MP4，指定 level 4.0 以确保 iOS 兼容性
      const outputFile = join(tempDir, `merged_${Date.now()}.mp4`)
      tempFiles.push(outputFile)
      
      console.log(`[Task ${taskId}] Step 2: Transcoding to MP4 with level 4.0...`)
      
      const transcodeCommand = `ffmpeg -i "${tempMergedFile}" -c:v libx264 -preset medium -crf 23 -profile:v high -level 40 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${outputFile}" -y`
      const { stdout: transcodeStdout, stderr: transcodeStderr } = await execAsync(transcodeCommand)
      if (transcodeStderr) console.log(`[Task ${taskId}] FFmpeg transcode stderr:`, transcodeStderr)
      
      if (!existsSync(outputFile)) {
        throw new Error('FFmpeg failed to create transcoded output file')
      }
      
      // 读取转码后的视频
      mergedBuffer = require('fs').readFileSync(outputFile)
      totalDuration = segmentDurations.reduce((sum, dur) => sum + dur, 0)
      
      // 清理临时文件
      tempFiles.forEach(file => {
        try {
          if (existsSync(file)) {
            unlinkSync(file)
          }
        } catch (e) {
          console.warn(`[Task ${taskId}] Failed to clean up ${file}:`, e)
        }
      })
      
    } catch (error) {
      console.error(`[Task ${taskId}] FFmpeg merge failed:`, error)
      
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
    // 确保 interviewId 不为空
    if (!interviewId) {
      throw new Error(`Interview ID is missing when uploading merged video for task ${taskId}`)
    }
    const mergedKey = `interviews/${interviewId}/merged-interview-${timestamp}.mp4`
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: mergedKey,
      Body: mergedBuffer,
      ContentType: 'video/mp4',
    })
    
    await s3Client.send(putCommand)
    
    const mergedVideoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${mergedKey}`
    
    console.log(`[Task ${taskId}] ✓ Merged video uploaded:`, mergedVideoUrl)
    
    // 获取合并后视频的实际时长
    let actualDuration = totalDuration
    try {
      const tempDurationFile = join(tempDir, `duration_check_${Date.now()}.mp4`)
      writeFileSync(tempDurationFile, mergedBuffer as any)
      
      const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${tempDurationFile}"`
      const { stdout: durationOutput } = await execAsync(durationCommand)
      const actualDurationSeconds = parseFloat(durationOutput.trim())
      
      if (existsSync(tempDurationFile)) {
        unlinkSync(tempDurationFile)
      }
      
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
      if (!interviewId) {
        throw new Error(`Interview ID is missing when uploading subtitle metadata for task ${taskId}`)
      }
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
    console.log(`[Task ${taskId}] Video URL: ${mergedVideoUrl}`)
    console.log(`[Task ${taskId}] Subtitle URL: ${subtitleUrl}`)
    
    const { data: updatedData, error: updateError } = await supabase
      .from('interviews')
      .update({
        video_url: mergedVideoUrl,
        subtitle_url: subtitleUrl,
        total_duration: actualDuration,
        status: 'completed', // 视频处理完成，更新状态为 completed
        completed_at: new Date().toISOString(), // 设置完成时间
        metadata: {
          merged: true,
          mergedAt: new Date().toISOString(),
          segmentCount: segments.length,
          totalDuration: actualDuration,
          actualDuration: actualDuration,
          estimatedDuration: totalDuration,
          subtitleMetadata: subtitleMetadata,
          status: 'completed' // 在 metadata 中也更新状态
        }
      })
      .eq('interview_id', interviewId)
      .select()
    
    if (updateError) {
      console.error(`[Task ${taskId}] ⚠️ Failed to update database:`, updateError)
      console.error(`[Task ${taskId}] Update error details:`, JSON.stringify(updateError, null, 2))
    } else {
      if (updatedData && updatedData.length > 0) {
        console.log(`[Task ${taskId}] ✓ Database updated successfully, affected rows: ${updatedData.length}`)
        console.log(`[Task ${taskId}] Updated interview ID: ${updatedData[0].interview_id}`)
      } else {
        console.warn(`[Task ${taskId}] ⚠️ Update returned no rows - interview_id '${interviewId}' may not exist in database`)
        // 尝试查找是否存在该记录
        const { data: existingInterview } = await supabase
          .from('interviews')
          .select('interview_id, student_email')
          .eq('interview_id', interviewId)
          .single()
        if (existingInterview) {
          console.log(`[Task ${taskId}] Found interview record:`, existingInterview)
        } else {
          console.error(`[Task ${taskId}] Interview record not found for interview_id: ${interviewId}`)
        }
      }
    }
    
    // 更新任务状态为 completed
    await supabase
      .from('video_processing_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        merged_video_url: mergedVideoUrl,
        total_duration: actualDuration,
        segment_durations: segmentDurations
      })
      .eq('id', taskId)
    
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
    await supabase
      .from('video_processing_tasks')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', taskId)
    
    throw error
  }
}

/**
 * POST /api/process-video-task
 * 处理指定的视频合并任务
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json()
    
    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Task ID is required'
      }, { status: 400 })
    }
    
    const result = await processVideoMergeTask(taskId)
    
    return NextResponse.json({
      success: true,
      ...result
    })
    
  } catch (error) {
    console.error('[Process Task] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { transcribeVideo } from '@/app/actions/transcription-simple'
import { evaluateInterviewWithCathoven } from '@/lib/cathoven'
import { sendInterviewCompletionEmail } from '@/lib/email'
import { notifyRatersAfterScoring } from '@/lib/rater-notifications'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

// 单进程内对重型任务（视频下载 + ffmpeg 重编码 + 合并视频上传）串行化。
// 服务器只有 2GB RAM，两路 libx264 并发会直接 OOM 让容器被重启。
let mergeQueue: Promise<unknown> = Promise.resolve()
function runSerialized<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const next = mergeQueue.then(
    () => fn(),
    () => fn(), // 前一个任务失败也要继续跑队列中的下一个
  )
  // 静默消费队列链上的异常，避免 unhandledRejection，同时不丢失真正调用者的结果。
  mergeQueue = next.catch(() => undefined)
  console.log(`[MergeQueue] Enqueued task ${label}`)
  return next
}

const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`,
  region: process.env.B2_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
})

async function runPostMergeProcessing(params: {
  taskId: string
  interviewId: string
  interviewDbId: string
  mergedVideoBuffer: Buffer
  questionTexts: string[]
  mergedVideoUrl: string
}) {
  const { taskId, interviewId, interviewDbId, mergedVideoBuffer, questionTexts, mergedVideoUrl } = params

  // Cathoven scoring should never block video availability.
  try {
    console.log(`[Task ${taskId}] Calling Cathoven IELTS Speaking API...`)
    const cathovenResult = await evaluateInterviewWithCathoven({
      interviewId,
      questions: questionTexts,
      mergedVideoBuffer,
    })

    const reportUrl = `/school/interview-report?interviewId=${encodeURIComponent(interviewId)}`
    const existingInterview = await prisma.interview.findUnique({
      where: { id: interviewDbId },
      select: { metadata: true },
    })
    const existingMetadata =
      existingInterview?.metadata && typeof existingInterview.metadata === 'object'
        ? (existingInterview.metadata as Record<string, any>)
        : {}

    const nextMetadata = {
      ...existingMetadata,
      cathoven: {
        status: cathovenResult.success ? 'completed' : 'failed',
        evaluatedAt: new Date().toISOString(),
        reportUrl,
        rubric: 'vericant_lite',
        response: cathovenResult.response || null,
        error: cathovenResult.error || null,
      },
    }

    await prisma.interview.update({
      where: { id: interviewDbId },
      data: {
        metadata: nextMetadata,
        total_score:
          cathovenResult.success && cathovenResult.finalScore !== null
            ? cathovenResult.finalScore
            : undefined,
        status:
          cathovenResult.success && cathovenResult.finalScore !== null
            ? 'scored'
            : undefined,
      },
    })

    if (cathovenResult.success && cathovenResult.finalScore !== null) {
      console.log(`[Task ${taskId}] ✓ Cathoven scoring completed`)
      await notifyRatersAfterScoring({
        interviewDbId,
        interviewId,
        finalScore: cathovenResult.finalScore,
        logPrefix: `[Task ${taskId}]`,
      })
    } else if (cathovenResult.success) {
      console.log(`[Task ${taskId}] ✓ Cathoven scoring completed (no final score)`)
    } else {
      console.error(`[Task ${taskId}] ✗ Cathoven scoring failed:`, cathovenResult.error)
    }
  } catch (error) {
    console.error(`[Task ${taskId}] ✗ Cathoven scoring exception:`, error)
  }

  // Transcription should also be best-effort and non-blocking for watch flow.
  try {
    console.log(`[Task ${taskId}] Starting transcription...`)
    const transcriptionResult = await transcribeVideo(interviewId, mergedVideoUrl)
    if (transcriptionResult.success) {
      console.log(`[Task ${taskId}] ✓ Transcription completed`)
    } else {
      console.error(`[Task ${taskId}] ✗ Transcription failed:`, transcriptionResult.error)
    }
  } catch (error) {
    console.error(`[Task ${taskId}] ✗ Transcription exception:`, error)
  }
}

/**
 * 处理视频合并任务的核心函数。
 *
 * 对外导出以便 /api/merge-videos 直接内存调用，不再依赖 HTTP 自调
 * （HTTP 自调在反向代理下会因 origin 构造错误导致 SSL "wrong version number"，
 * 任务永远停留在 pending）。
 *
 * 同一 Node 进程内的多个调用会经 `runSerialized` 排队，避免多路 ffmpeg 同时重编码耗尽内存。
 */
export async function processVideoMergeTask(taskId: string) {
  return runSerialized(taskId, () => processVideoMergeTaskInner(taskId))
}

async function processVideoMergeTaskInner(taskId: string) {
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

    // 每段是否包含 prep（由学生端在新流程中传入 prepDuration > 0）。
    // 如果所有分段都没有 prepDuration（旧客户端 / 中途升级时），完全走老路径，
    // 不生成"包含 prep"的视频，行为与升级前一致。
    const segmentPrepDurations: number[] = segments.map((seg) => {
      const v = Number((seg && seg.prepDuration) ?? 0)
      return Number.isFinite(v) && v > 0 ? Math.round(v) : 0
    })
    const hasPrepData = segmentPrepDurations.some((d) => d > 0)
    if (hasPrepData) {
      console.log(
        `[Task ${taskId}] Continuous-recording detected (prep+response). prepDurations=`,
        segmentPrepDurations,
      )
    } else {
      console.log(
        `[Task ${taskId}] Legacy segments (response-only). Will skip with-prep video.`,
      )
    }

    // Load prompts text for better subtitles
    // UUID regex pattern to filter out non-UUID promptIds like "free-speech"
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const allPromptIds = Array.from(
      new Set(segments.map((seg) => seg.promptId).filter(Boolean))
    )
    // Only query database with valid UUIDs
    const validUuidPromptIds = allPromptIds.filter((id) => uuidPattern.test(id))
    
    const prompts = validUuidPromptIds.length
      ? await prisma.prompt.findMany({
          where: { id: { in: validUuidPromptIds } },
          select: { id: true, prompt_text: true, category: true },
        })
      : []
    const promptMap = new Map<string, { prompt_text: string; category: string }>()
    prompts.forEach((prompt) => {
      promptMap.set(prompt.id, {
        prompt_text: prompt.prompt_text,
        category: prompt.category,
      })
    })
    
    // Handle special "free-speech" prompt manually
    if (allPromptIds.includes('free-speech')) {
      promptMap.set('free-speech', {
        prompt_text: 'This is your free speech time. You can say anything you want.',
        category: 'Free Speech',
      })
    }
    
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
    //
    // 新流程总览：
    //  Pass A — 把每个原始 webm 单独转码为 MP4（确保浏览器兼容、且关键帧可控）。
    //  分支 1 (response-only)：每段从 prepDuration 处用 -c copy 快速截掉前段，再 concat。
    //  分支 2 (with-prep)：直接对所有 Pass A 输出做 -c copy concat，不二次编码。
    //
    // 旧流程兼容：当 hasPrepData=false 时，Pass A 输出本身就是"完整应答"，仅做 concat 得到
    // 与原版一致的 merged-interview.mp4，并跳过 with-prep 视频。
    //
    // 全程 -threads 1 / preset veryfast，仍由外层 runSerialized 排队，单时只有一个 ffmpeg
    // 在跑，2GB RAM 安全。
    let mergedBuffer: Buffer
    let mergedWithPrepBuffer: Buffer | null = null
    let totalDuration: number
    // 真正用于"response-only"视频的每段时长（webm 全长 - prep）
    const responseSegmentDurations: number[] = []

    try {
      // Pass A: 每个原始 webm -> 中间 MP4
      const intermediateMp4s: string[] = []
      for (let i = 0; i < videoBuffers.length; i++) {
        const inputWebm = join(tempDir, `seg_in_${i + 1}_${Date.now()}.webm`)
        const outputMp4 = join(tempDir, `seg_mp4_${i + 1}_${Date.now()}.mp4`)
        writeFileSync(inputWebm, videoBuffers[i] as any)
        tempFiles.push(inputWebm, outputMp4)
        intermediateMp4s.push(outputMp4)

        const cmd = `ffmpeg -loglevel error -i "${inputWebm}" -c:v libx264 -preset veryfast -crf 23 -profile:v high -level 4.0 -pix_fmt yuv420p -vsync cfr -r 30 -threads 1 -c:a aac -b:a 128k -movflags +faststart "${outputMp4}" -y`
        const { stderr } = await execAsync(cmd, { maxBuffer: 100 * 1024 * 1024 })
        if (stderr) console.log(`[Task ${taskId}] FFmpeg passA seg ${i + 1} stderr:`, stderr)
        if (!existsSync(outputMp4)) {
          throw new Error(`FFmpeg failed to produce intermediate MP4 for segment ${i + 1}`)
        }
      }

      // 准备 response-only 分段（必要时按 prepDuration 裁剪头部）
      const responseOnlyMp4s: string[] = []
      for (let i = 0; i < intermediateMp4s.length; i++) {
        const prep = segmentPrepDurations[i] || 0
        if (prep > 0) {
          const trimmed = join(tempDir, `seg_resp_${i + 1}_${Date.now()}.mp4`)
          tempFiles.push(trimmed)
          // 把 -ss 放在 -i 之后才会精确按 PTS 裁剪到 prep 秒；MP4 已带可靠的关键帧分布，
          // 用 -c copy 几乎瞬间完成，不再二次编码。
          const trimCmd = `ffmpeg -loglevel error -i "${intermediateMp4s[i]}" -ss ${prep} -c copy -movflags +faststart "${trimmed}" -y`
          const { stderr } = await execAsync(trimCmd, { maxBuffer: 100 * 1024 * 1024 })
          if (stderr) console.log(`[Task ${taskId}] FFmpeg trim seg ${i + 1} stderr:`, stderr)
          if (!existsSync(trimmed)) {
            // 极端情况下 -ss + -c copy 可能产出空文件；回退到带重编码裁剪。
            console.warn(`[Task ${taskId}] -c copy trim produced no file; retrying with re-encode`)
            const reTrimCmd = `ffmpeg -loglevel error -ss ${prep} -i "${intermediateMp4s[i]}" -c:v libx264 -preset veryfast -crf 23 -profile:v high -level 4.0 -pix_fmt yuv420p -vsync cfr -r 30 -threads 1 -c:a aac -b:a 128k -movflags +faststart "${trimmed}" -y`
            const { stderr: re } = await execAsync(reTrimCmd, { maxBuffer: 100 * 1024 * 1024 })
            if (re) console.log(`[Task ${taskId}] FFmpeg trim-reencode seg ${i + 1} stderr:`, re)
            if (!existsSync(trimmed)) {
              throw new Error(`Failed to trim prep from segment ${i + 1}`)
            }
          }
          responseOnlyMp4s.push(trimmed)
          // 修正字幕时间使用的"应答时长"
          const trimmedDuration = Math.max(1, segmentDurations[i] - prep)
          responseSegmentDurations.push(trimmedDuration)
        } else {
          // 没有 prep（旧分段或 prepDuration=0）
          responseOnlyMp4s.push(intermediateMp4s[i])
          responseSegmentDurations.push(segmentDurations[i])
        }
      }

      // 分支 1: response-only concat -> mergedBuffer（继续写入 Interview.video_url）
      const respConcatFile = join(tempDir, `concat_resp_${Date.now()}.txt`)
      writeFileSync(
        respConcatFile,
        responseOnlyMp4s.map((file) => `file '${file}'`).join('\n'),
      )
      tempFiles.push(respConcatFile)

      const respMergedFile = join(tempDir, `merged_resp_${Date.now()}.mp4`)
      tempFiles.push(respMergedFile)
      const respConcatCmd = `ffmpeg -loglevel error -f concat -safe 0 -i "${respConcatFile}" -c copy -movflags +faststart "${respMergedFile}" -y`
      const { stderr: respStderr } = await execAsync(respConcatCmd, { maxBuffer: 100 * 1024 * 1024 })
      if (respStderr) console.log(`[Task ${taskId}] FFmpeg response concat stderr:`, respStderr)
      if (!existsSync(respMergedFile)) {
        throw new Error('FFmpeg failed to produce response-only merged file')
      }
      console.log(`[Task ${taskId}] ✓ Response-only video produced`)
      mergedBuffer = require('fs').readFileSync(respMergedFile)

      // 分支 2: with-prep concat -> mergedWithPrepBuffer（仅当本次面试包含 prep 数据）
      if (hasPrepData) {
        const prepConcatFile = join(tempDir, `concat_prep_${Date.now()}.txt`)
        writeFileSync(
          prepConcatFile,
          intermediateMp4s.map((file) => `file '${file}'`).join('\n'),
        )
        tempFiles.push(prepConcatFile)

        const prepMergedFile = join(tempDir, `merged_prep_${Date.now()}.mp4`)
        tempFiles.push(prepMergedFile)
        const prepConcatCmd = `ffmpeg -loglevel error -f concat -safe 0 -i "${prepConcatFile}" -c copy -movflags +faststart "${prepMergedFile}" -y`
        const { stderr: prepStderr } = await execAsync(prepConcatCmd, { maxBuffer: 100 * 1024 * 1024 })
        if (prepStderr) console.log(`[Task ${taskId}] FFmpeg with-prep concat stderr:`, prepStderr)
        if (!existsSync(prepMergedFile)) {
          throw new Error('FFmpeg failed to produce with-prep merged file')
        }
        console.log(`[Task ${taskId}] ✓ With-prep video produced`)
        mergedWithPrepBuffer = require('fs').readFileSync(prepMergedFile)
      }

      totalDuration = responseSegmentDurations.reduce((sum, dur) => sum + dur, 0)

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
    
    // 上传合并后的视频（MP4格式）
    const timestamp = Date.now()
    if (!interviewId) throw new Error(`Interview ID is missing when uploading merged video for task ${taskId}`)
    
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

    // 仅当本次面试包含 prep 数据时上传 with-prep 版本
    let mergedWithPrepUrl: string | null = null
    if (mergedWithPrepBuffer) {
      const withPrepKey = `interviews/${interviewId}/merged-with-prep-${timestamp}.mp4`
      const putWithPrepCommand = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: withPrepKey,
        Body: mergedWithPrepBuffer,
        ContentType: 'video/mp4',
      })
      await s3Client.send(putWithPrepCommand)
      mergedWithPrepUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${withPrepKey}`
      console.log(`[Task ${taskId}] ✓ With-prep video uploaded:`, mergedWithPrepUrl)
    }
    
    // 获取合并后视频的实际时长
    let actualDuration = totalDuration
    try {
      const tempDurationFile = join(tempDir, `duration_check_${Date.now()}.mp4`)
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
    // 注意：字幕是基于"response-only"合并视频（写入 Interview.video_url）的时间轴，
    // 因此分段时长必须使用裁掉 prep 后的 responseSegmentDurations。
    console.log(`[Task ${taskId}] Generating subtitle metadata...`)
    const totalEstimatedDuration = responseSegmentDurations.reduce((sum, dur) => sum + dur, 0)
    const scaleFactor = totalEstimatedDuration > 0 ? actualDuration / totalEstimatedDuration : 1
    let cumulativeTime = 0
    const subtitleMetadata = {
      interviewId,
      totalDuration: actualDuration,
      createdAt: new Date().toISOString(),
      mergedVideoUrl: mergedVideoUrl,
      questions: segments.map((seg: any, index: number) => {
        const scaledDuration = Math.round(responseSegmentDurations[index] * scaleFactor)
        const promptInfo = promptMap.get(seg.promptId)
        const questionText =
          promptInfo?.prompt_text || seg.questionText || `Question ${index + 1}`
        const questionCategory = promptInfo?.category || seg.category || 'General'
        const questionData = {
          id: seg.promptId || `question-${index + 1}`,
          questionNumber: seg.sequenceNumber || index + 1,
          category: questionCategory,
          text: questionText,
          startTime: cumulativeTime,
          endTime: cumulativeTime + scaledDuration,
          duration: scaledDuration
        }
        cumulativeTime += scaledDuration
        return questionData
      })
    }
    const questionTexts = subtitleMetadata.questions
      .map((item) => item.text)
      .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)
    
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
    let interviewDbId: string | null = null

    try {
        // 使用 external ID 查找 Interview
        const interview = await prisma.interview.findUnique({
            where: { interview_id: interviewId },
            select: {
              id: true,
              metadata: true,
              student: {
                select: {
                  email: true,
                  name: true,
                }
              }
            }
        })
        
        if (interview) {
            interviewDbId = interview.id
            await prisma.interview.update({
                where: { id: interview.id },
                data: {
                    video_url: mergedVideoUrl,
                    // 仅当本次产生了 with-prep 视频时写入；老面试保持 null
                    ...(mergedWithPrepUrl
                      ? { video_with_prep_url: mergedWithPrepUrl }
                      : {}),
                    subtitle_url: subtitleUrl,
                    total_duration: actualDuration,
                    status: 'completed',
                    completed_at: new Date(),
                    metadata: {
                        ...(interview.metadata as object),
                        taskId: taskId,
                        merged: true,
                        mergedAt: new Date().toISOString(),
                        segmentCount: segments.length,
                        totalDuration: actualDuration,
                        actualDuration: actualDuration,
                        estimatedDuration: totalDuration,
                        subtitleMetadata: subtitleMetadata,
                        ...(mergedWithPrepUrl
                          ? { mergedWithPrepVideoUrl: mergedWithPrepUrl }
                          : {}),
                        status: 'completed'
                    }
                }
            })
            console.log(`[Task ${taskId}] ✓ Database updated successfully`)

            // 发送面试完成通知（最佳努力，不阻塞主流程）
            if (interview.student?.email) {
              try {
                await sendInterviewCompletionEmail(
                  interview.student.email,
                  interview.student.name,
                  mergedVideoUrl,
                )
                console.log(`[Task ${taskId}] ✓ Interview completion email sent to student`)
              } catch (emailError) {
                console.error(
                  `[Task ${taskId}] ⚠️ Failed to send interview completion email:`,
                  emailError,
                )
              }
            } else {
              console.warn(
                `[Task ${taskId}] ⚠️ Skip interview completion email: student email not found`,
              )
            }
        } else {
             console.warn(`[Task ${taskId}] ⚠️ Update returned no rows - interview_id '${interviewId}' may not exist in database`)
        }
    } catch (updateError) {
        console.error(`[Task ${taskId}] ⚠️ Failed to update database:`, updateError)
    }

    // 只要完整视频和基础元数据已落库，就立刻把视频任务标记完成。
    // 后续转录和 Cathoven 评分属于附加流程，不应阻塞 Watch。
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

    // 异步执行后处理，避免卡住主流程。
    if (interviewDbId) {
      void runPostMergeProcessing({
        taskId,
        interviewId,
        interviewDbId,
        mergedVideoBuffer: mergedBuffer,
        questionTexts,
        mergedVideoUrl,
      })
    }
    
    return {
      success: true,
      mergedVideoUrl,
      totalDuration: actualDuration,
      segmentDurations
    }
    
  } catch (error) {
    console.error(`[Task ${taskId}] ❌ Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // 更新任务状态为 failed
    try {
        await prisma.videoProcessingTask.update({
            where: { id: taskId },
            data: {
                status: 'failed',
                completed_at: new Date(),
                error_message: errorMessage,
            }
        })
    } catch (e) {
        console.error("Failed to update task status to failed:", e)
    }

    // 同步将 interview 状态从 processing 更新为 failed，避免面试永远卡在 processing
    try {
      const task = await prisma.videoProcessingTask.findUnique({ where: { id: taskId }, select: { interview_id: true } })
      if (task?.interview_id) {
        await prisma.interview.updateMany({
          where: { interview_id: task.interview_id, status: 'processing' },
          data: {
            status: 'failed',
            metadata: {
              videoProcessingError: errorMessage,
              videoProcessingFailedAt: new Date().toISOString(),
            },
          },
        })
        console.log(`[Task ${taskId}] Interview status updated to failed`)
      }
    } catch (e) {
      console.error(`[Task ${taskId}] Failed to update interview status to failed:`, e)
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

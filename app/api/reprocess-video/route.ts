import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import * as https from 'https'
import * as http from 'http'

export const dynamic = "force-dynamic"

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
 * Download file from URL
 */
function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }
      
      const chunks: Buffer[] = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    }).on('error', reject)
  })
}

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json()
    
    if (!interviewId) {
      return NextResponse.json({ 
        success: false, 
        error: 'interviewId is required' 
      }, { status: 400 })
    }

    console.log(`[Reprocess] Starting reprocess for interview: ${interviewId}`)

    // 1. Get interview and segments from database
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      include: {
        responses: {
          orderBy: { sequence_number: 'asc' }
        }
      }
    })

    if (!interview) {
      return NextResponse.json({ 
        success: false, 
        error: `Interview not found: ${interviewId}` 
      }, { status: 404 })
    }

    if (!interview.responses || interview.responses.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `No video segments found for interview: ${interviewId}` 
      }, { status: 404 })
    }

    console.log(`[Reprocess] Found ${interview.responses.length} video segments`)

    // 2. Download all segments
    console.log('[Reprocess] Downloading video segments...')
    const tempDir = tmpdir()
    const tempFiles: string[] = []
    const inputFiles: string[] = []

    for (let i = 0; i < interview.responses.length; i++) {
      const response = interview.responses[i]
      if (!response.video_url) {
        throw new Error(`Segment ${response.sequence_number} has no video URL`)
      }

      console.log(`[Reprocess] Downloading segment ${i + 1}/${interview.responses.length}...`)
      const videoBuffer = await downloadFile(response.video_url)
      const tempFile = join(tempDir, `segment_${response.sequence_number}_${Date.now()}.webm`)
      writeFileSync(tempFile, videoBuffer)
      tempFiles.push(tempFile)
      inputFiles.push(tempFile)
      console.log(`[Reprocess] ✓ Segment ${i + 1} downloaded (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)`)
    }

    // 3. Create concat file for FFmpeg
    console.log('[Reprocess] Creating concat file...')
    const concatFile = join(tempDir, `concat_${Date.now()}.txt`)
    const concatContent = inputFiles.map(file => `file '${file}'`).join('\n')
    writeFileSync(concatFile, concatContent)
    tempFiles.push(concatFile)

    // 4. Merge and convert to MP4 using FFmpeg
    console.log('[Reprocess] Merging videos and converting to MP4...')
    const tempMergedFile = join(tempDir, `merged_${Date.now()}.mp4`)
    tempFiles.push(tempMergedFile)

    const mergeCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset medium -crf 23 -profile:v high -level 4.0 -pix_fmt yuv420p -vsync cfr -r 30 -c:a aac -b:a 128k -movflags +faststart "${tempMergedFile}" -y`
    
    console.log('[Reprocess] Running FFmpeg command...')
    const { stdout, stderr } = await execAsync(mergeCommand)
    if (stderr && !stderr.includes('frame=')) {
      console.warn('[Reprocess] FFmpeg warnings:', stderr)
    }

    if (!existsSync(tempMergedFile)) {
      throw new Error('FFmpeg failed to create merged file')
    }

    const mergedBuffer = readFileSync(tempMergedFile)
    console.log(`[Reprocess] ✓ Video merged successfully (${(mergedBuffer.length / 1024 / 1024).toFixed(2)} MB)`)

    // 5. Get actual duration
    console.log('[Reprocess] Getting video duration...')
    let actualDuration = interview.total_duration || 0
    try {
      const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${tempMergedFile}"`
      const { stdout: durationOutput } = await execAsync(durationCommand)
      const durationSeconds = parseFloat(durationOutput.trim())
      if (!isNaN(durationSeconds) && durationSeconds > 0) {
        actualDuration = Math.round(durationSeconds)
        console.log(`[Reprocess] ✓ Duration: ${actualDuration} seconds`)
      }
    } catch (error) {
      console.warn('[Reprocess] ⚠️  Failed to get duration:', error)
    }

    // 6. Upload merged MP4 to B2
    console.log('[Reprocess] Uploading merged video to B2...')
    const timestamp = Date.now()
    const mergedKey = `interviews/${interviewId}/merged-interview-${timestamp}.mp4`
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: mergedKey,
      Body: mergedBuffer,
      ContentType: 'video/mp4',
    })

    await s3Client.send(putCommand)
    const mergedVideoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${mergedKey}`
    console.log(`[Reprocess] ✓ Uploaded: ${mergedVideoUrl}`)

    // 7. Generate subtitle metadata
    console.log('[Reprocess] Generating subtitle metadata...')
    const segmentDurations = interview.responses.map(r => r.video_duration || 90)
    const totalEstimatedDuration = segmentDurations.reduce((sum, dur) => sum + dur, 0)
    const scaleFactor = actualDuration / totalEstimatedDuration
    let cumulativeTime = 0

    const subtitleMetadata = {
      interviewId,
      totalDuration: actualDuration,
      createdAt: new Date().toISOString(),
      mergedVideoUrl: mergedVideoUrl,
      questions: interview.responses.map((response, index) => {
        const scaledDuration = Math.round(segmentDurations[index] * scaleFactor)
        const questionData = {
          id: response.prompt_id || `question-${index + 1}`,
          questionNumber: response.sequence_number,
          category: 'General',
          text: `Question ${response.sequence_number}`,
          startTime: cumulativeTime,
          endTime: cumulativeTime + scaledDuration,
          duration: scaledDuration
        }
        cumulativeTime += scaledDuration
        return questionData
      })
    }

    // 8. Upload subtitle metadata
    console.log('[Reprocess] Uploading subtitle metadata...')
    const jsonString = JSON.stringify(subtitleMetadata, null, 2)
    const jsonBuffer = Buffer.from(jsonString, 'utf-8')
    const subtitleKey = `interviews/${interviewId}/interview-subtitles-${timestamp}.json`
    
    const putSubtitleCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: subtitleKey,
      Body: jsonBuffer,
      ContentType: 'application/json',
    })

    await s3Client.send(putSubtitleCommand)
    const subtitleUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${subtitleKey}`
    console.log(`[Reprocess] ✓ Uploaded: ${subtitleUrl}`)

    // 9. Update database
    console.log('[Reprocess] Updating database...')
    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        video_url: mergedVideoUrl,
        subtitle_url: subtitleUrl,
        total_duration: actualDuration,
        status: 'completed',
        completed_at: new Date(),
        metadata: {
          ...(interview.metadata as object || {}),
          reprocessed: true,
          reprocessedAt: new Date().toISOString(),
          merged: true,
          mergedAt: new Date().toISOString(),
          segmentCount: interview.responses.length,
          totalDuration: actualDuration,
          actualDuration: actualDuration,
          subtitleMetadata: subtitleMetadata,
          status: 'completed'
        }
      }
    })
    console.log('[Reprocess] ✓ Database updated successfully')

    // 10. Cleanup temp files
    console.log('[Reprocess] Cleaning up temporary files...')
    tempFiles.forEach(file => {
      try {
        if (existsSync(file)) unlinkSync(file)
      } catch (e) {
        console.warn(`[Reprocess] ⚠️  Failed to delete ${file}:`, e)
      }
    })
    console.log('[Reprocess] ✓ Cleanup complete')

    return NextResponse.json({
      success: true,
      videoUrl: mergedVideoUrl,
      subtitleUrl: subtitleUrl,
      duration: actualDuration,
      message: 'Video reprocessed successfully'
    })

  } catch (error) {
    console.error('[Reprocess] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Script to reprocess a specific interview video
 * Downloads segments, merges them into MP4, uploads to B2, and updates database
 * 
 * Usage: 
 *   tsx scripts/reprocess-video.ts <interview_id>
 * 
 * Example:
 *   tsx scripts/reprocess-video.ts interview-1768641515832-13na37xei
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '../lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import * as https from 'https'
import * as http from 'http'

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

/**
 * Extract key from B2 URL
 */
function extractB2Key(url: string): string {
  const match = url.match(/\/file\/[^\/]+\/(.+)$/)
  if (!match) {
    throw new Error(`Invalid B2 URL format: ${url}`)
  }
  return match[1]
}

async function reprocessVideo(interviewId: string) {
  console.log(`\n🔄 Starting reprocess for interview: ${interviewId}\n`)

  try {
    // 1. Get interview and segments from database
    console.log('📊 Fetching interview data from database...')
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      include: {
        responses: {
          orderBy: { sequence_number: 'asc' }
        }
      }
    })

    if (!interview) {
      throw new Error(`Interview not found: ${interviewId}`)
    }

    if (!interview.responses || interview.responses.length === 0) {
      throw new Error(`No video segments found for interview: ${interviewId}`)
    }

    console.log(`✓ Found ${interview.responses.length} video segments`)

    // 2. Download all segments
    console.log('\n📥 Downloading video segments...')
    const tempDir = tmpdir()
    const tempFiles: string[] = []
    const inputFiles: string[] = []

    for (let i = 0; i < interview.responses.length; i++) {
      const response = interview.responses[i]
      if (!response.video_url) {
        throw new Error(`Segment ${response.sequence_number} has no video URL`)
      }

      console.log(`  Downloading segment ${i + 1}/${interview.responses.length}...`)
      const videoBuffer = await downloadFile(response.video_url)
      const tempFile = join(tempDir, `segment_${response.sequence_number}_${Date.now()}.webm`)
      writeFileSync(tempFile, videoBuffer)
      tempFiles.push(tempFile)
      inputFiles.push(tempFile)
      console.log(`  ✓ Segment ${i + 1} downloaded (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)`)
    }

    // 3. Create concat file for FFmpeg
    console.log('\n🔗 Creating concat file...')
    const concatFile = join(tempDir, `concat_${Date.now()}.txt`)
    const concatContent = inputFiles.map(file => `file '${file}'`).join('\n')
    writeFileSync(concatFile, concatContent)
    tempFiles.push(concatFile)

    // 4. Merge and convert to MP4 using FFmpeg
    console.log('\n🎬 Merging videos and converting to MP4...')
    const tempMergedFile = join(tempDir, `merged_${Date.now()}.mp4`)
    tempFiles.push(tempMergedFile)

    const mergeCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset medium -crf 23 -profile:v high -level 4.0 -pix_fmt yuv420p -vsync cfr -r 30 -c:a aac -b:a 128k -movflags +faststart "${tempMergedFile}" -y`
    
    console.log('  Running FFmpeg command...')
    const { stdout, stderr } = await execAsync(mergeCommand)
    if (stderr && !stderr.includes('frame=')) {
      console.warn('  FFmpeg warnings:', stderr)
    }

    if (!existsSync(tempMergedFile)) {
      throw new Error('FFmpeg failed to create merged file')
    }

    const mergedBuffer = readFileSync(tempMergedFile)
    console.log(`  ✓ Video merged successfully (${(mergedBuffer.length / 1024 / 1024).toFixed(2)} MB)`)

    // 5. Get actual duration
    console.log('\n⏱️  Getting video duration...')
    let actualDuration = interview.total_duration || 0
    try {
      const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${tempMergedFile}"`
      const { stdout: durationOutput } = await execAsync(durationCommand)
      const durationSeconds = parseFloat(durationOutput.trim())
      if (!isNaN(durationSeconds) && durationSeconds > 0) {
        actualDuration = Math.round(durationSeconds)
        console.log(`  ✓ Duration: ${actualDuration} seconds`)
      }
    } catch (error) {
      console.warn('  ⚠️  Failed to get duration:', error)
    }

    // 6. Upload merged MP4 to B2
    console.log('\n☁️  Uploading merged video to B2...')
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
    console.log(`  ✓ Uploaded: ${mergedVideoUrl}`)

    // 7. Generate subtitle metadata (reuse existing logic)
    console.log('\n📝 Generating subtitle metadata...')
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
    console.log('\n📄 Uploading subtitle metadata...')
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
    console.log(`  ✓ Uploaded: ${subtitleUrl}`)

    // 9. Update database
    console.log('\n💾 Updating database...')
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
    console.log('  ✓ Database updated successfully')

    // 10. Cleanup temp files
    console.log('\n🧹 Cleaning up temporary files...')
    tempFiles.forEach(file => {
      try {
        if (existsSync(file)) unlinkSync(file)
      } catch (e) {
        console.warn(`  ⚠️  Failed to delete ${file}:`, e)
      }
    })
    console.log('  ✓ Cleanup complete')

    console.log('\n✅ Video reprocessing completed successfully!')
    console.log(`\n📹 New video URL: ${mergedVideoUrl}`)
    console.log(`📄 Subtitle URL: ${subtitleUrl}`)
    console.log(`⏱️  Duration: ${actualDuration} seconds\n`)

  } catch (error) {
    console.error('\n❌ Error reprocessing video:', error)
    throw error
  }
}

// Main execution
const interviewId = process.argv[2]

if (!interviewId) {
  console.error('Usage: tsx scripts/reprocess-video.ts <interview_id>')
  console.error('Example: tsx scripts/reprocess-video.ts interview-1768641515832-13na37xei')
  process.exit(1)
}

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.production' })

reprocessVideo(interviewId)
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })

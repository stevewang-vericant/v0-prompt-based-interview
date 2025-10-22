import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
import { transcribeVideo } from '@/app/actions/transcription-simple'
import { 
  uploadVideoSegment, 
  mergeVideoSegments, 
  downloadMergedVideo, 
  cleanupTempFiles 
} from '@/lib/cloudinary'

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
    
    console.log('[Cloudinary Merge] ========== START CLOUDINARY MERGE ==========')
    console.log('[Cloudinary Merge] Interview ID:', interviewId)
    console.log('[Cloudinary Merge] Segments count:', segments.length)
    
    if (!segments || segments.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No segments provided' 
      })
    }
    
    // 1. 上传所有片段到Cloudinary
    console.log('[Cloudinary Merge] Step 1: Uploading segments to Cloudinary...')
    const cloudinarySegments: string[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      console.log(`[Cloudinary Merge] Uploading segment ${i + 1}/${segments.length}`)
      
      // 从B2下载视频片段
      const videoResponse = await fetch(segment.url)
      if (!videoResponse.ok) {
        throw new Error(`Failed to download segment ${i + 1}: ${videoResponse.status}`)
      }
      
      const videoBlob = await videoResponse.blob()
      
      // 上传到Cloudinary
      const uploadResult = await uploadVideoSegment(videoBlob, interviewId, i + 1)
      cloudinarySegments.push(uploadResult.public_id)
      
      console.log(`[Cloudinary Merge] ✓ Segment ${i + 1} uploaded to Cloudinary`)
    }
    
    // 2. 在Cloudinary中合并视频
    console.log('[Cloudinary Merge] Step 2: Merging videos in Cloudinary...')
    const mergeResult = await mergeVideoSegments(cloudinarySegments, interviewId)
    console.log('[Cloudinary Merge] ✓ Videos merged in Cloudinary')
    
    // 3. 下载合并后的视频
    console.log('[Cloudinary Merge] Step 3: Downloading merged video...')
    const mergedVideoBuffer = await downloadMergedVideo(mergeResult.secure_url)
    console.log('[Cloudinary Merge] ✓ Merged video downloaded')
    
    // 4. 上传到B2
    console.log('[Cloudinary Merge] Step 4: Uploading to B2...')
    const b2Key = `interviews/${interviewId}/merged-video.mp4`
    
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: b2Key,
      Body: mergedVideoBuffer,
      ContentType: 'video/mp4',
      Metadata: {
        'interview-id': interviewId,
        'merged-at': new Date().toISOString(),
        'cloudinary-public-id': mergeResult.public_id
      }
    }))
    
    const mergedVideoUrl = `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${b2Key}`
    console.log('[Cloudinary Merge] ✓ Video uploaded to B2:', mergedVideoUrl)
    
    // 5. 更新数据库
    console.log('[Cloudinary Merge] Step 5: Updating database...')
    const supabase = createAdminClient()
    
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        video_url: mergedVideoUrl,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('interview_id', interviewId)
    
    if (updateError) {
      console.error('[Cloudinary Merge] ✗ Database update failed:', updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }
    
    console.log('[Cloudinary Merge] ✓ Database updated')
    
    // 6. 触发转录
    console.log('[Cloudinary Merge] Step 6: Starting transcription...')
    try {
      const transcriptionResult = await transcribeVideo(interviewId, mergedVideoUrl)
      if (transcriptionResult.success) {
        console.log('[Cloudinary Merge] ✓ Transcription started successfully')
      } else {
        console.error('[Cloudinary Merge] ✗ Transcription failed:', transcriptionResult.error)
      }
    } catch (transcriptionError) {
      console.error('[Cloudinary Merge] ✗ Transcription error:', transcriptionError)
    }
    
    // 7. 清理Cloudinary临时文件
    console.log('[Cloudinary Merge] Step 7: Cleaning up temp files...')
    await cleanupTempFiles(interviewId)
    console.log('[Cloudinary Merge] ✓ Temp files cleaned up')
    
    console.log('[Cloudinary Merge] ========== CLOUDINARY MERGE COMPLETED ==========')
    
    return NextResponse.json({
      success: true,
      message: 'Video merged successfully using Cloudinary',
      videoUrl: mergedVideoUrl,
      duration: mergeResult.duration,
      size: mergeResult.bytes
    })
    
  } catch (error) {
    console.error('[Cloudinary Merge] ========== CLOUDINARY MERGE FAILED ==========')
    console.error('[Cloudinary Merge] Error:', error)
    
    // 尝试清理临时文件
    try {
      const { interviewId } = await request.json()
      await cleanupTempFiles(interviewId)
    } catch (cleanupError) {
      console.error('[Cloudinary Merge] Cleanup failed:', cleanupError)
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

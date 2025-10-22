import { v2 as cloudinary } from 'cloudinary'

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  format: string
  bytes: number
  duration?: number
}

export interface CloudinaryMergeResult {
  public_id: string
  secure_url: string
  format: string
  bytes: number
  duration: number
}

/**
 * 上传视频片段到Cloudinary
 */
export async function uploadVideoSegment(
  videoBlob: Blob,
  interviewId: string,
  segmentIndex: number
): Promise<CloudinaryUploadResult> {
  try {
    console.log(`[Cloudinary] Uploading segment ${segmentIndex} for interview ${interviewId}`)
    
    // 将Blob转换为Buffer
    const arrayBuffer = await videoBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const result = await cloudinary.uploader.upload(
      `data:video/mp4;base64,${buffer.toString('base64')}`,
      {
        resource_type: 'video',
        folder: `temp-interviews/${interviewId}`,
        public_id: `segment-${segmentIndex}`,
        format: 'mp4',
        quality: 'auto',
        fetch_format: 'auto'
      }
    )
    
    console.log(`[Cloudinary] ✓ Segment ${segmentIndex} uploaded:`, result.public_id)
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration
    }
  } catch (error) {
    console.error(`[Cloudinary] ✗ Failed to upload segment ${segmentIndex}:`, error)
    throw error
  }
}

/**
 * 合并多个视频片段
 */
export async function mergeVideoSegments(
  segmentIds: string[],
  interviewId: string
): Promise<CloudinaryMergeResult> {
  try {
    console.log(`[Cloudinary] Merging ${segmentIds.length} segments for interview ${interviewId}`)
    console.log(`[Cloudinary] Segment IDs:`, segmentIds)
    
    // 使用Cloudinary的拼接功能
    const result = await cloudinary.v2.uploader.multi(
      segmentIds,
      {
        resource_type: 'video',
        folder: `merged-interviews/${interviewId}`,
        public_id: 'merged-video',
        format: 'mp4',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          {
            flags: 'splice',
            format: 'mp4'
          }
        ]
      }
    )
    
    console.log(`[Cloudinary] ✓ Video merged successfully:`, result.public_id)
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration
    }
  } catch (error) {
    console.error(`[Cloudinary] ✗ Failed to merge segments:`, error)
    throw error
  }
}

/**
 * 下载合并后的视频
 */
export async function downloadMergedVideo(secureUrl: string): Promise<Buffer> {
  try {
    console.log(`[Cloudinary] Downloading merged video from:`, secureUrl)
    
    const response = await fetch(secureUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log(`[Cloudinary] ✓ Video downloaded, size:`, buffer.length, 'bytes')
    
    return buffer
  } catch (error) {
    console.error(`[Cloudinary] ✗ Failed to download video:`, error)
    throw error
  }
}

/**
 * 清理临时文件
 */
export async function cleanupTempFiles(interviewId: string): Promise<void> {
  try {
    console.log(`[Cloudinary] Cleaning up temp files for interview ${interviewId}`)
    
    // 删除临时文件夹中的所有文件
    const result = await cloudinary.v2.api.delete_resources_by_prefix(
      `temp-interviews/${interviewId}/`,
      {
        resource_type: 'video'
      }
    )
    
    console.log(`[Cloudinary] ✓ Cleaned up temp files:`, result.deleted)
  } catch (error) {
    console.error(`[Cloudinary] ✗ Failed to cleanup temp files:`, error)
    // 不抛出错误，因为清理失败不应该影响主流程
  }
}

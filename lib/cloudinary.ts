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
    
    if (segmentIds.length < 2) {
      throw new Error('At least 2 video segments are required for merging')
    }
    
    // 使用第一个视频作为基础，然后依次拼接其他视频
    const baseVideoId = segmentIds[0]
    const additionalVideos = segmentIds.slice(1)
    
    console.log(`[Cloudinary] Base video: ${baseVideoId}`)
    console.log(`[Cloudinary] Additional videos to splice:`, additionalVideos)
    
    // 构建拼接变换字符串
    // 注意：在 overlay/underlay 中，带有文件夹的 public_id 需要将 '/' 替换为 ':'
    // Step 形如：l_video:folder:subfolder:public_id,fl_splice,fl_layer_apply
    const steps: string[] = additionalVideos.map((vid: string) => {
      const overlayId = vid.replace(/\//g, ':')
      return `l_video:${overlayId},fl_splice,fl_layer_apply`
    })
    const transformationString = steps.join('/')
    
    console.log(`[Cloudinary] Transformation string:`, transformationString)
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const timestamp = Date.now()
    
    // 构建合并URL：拼接 + H.264 Level 4.1转码
    const mergedUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${transformationString}/vc_h264:high:4.1,f_mp4/v${timestamp}/${baseVideoId}.mp4`
    
    console.log(`[Cloudinary] Merged URL with transcoding:`, mergedUrl)
    
    // 生成合并后的 public_id
    const mergedPublicId = `merged-interviews/${interviewId}/merged-video`
    
    // 返回结果（Cloudinary会异步处理合并和转码）
    return {
      public_id: mergedPublicId,
      secure_url: mergedUrl,
      format: 'mp4',
      bytes: 0, // Cloudinary异步处理，无法立即获取
      duration: 0 // Cloudinary异步处理，无法立即获取
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

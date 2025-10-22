/**
 * 客户端直接上传到Cloudinary的工具函数
 * 绕过Vercel API路由限制，避免413错误
 */

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
 * 客户端上传视频片段到Cloudinary
 */
export async function uploadVideoSegmentClient(
  videoBlob: Blob,
  interviewId: string,
  segmentIndex: number
): Promise<CloudinaryUploadResult> {
  try {
    console.log(`[Client Cloudinary] Uploading segment ${segmentIndex} for interview ${interviewId}`)
    
    // 创建FormData
    const formData = new FormData()
    formData.append('file', videoBlob, `segment-${segmentIndex}.mp4`)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
    formData.append('folder', `temp-interviews/${interviewId}`)
    formData.append('public_id', `segment-${segmentIndex}`)
    formData.append('resource_type', 'video')
    formData.append('quality', 'auto')
    formData.append('fetch_format', 'auto')
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        body: formData
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log(`[Client Cloudinary] ✓ Segment ${segmentIndex} uploaded:`, result.public_id)
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration
    }
  } catch (error) {
    console.error(`[Client Cloudinary] ✗ Failed to upload segment ${segmentIndex}:`, error)
    throw error
  }
}

/**
 * 客户端合并视频片段（通过服务端API）
 */
export async function mergeVideoSegmentsClient(
  segmentIds: string[],
  interviewId: string
): Promise<CloudinaryMergeResult> {
  try {
    console.log(`[Client Cloudinary] Merging ${segmentIds.length} segments for interview ${interviewId}`)
    console.log(`[Client Cloudinary] Segment IDs:`, segmentIds)
    
    // 调用服务端合并API（避免CORS问题）
    const response = await fetch('/api/merge-cloudinary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        segmentIds,
        interviewId
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Server merge failed: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`Merge failed: ${result.error}`)
    }
    
    console.log(`[Client Cloudinary] ✓ Video merged successfully:`, result.public_id)
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration
    }
  } catch (error) {
    console.error(`[Client Cloudinary] ✗ Failed to merge segments:`, error)
    throw error
  }
}

/**
 * 客户端清理临时文件
 */
export async function cleanupTempFilesClient(interviewId: string): Promise<void> {
  try {
    console.log(`[Client Cloudinary] Cleaning up temp files for interview ${interviewId}`)
    
    // 通过服务端API清理，避免CORS问题
    const response = await fetch('/api/cleanup-cloudinary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interviewId
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`[Client Cloudinary] Cleanup warning: ${response.status} ${errorText}`)
      return
    }
    
    const result = await response.json()
    if (result.success) {
      console.log(`[Client Cloudinary] ✓ Cleaned up temp files:`, result.deleted)
    } else {
      console.warn(`[Client Cloudinary] Cleanup warning:`, result.error)
    }
  } catch (error) {
    console.error(`[Client Cloudinary] ✗ Failed to cleanup temp files:`, error)
    // 不抛出错误，因为清理失败不应该影响主流程
  }
}

/**
 * 客户端直接保存面试数据到数据库（通过API路由）
 */
export async function saveInterviewClient(data: {
  interview_id: string
  student_email: string
  student_name?: string
  video_url: string
  subtitle_url?: string
  total_duration: number
  school_code?: string
  metadata?: any
}): Promise<{ success: boolean; error?: string; interview?: any }> {
  try {
    console.log(`[Client] Saving interview to database:`, data.interview_id)
    
    const response = await fetch('/api/save-interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Database save failed: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log(`[Client] ✓ Interview saved to database:`, result.interview?.id)
    
    return result
  } catch (error) {
    console.error(`[Client] ✗ Failed to save interview:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

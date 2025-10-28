import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const { segmentIds, interviewId } = await request.json()
    
    console.log(`[Server Cloudinary] Merging ${segmentIds.length} segments for interview ${interviewId}`)
    console.log(`[Server Cloudinary] Segment IDs:`, segmentIds)
    console.log(`[Server Cloudinary] API Key:`, process.env.CLOUDINARY_API_KEY)
    console.log(`[Server Cloudinary] API Secret:`, process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET')
    console.log(`[Server Cloudinary] Cloud Name:`, process.env.CLOUDINARY_CLOUD_NAME)
    
    if (segmentIds.length < 2) {
      throw new Error('At least 2 video segments are required for merging')
    }
    
    // 使用第一个视频作为基础，然后依次拼接其他视频
    const baseVideoId = segmentIds[0]
    const additionalVideos = segmentIds.slice(1)
    
    console.log(`[Server Cloudinary] Base video: ${baseVideoId}`)
    console.log(`[Server Cloudinary] Additional videos to splice:`, additionalVideos)
    
    // 构建拼接变换字符串
    // 注意：在 overlay/underlay 中，带有文件夹的 public_id 需要将 '/' 替换为 ':'
    // Step 形如：l_video:folder:subfolder:public_id,fl_splice,fl_layer_apply
    const steps: string[] = additionalVideos.map((vid: string) => {
      const overlayId = vid.replace(/\//g, ':')
      return `l_video:${overlayId},fl_splice,fl_layer_apply`
    })
    const transformationString = steps.join('/')
    
    console.log(`[Server Cloudinary] Transformation string:`, transformationString)
    
    // 使用 Cloudinary SDK 的 multi 方法进行合并，并应用转码参数
    console.log(`[Server Cloudinary] Using SDK multi method with transcoding...`)
    
    const result = await cloudinary.uploader.multi(
      segmentIds,
      {
        transformation: [
          {
            flags: 'splice',
            format: 'mp4',
            video_codec: 'h264',
            video_profile: 'high',
            video_level: '41'
          }
        ]
      }
    )
    
    console.log(`[Server Cloudinary] ✓ Video merged successfully:`, result.public_id)
    
    return NextResponse.json({
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format
    })
    
  } catch (error) {
    console.error(`[Server Cloudinary] ✗ Merge error:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

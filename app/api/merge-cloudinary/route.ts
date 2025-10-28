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
    
    // 手动构建 Cloudinary URL，避免 cloudinary.url() 添加 t_ 前缀
    // 在拼接完成后，追加转码参数，强制输出 H.264 High Profile Level 4.1，容器 mp4，30fps，AAC 128k
    // 参考文档：vc（video codec）https://cloudinary.com/documentation/transformation_reference#vc_codec_value
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const reencodeTransform = 'vc_h264:high:4.1,f_mp4/fps_30/ac_aac,ab_128k'
    const mergedUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${transformationString}/${reencodeTransform}/v${Date.now()}/${baseVideoId}.mp4`
    
    console.log(`[Server Cloudinary] ✓ Video merged successfully:`, mergedUrl)
    
    // 生成合并后的 public_id
    const mergedPublicId = `merged-interviews/${interviewId}/merged-video`
    
    return NextResponse.json({
      success: true,
      public_id: mergedPublicId,
      secure_url: mergedUrl,
      format: 'mp4'
    })
    
  } catch (error) {
    console.error(`[Server Cloudinary] ✗ Merge error:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

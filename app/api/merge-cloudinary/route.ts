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
    
    // 使用 fl_splice 拼接视频，并在最后应用 vc_h264:high:4.1 转码
    // 参考文档：https://cloudinary.com/documentation/video_manipulation_and_delivery#video_codec_settings
    console.log(`[Server Cloudinary] Building splice URL with vc_h264:high:4.1 transcoding...`)
    
    // 构建拼接变换字符串
    const spliceSteps: string[] = []
    for (const vid of additionalVideos) {
      const overlayId = vid.replace(/\//g, ':') // 文件夹路径需要替换为冒号
      spliceSteps.push(`l_video:${overlayId},fl_splice,fl_layer_apply`)
    }
    
    // 添加转码参数：vc_h264:high:4.1 和输出格式 mp4
    const finalTransformationString = spliceSteps.join('/') + '/vc_h264:high:4.1,f_mp4'
    
    console.log(`[Server Cloudinary] Final transformation string:`, finalTransformationString)
    
    // 构建最终 URL
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const mergedUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${finalTransformationString}/v${Date.now()}/${baseVideoId}.mp4`
    
    console.log(`[Server Cloudinary] ✓ Video merged URL:`, mergedUrl)
    
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

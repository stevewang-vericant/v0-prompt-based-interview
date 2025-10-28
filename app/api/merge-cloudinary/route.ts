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
    
    // 第一步：只做拼接，不转码
    console.log(`[Server Cloudinary] Step 1: Building splice-only URL (no transcoding)...`)
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    
    console.log(`[Server Cloudinary] Debug Info:`)
    console.log(`  - Base video ID: ${baseVideoId}`)
    console.log(`  - Additional videos count: ${additionalVideos.length}`)
    console.log(`  - Additional video IDs: ${JSON.stringify(additionalVideos)}`)
    console.log(`  - Transformation string: ${transformationString}`)
    
    const timestamp = Date.now()
    // 只拼接，不转码
    const splicedUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${transformationString}/v${timestamp}/${baseVideoId}.mp4`
    
    console.log(`[Server Cloudinary] Step 1 - Spliced URL:`, splicedUrl)
    
    // 第二步：对拼接结果应用转码
    console.log(`[Server Cloudinary] Step 2: Adding transcoding to spliced result...`)
    
    // 使用拼接后的视频作为输入，应用转码
    const transcodeUrl = `https://res.cloudinary.com/${cloudName}/video/upload/vc_h264:high:4.1,f_mp4/v${timestamp}/${baseVideoId}.mp4`
    
    console.log(`[Server Cloudinary] Step 2 - Transcode URL:`, transcodeUrl)
    console.log(`[Server Cloudinary] Note: Currently returning spliced URL only (no transcoding) for testing`)
    
    // 生成合并后的 public_id
    const mergedPublicId = `merged-interviews/${interviewId}/merged-video`
    
    // 先测试第一步：只返回拼接结果，不转码
    return NextResponse.json({
      success: true,
      public_id: mergedPublicId,
      secure_url: splicedUrl, // 返回拼接结果，不转码
      format: 'mp4',
      step: 'splice_only' // 标记这是第一步
    })
    
  } catch (error) {
    console.error(`[Server Cloudinary] ✗ Merge error:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

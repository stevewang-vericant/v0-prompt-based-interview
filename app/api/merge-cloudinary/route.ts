import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { segmentIds, interviewId } = await request.json()
    
    console.log(`[Server Cloudinary] Merging ${segmentIds.length} segments for interview ${interviewId}`)
    console.log(`[Server Cloudinary] Segment IDs:`, segmentIds)
    console.log(`[Server Cloudinary] API Key:`, process.env.CLOUDINARY_API_KEY)
    console.log(`[Server Cloudinary] API Secret:`, process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET')
    console.log(`[Server Cloudinary] Cloud Name:`, process.env.CLOUDINARY_CLOUD_NAME)
    
    // 生成 Cloudinary 签名
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    // 使用 public_ids 参数（Cloudinary 标准）
    const publicIds = segmentIds.join(',')
    
    // 包含需要签名的参数（按照 Cloudinary 实际期望的格式）
    const signatureParams = {
      public_id: 'merged-video',
      format: 'mp4',
      timestamp: timestamp
    }
    
    // 创建签名字符串（包含所有需要签名的参数）
    const sortedKeys = Object.keys(signatureParams).sort()
    console.log(`[Server Cloudinary] Sorted parameter keys:`, sortedKeys)
    
    const paramPairs = sortedKeys.map(key => `${key}=${signatureParams[key as keyof typeof signatureParams]}`)
    console.log(`[Server Cloudinary] Parameter pairs:`, paramPairs)
    
    const queryString = paramPairs.join('&')
    console.log(`[Server Cloudinary] Query string:`, queryString)
    
    const signatureString = queryString + process.env.CLOUDINARY_API_SECRET
    console.log(`[Server Cloudinary] Full signature string (with secret):`, signatureString)
    
    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex')
    
    console.log(`[Server Cloudinary] Generated signature:`, signature)
    console.log(`[Server Cloudinary] Expected by Cloudinary: format=mp4&public_id=merged-video&timestamp=${timestamp}`)
    
    // 构建请求体（使用表单格式）
    const formData = new URLSearchParams({
      command: 'concat',
      public_ids: publicIds,
      public_id: 'merged-video',
      format: 'mp4',
      timestamp: timestamp.toString(),
      signature: signature,
      api_key: process.env.CLOUDINARY_API_KEY!
    })
    
    console.log(`[Server Cloudinary] Request body:`, formData.toString())
    
    // 使用 Cloudinary Upload API 的 concat 命令
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Server Cloudinary] Merge failed: ${response.status} ${errorText}`)
      throw new Error(`Cloudinary merge failed: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log(`[Server Cloudinary] ✓ Video merged successfully:`, result.public_id)
    
    return NextResponse.json({
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration
    })
    
  } catch (error) {
    console.error(`[Server Cloudinary] ✗ Merge error:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

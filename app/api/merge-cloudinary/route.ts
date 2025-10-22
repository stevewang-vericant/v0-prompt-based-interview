import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { segmentIds, interviewId } = await request.json()
    
    console.log(`[Server Cloudinary] Merging ${segmentIds.length} segments for interview ${interviewId}`)
    console.log(`[Server Cloudinary] Segment IDs:`, segmentIds)
    
    // 生成 Cloudinary 签名
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    // 构建请求体（使用 urls 参数而不是 public_ids）
    const urls = segmentIds.map(id => `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${id}.mp4`)
    
    // 包含所有需要签名的参数（包括 urls）
    const signatureParams = {
      public_id: 'merged-video',
      format: 'mp4',
      transformation: 'splice',
      timestamp: timestamp,
      urls: urls.join(',')
    }
    
    // 创建签名字符串（包含所有需要签名的参数）
    const signatureString = Object.keys(signatureParams)
      .sort()
      .map(key => `${key}=${signatureParams[key as keyof typeof signatureParams]}`)
      .join('&') + process.env.CLOUDINARY_API_SECRET
    
    console.log(`[Server Cloudinary] Signature string:`, signatureString)
    
    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex')
    
    console.log(`[Server Cloudinary] Generated signature:`, signature)
    
    // 构建请求体（使用签名参数）
    const requestBody = {
      urls: urls,
      public_id: 'merged-video',
      format: 'mp4',
      transformation: 'splice',
      timestamp: timestamp,
      signature: signature,
      api_key: process.env.CLOUDINARY_API_KEY
    }
    
    console.log(`[Server Cloudinary] Request body:`, requestBody)
    
    // 使用 Cloudinary 的拼接功能
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/multi`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
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

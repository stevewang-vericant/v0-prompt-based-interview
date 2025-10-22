import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { segmentIds, interviewId } = await request.json()
    
    console.log(`[Server Cloudinary] Merging ${segmentIds.length} segments for interview ${interviewId}`)
    console.log(`[Server Cloudinary] Segment IDs:`, segmentIds)
    
    // 使用 Cloudinary 的拼接功能
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/multi`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`
        },
        body: JSON.stringify({
          public_ids: segmentIds,
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
        })
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

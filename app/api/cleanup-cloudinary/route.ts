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
    const { interviewId } = await request.json()
    
    if (!interviewId) {
      return NextResponse.json({
        success: false,
        error: 'Missing interviewId parameter'
      }, { status: 400 })
    }
    
    console.log(`[Server Cloudinary] Cleaning up temp files for interview ${interviewId}`)
    
    // 删除临时文件夹中的所有文件
    const result = await cloudinary.api.delete_resources_by_prefix(
      `temp-interviews/${interviewId}/`,
      {
        resource_type: 'video'
      }
    )
    
    console.log(`[Server Cloudinary] ✓ Cleaned up temp files:`, result.deleted)
    
    return NextResponse.json({
      success: true,
      deleted: result.deleted
    })
    
  } catch (error) {
    console.error(`[Server Cloudinary] ✗ Cleanup error:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

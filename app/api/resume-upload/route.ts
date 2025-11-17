import { NextRequest, NextResponse } from 'next/server'
import { getInterviewById } from '@/app/actions/interviews'

/**
 * 检查指定面试是否有未完成的上传
 * 这个 API 返回的信息用于前端判断是否可以重新上传
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const interviewId = searchParams.get('interviewId')

    if (!interviewId) {
      return NextResponse.json({
        success: false,
        error: 'Interview ID is required'
      }, { status: 400 })
    }

    // 检查数据库中是否有该面试记录
    const interviewResult = await getInterviewById(interviewId)
    
    if (!interviewResult.success || !interviewResult.interview) {
      return NextResponse.json({
        success: false,
        error: 'Interview not found'
      }, { status: 404 })
    }

    const interview = interviewResult.interview

    // 如果已经有 video_url，说明已经完成
    if (interview.video_url) {
      return NextResponse.json({
        success: true,
        canResume: false,
        message: 'Interview already completed'
      })
    }

    // 如果没有 video_url，说明可能上传中断
    // 注意：我们无法在服务器端直接访问 IndexedDB
    // 所以返回一个标记，让前端检查 IndexedDB
    return NextResponse.json({
      success: true,
      canResume: true,
      interview: {
        interview_id: interview.interview_id,
        student_email: interview.student_email,
        student_name: interview.student_name,
        school_code: interview.school_code,
        status: interview.status,
        created_at: interview.created_at
      },
      message: 'Interview may have pending uploads. Check IndexedDB on client side.'
    })

  } catch (error) {
    console.error('[Resume Upload] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { processTranscriptionJob } from '@/app/actions/transcription'

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json()
    
    if (!interviewId) {
      return NextResponse.json({
        success: false,
        error: 'Missing interviewId parameter'
      }, { status: 400 })
    }
    
    console.log('[Trigger] Manually triggering transcription for interview:', interviewId)
    
    // 获取interview的UUID
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    
    const { data: interview } = await supabase
      .from('interviews')
      .select('id')
      .eq('interview_id', interviewId)
      .single()
    
    if (!interview) {
      return NextResponse.json({
        success: false,
        error: 'Interview not found'
      }, { status: 404 })
    }
    
    // 手动触发转录处理，传递UUID
    const result = await processTranscriptionJob(interviewId, interview.id)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Transcription processing triggered successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('[Trigger] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

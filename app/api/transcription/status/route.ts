import { NextRequest, NextResponse } from 'next/server'
import { getTranscriptionStatus } from '@/app/actions/transcription'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')
    
    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: 'Missing interviewId parameter' },
        { status: 400 }
      )
    }
    
    console.log('[API] Getting transcription status for interview:', interviewId)
    
    const result = await getTranscriptionStatus(interviewId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        status: result.status,
        transcription: result.transcription,
        metadata: result.metadata
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('[API] Error getting transcription status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

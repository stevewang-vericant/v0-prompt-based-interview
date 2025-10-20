import { NextRequest, NextResponse } from 'next/server'
import { processTranscriptionJob } from '@/app/actions/transcription'

export async function POST(request: NextRequest) {
  try {
    const { jobId, videoUrl } = await request.json()
    
    if (!jobId || !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing jobId or videoUrl' },
        { status: 400 }
      )
    }
    
    console.log('[API] Processing transcription job:', jobId)
    
    const result = await processTranscriptionJob(jobId, videoUrl)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
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
    console.error('[API] Transcription processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

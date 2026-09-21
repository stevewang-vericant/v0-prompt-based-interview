import { NextRequest, NextResponse } from 'next/server'
import { getTranscriptionStatus } from '@/app/actions/transcription-simple'
import { authorizeSchoolResourceApi, requireUserApi } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserApi()
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')
    
    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: 'Missing interviewId parameter' },
        { status: 400 }
      )
    }

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: { school_id: true },
    })
    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }
    const ownership = authorizeSchoolResourceApi(auth.user, interview.school_id)
    if (!ownership.ok) return ownership.response
    
    console.log('[API] Getting transcription status for interview:', interviewId)
    
    const result = await getTranscriptionStatus(interviewId)
    
    if (result.success) {
        // 从 metadata 中提取错误信息（如果有）
        const errorMessage = (result.metadata as any)?.error
        
        return NextResponse.json({
          success: true,
          status: result.status,
          transcription: result.transcription,
          aiSummary: result.aiSummary,
          metadata: result.metadata,
          errorMessage: errorMessage
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

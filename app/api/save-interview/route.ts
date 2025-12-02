import { NextRequest, NextResponse } from 'next/server'
import { saveInterview } from '@/app/actions/interviews'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('[API] Saving interview to database:', data.interview_id)
    
    // Reuse the logic in app/actions/interviews.ts which is already migrated to Prisma
    const result = await saveInterview(data)
    
    if (!result.success) {
      console.error('[API] Error saving interview:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
    console.log('[API] Interview saved/updated successfully:', result.interview?.id)
    return NextResponse.json({
      success: true,
      interview: result.interview
    })
    
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

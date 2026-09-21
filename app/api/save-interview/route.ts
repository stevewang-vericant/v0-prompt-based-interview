import { NextRequest, NextResponse } from 'next/server'
import { saveInterview } from '@/app/actions/interviews'
import { requireInternalOrSuperAdminApi } from '@/lib/auth-guards'

/**
 * Ops / legacy endpoint. Student uploads persist via the `saveInterview`
 * server action (with payment/session checks). This HTTP route is locked down.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireInternalOrSuperAdminApi(request)
    if (!auth.ok) return auth.response

    let data: unknown
    try {
      data = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
    if (
      !data ||
      typeof data !== 'object' ||
      typeof (data as { interview_id?: unknown }).interview_id !== 'string' ||
      !(data as { interview_id: string }).interview_id.trim()
    ) {
      return NextResponse.json(
        { success: false, error: 'A valid interview_id is required' },
        { status: 400 }
      )
    }
    
    console.log(
      '[API] Saving interview to database:',
      (data as { interview_id: string }).interview_id
    )
    
    const result = await saveInterview(
      data as Parameters<typeof saveInterview>[0]
    )
    
    if (!result.success) {
      console.error('[API] Error saving interview:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: result.error === 'Interview not found.' ? 404 : 400 })
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

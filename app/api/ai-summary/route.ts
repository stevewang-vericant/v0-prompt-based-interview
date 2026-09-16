import { NextRequest, NextResponse } from 'next/server'
import { generateInterviewAiSummary } from '@/lib/ai-summary'
import { requireUserApi } from '@/lib/auth-guards'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUserApi()
    if (!auth.ok) return auth.response

    const { transcription } = await request.json()

    console.log('[AI Summary] Generating summary for transcription...')
    console.log('[AI Summary] Transcription length:', transcription?.length || 0, 'characters')

    const result = await generateInterviewAiSummary(transcription)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error.includes('required') ? 400 : 500 }
      )
    }

    console.log('[AI Summary] ✓ Summary generated successfully')
    console.log('[AI Summary] Summary length:', result.summary.length, 'characters')

    return NextResponse.json({
      success: true,
      summary: result.summary,
    })
  } catch (error) {
    console.error('[AI Summary] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary',
    }, { status: 500 })
  }
}

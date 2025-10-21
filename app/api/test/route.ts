import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[Test API] Test endpoint called')
    
    return NextResponse.json({
      success: true,
      message: 'Test API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasB2Config: !!process.env.B2_APPLICATION_KEY_ID,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    })
  } catch (error) {
    console.error('[Test API] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

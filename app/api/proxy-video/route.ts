import { NextRequest, NextResponse } from 'next/server'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    console.log('[Proxy] Fetching video from:', url)
    console.log('[Proxy] Request headers:', Object.fromEntries(request.headers.entries()))
    
    const range = request.headers.get('range')
    const headers: HeadersInit = {}
    
    if (range) {
      headers['Range'] = range
    }
    
    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(60000),
    })

    console.log('[Proxy] Response status:', response.status)
    console.log('[Proxy] Response headers:', Object.fromEntries(response.headers.entries()))

    const data = await response.arrayBuffer()
    console.log('[Proxy] Fetched video data, size:', data.byteLength, 'bytes')
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Content-Length': response.headers.get('content-length') || '',
        'Accept-Ranges': 'bytes',
        ...(response.headers.get('content-range') ? { 'Content-Range': response.headers.get('content-range')! } : {}),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[Proxy] Error details:', error)
    console.error('[Proxy] Error message:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { 
        error: 'Failed to fetch video', 
        details: error instanceof Error ? error.message : 'Unknown error',
        url: url 
      }, 
      { status: 500 }
    )
  }
}


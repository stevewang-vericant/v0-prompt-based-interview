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
    
    const range = request.headers.get('range') || undefined
    const response = await fetch(url, { headers: { ...(range ? { Range: range } : {}) } })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const data = await response.arrayBuffer()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'video/webm',
        'Content-Length': response.headers.get('content-length') || '',
        'Accept-Ranges': 'bytes',
        ...(response.headers.get('content-range') ? { 'Content-Range': response.headers.get('content-range')! } : {}),
        'Cache-Control': response.headers.get('cache-control') || 'no-store',
      },
    })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    return new NextResponse('Failed to fetch video', { status: 500 })
  }
}


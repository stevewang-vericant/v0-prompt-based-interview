import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    console.log('[Proxy] Fetching video from:', url)
    
    const response = await fetch(url, {
      headers: {
        'Range': request.headers.get('range') || '',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const data = await response.arrayBuffer()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Content-Length': response.headers.get('content-length') || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    return new NextResponse('Failed to fetch video', { status: 500 })
  }
}


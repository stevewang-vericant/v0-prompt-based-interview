import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    console.log('[Proxy] Fetching JSON from:', url)
    
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    return new NextResponse('Failed to fetch JSON', { status: 500 })
  }
}


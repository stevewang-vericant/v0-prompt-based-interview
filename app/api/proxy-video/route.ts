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

    // 对于 Range 请求，需要返回 206 Partial Content
    const isRangeRequest = !!range
    const status = isRangeRequest && response.status === 206 ? 206 : response.status

    // 如果是 Range 请求，直接流式传输，不要全部加载到内存
    if (isRangeRequest && response.status === 206) {
      const responseHeaders: HeadersInit = {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      }
      
      const contentRange = response.headers.get('content-range')
      const contentLength = response.headers.get('content-length')
      
      if (contentRange) {
        responseHeaders['Content-Range'] = contentRange
      }
      if (contentLength) {
        responseHeaders['Content-Length'] = contentLength
      }
      
      return new NextResponse(response.body, {
        status: 206,
        headers: responseHeaders,
      })
    }

    // 对于完整请求，加载全部数据
    const data = await response.arrayBuffer()
    console.log('[Proxy] Fetched video data, size:', data.byteLength, 'bytes')
    
    return new NextResponse(data, {
      status: status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Content-Length': response.headers.get('content-length') || data.byteLength.toString(),
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


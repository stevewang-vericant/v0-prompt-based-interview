import { NextRequest, NextResponse } from 'next/server'

export const dynamic = "force-dynamic"

function parseRange(rangeHeader: string | null, fallbackSize?: number) {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null
  }

  const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-')
  const start = parseInt(startStr, 10)
  const end = endStr ? parseInt(endStr, 10) : fallbackSize ? fallbackSize - 1 : undefined

  if (isNaN(start) || start < 0) {
    return null
  }

  return { start, end }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    console.log('[Proxy] Fetching video from:', url)
    console.log('[Proxy] Request headers:', Object.fromEntries(request.headers.entries()))
    
    const rangeHeader = request.headers.get('range')
    const headers: HeadersInit = {}
    
    if (rangeHeader) {
      headers['Range'] = rangeHeader
    }
    
    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(60000),
    })

    console.log('[Proxy] Response status:', response.status)
    console.log('[Proxy] Response headers:', Object.fromEntries(response.headers.entries()))

    const isRangeRequest = !!rangeHeader
    const upstreamContentLength = response.headers.get('content-length')
    const upstreamContentRange = response.headers.get('content-range')
    const parsedRange = parseRange(rangeHeader, upstreamContentLength ? parseInt(upstreamContentLength, 10) : undefined)

    // 如果是 Range 请求，直接流式传输，并确保响应状态为 206
    if (isRangeRequest) {
      const responseHeaders: HeadersInit = {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      }

      if (upstreamContentRange) {
        responseHeaders['Content-Range'] = upstreamContentRange
      } else if (parsedRange) {
        const totalSize = upstreamContentLength ? parseInt(upstreamContentLength, 10) : parsedRange.end !== undefined ? parsedRange.end + 1 : undefined
        if (totalSize !== undefined) {
          const end = parsedRange.end !== undefined ? parsedRange.end : totalSize - 1
          responseHeaders['Content-Range'] = `bytes ${parsedRange.start}-${end}/${totalSize}`
          responseHeaders['Content-Length'] = (end - parsedRange.start + 1).toString()
        } else if (upstreamContentLength) {
          responseHeaders['Content-Length'] = upstreamContentLength
        }
      } else if (upstreamContentLength) {
        responseHeaders['Content-Length'] = upstreamContentLength
      }

      if (!responseHeaders['Content-Length'] && upstreamContentLength) {
        responseHeaders['Content-Length'] = upstreamContentLength
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
      status: response.status,
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


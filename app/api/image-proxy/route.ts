// app/api/image-proxy/route.ts — Server-side image proxy to bypass CORS for canvas
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  // Only allow TMDB image URLs
  if (!url.startsWith('https://image.tmdb.org/')) {
    return NextResponse.json({ error: 'only TMDB images allowed' }, { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Plotter/1.0' },
      next: { revalidate: 86400 }, // cache 24h
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: res.status })
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[image-proxy]', err)
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}

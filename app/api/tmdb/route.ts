import { type NextRequest, NextResponse } from 'next/server'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const BEARER_TOKEN = process.env.TMDB_BEARER_TOKEN

const headers = {
  Authorization: `Bearer ${BEARER_TOKEN}`,
  accept: 'application/json',
}

async function tmdb(endpoint: string, init: RequestInit = {}): Promise<any> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> || {}) },
    })
    if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`)
    return res.json()
  } catch (err) {
    console.error('[TMDB Route]', err)
    return { results: [] }
  }
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const action  = sp.get('action')
  const query   = sp.get('query')
  const type    = sp.get('type') || 'all'
  const genreId = sp.get('genreId')
  const id      = sp.get('id')
  const cache1h = { next: { revalidate: 3600 } }

  try {
    switch (action) {

      /* ─── Search ─────────────────────────────────────────────── */
      case 'search': {
        if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })
        const ep = type === 'movie' ? '/search/movie'
                 : type === 'tv'    ? '/search/tv'
                                    : '/search/multi'
        const data = await tmdb(`${ep}?query=${encodeURIComponent(query)}&language=es-ES&page=1`)
        const results = (data.results || []).filter((i: any) => i.media_type !== 'person')
        return NextResponse.json(results)
      }

      /* ─── Trending ───────────────────────────────────────────── */
      case 'trending': {
        const data = await tmdb(`/trending/${type}/day?language=es-ES`, cache1h)
        return NextResponse.json(data.results?.slice(0, 22) || [])
      }

      /* ─── Upcoming Movies ────────────────────────────────────── */
      case 'upcoming': {
        const data = await tmdb(`/movie/upcoming?language=es-ES&page=1`, cache1h)
        return NextResponse.json(data.results || [])
      }

      /* ─── Now Playing Movies ─────────────────────────────────── */
      case 'now-playing': {
        const data = await tmdb('/movie/now_playing?language=es-ES&page=1', cache1h)
        return NextResponse.json(data.results || [])
      }



      /* ─── Now Playing (Hero movie) ───────────────────────────── */
      case 'top-rated-theaters': {
        const data = await tmdb('/movie/now_playing?language=en-US&page=1', cache1h)
        const sorted = (data.results || [])
          .filter((m: any) => m.original_language !== 'zh')
          .sort((a: any, b: any) => b.vote_average - a.vote_average)
        return NextResponse.json(sorted[0] || null)
      }

      /* ─── On Air (Hero TV) ───────────────────────────────────── */
      case 'top-rated-air': {
        const data = await tmdb('/tv/on_the_air?language=en-US&page=1', cache1h)
        const sorted = (data.results || [])
          .filter((s: any) => s.original_language !== 'zh')
          .sort((a: any, b: any) => b.vote_average - a.vote_average)
        return NextResponse.json(sorted[0] || null)
      }

      /* ─── Movie Details ──────────────────────────────────────── */
      case 'movie-details': {
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
        const data = await tmdb(`/movie/${id}?language=es-ES`, cache1h)
        return NextResponse.json(data)
      }

      /* ─── TV Details ─────────────────────────────────────────── */
      case 'tv-details': {
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
        const data = await tmdb(`/tv/${id}?language=es-ES&append_to_response=external_ids`, cache1h)
        return NextResponse.json(data)
      }

      /* ─── Watch Providers ────────────────────────────────────── */
      case 'watch-providers': {
        if (!id || !type) return NextResponse.json({ error: 'id and type required' }, { status: 400 })
        const data = await tmdb(`/${type}/${id}/watch/providers`, cache1h)
        return NextResponse.json(data.results?.AR || data.results?.US || null)
      }

      /* ─── Videos / Trailers ──────────────────────────────────── */
      case 'videos': {
        if (!id || !type) return NextResponse.json({ error: 'id and type required' }, { status: 400 })
        const data = await tmdb(`/${type}/${id}/videos?language=en-US`, cache1h)
        const trailers = (data.results || [])
          .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
          .sort((a: any, b: any) => (a.official === b.official ? 0 : a.official ? -1 : 1))
        return NextResponse.json(trailers)
      }

      /* ─── Discover by genre ──────────────────────────────────── */
      case 'discover-movies': {
        if (!genreId) return NextResponse.json({ error: 'genreId required' }, { status: 400 })
        const data = await tmdb(
          `/discover/movie?with_genres=${genreId}&language=es-ES&page=1&sort_by=popularity.desc`,
          cache1h,
        )
        return NextResponse.json(data.results?.slice(0, 22) || [])
      }

      case 'discover-tv': {
        if (!genreId) return NextResponse.json({ error: 'genreId required' }, { status: 400 })
        const data = await tmdb(
          `/discover/tv?with_genres=${genreId}&language=es-ES&page=1&sort_by=popularity.desc`,
          cache1h,
        )
        return NextResponse.json(data.results?.slice(0, 22) || [])
      }

      default:
        return NextResponse.json({ error: 'invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('[TMDB Route] unhandled error', err)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}

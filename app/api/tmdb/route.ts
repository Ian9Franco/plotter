import { type NextRequest, NextResponse } from 'next/server'
import {
  fetchNowPlayingMovies,
  fetchNowPlayingTop,
  fetchOnAirTop,
  fetchOnAirTV,
  fetchTrendingMovies,
  fetchTrendingTV,
  fetchUpcomingMovies,
  pickTrailers,
  pickWatchRegion,
} from '@/lib/tmdb/catalog'
import { consumeSearchBudget } from '@/lib/tmdb/search-limit'
import { fetchMovieTitle, fetchTVTitle } from '@/lib/tmdb/title'
import { TmdbUpstreamError, tmdbFetch } from '@/lib/tmdb/upstream'
import type { Movie, Paged, TVShow, Video } from '@/lib/tmdb/types'

const CATALOG_CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400'
const SEARCH_CACHE = 'private, max-age=30'
const NO_STORE = 'no-store'

function json(data: unknown, status: number, cacheControl: string) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': cacheControl },
  })
}

function pageOf(sp: URLSearchParams): number {
  const raw = Number(sp.get('page') || '1')
  if (!Number.isFinite(raw) || raw < 1) return 1
  return Math.floor(raw)
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const action = sp.get('action')
  const query = sp.get('query')
  const type = sp.get('type') || 'all'
  const genreId = sp.get('genreId')
  const id = sp.get('id')
  const page = pageOf(sp)

  try {
    switch (action) {
      case 'search': {
        if (!query?.trim()) {
          return json({ error: 'query required' }, 400, NO_STORE)
        }
        const budget = consumeSearchBudget(clientIp(request))
        if (!budget.ok) {
          return NextResponse.json(
            { error: 'too many searches' },
            {
              status: 429,
              headers: {
                'Cache-Control': NO_STORE,
                'Retry-After': String(budget.retryAfter),
              },
            },
          )
        }
        const ep = type === 'movie' ? '/search/movie'
          : type === 'tv' ? '/search/tv'
            : '/search/multi'
        const data = await tmdbFetch<{ results?: Array<{ media_type?: string }> }>(
          `${ep}?query=${encodeURIComponent(query)}&language=es-ES&page=1`,
          60,
        )
        const results = (data.results ?? []).filter((item) => item.media_type !== 'person')
        return json(results, 200, SEARCH_CACHE)
      }

      case 'trending': {
        if (type === 'tv') return json(await fetchTrendingTV(page), 200, CATALOG_CACHE)
        if (type === 'all') {
          const data = await tmdbFetch<Paged<Movie | TVShow>>(`/trending/all/day?language=es-ES&page=${page}`)
          return json(
            {
              results: data.results ?? [],
              page: data.page ?? page,
              total_pages: data.total_pages ?? 1,
            },
            200,
            CATALOG_CACHE,
          )
        }
        return json(await fetchTrendingMovies(page), 200, CATALOG_CACHE)
      }

      case 'upcoming':
        return json(await fetchUpcomingMovies(page), 200, CATALOG_CACHE)

      case 'now-playing':
        return json(await fetchNowPlayingMovies(page), 200, CATALOG_CACHE)

      case 'top-rated-theaters':
        return json(await fetchNowPlayingTop(), 200, CATALOG_CACHE)

      case 'top-rated-air':
        return json(await fetchOnAirTop(), 200, CATALOG_CACHE)

      case 'on-air':
        return json(await fetchOnAirTV(page), 200, CATALOG_CACHE)

      case 'movie-details': {
        if (!id) return json({ error: 'id required' }, 400, NO_STORE)
        return json(await fetchMovieTitle(Number(id)), 200, CATALOG_CACHE)
      }

      case 'tv-details': {
        if (!id) return json({ error: 'id required' }, 400, NO_STORE)
        return json(await fetchTVTitle(Number(id)), 200, CATALOG_CACHE)
      }

      case 'watch-providers': {
        if (!id || !type) return json({ error: 'id and type required' }, 400, NO_STORE)
        const data = await tmdbFetch<{ results?: Record<string, import('@/lib/tmdb/types').WatchProviders> }>(
          `/${type}/${id}/watch/providers`,
        )
        return json(pickWatchRegion(data).providers, 200, CATALOG_CACHE)
      }

      case 'videos': {
        if (!id || !type) return json({ error: 'id and type required' }, 400, NO_STORE)
        const data = await tmdbFetch<{ results?: Video[] }>(`/${type}/${id}/videos?language=en-US`)
        return json(pickTrailers(data.results), 200, CATALOG_CACHE)
      }

      case 'discover-movies': {
        if (!genreId) return json({ error: 'genreId required' }, 400, NO_STORE)
        const data = await tmdbFetch<{ results?: Movie[] }>(
          `/discover/movie?with_genres=${encodeURIComponent(genreId)}&language=es-ES&page=${page}&sort_by=popularity.desc`,
        )
        return json(data.results?.slice(0, 22) ?? [], 200, CATALOG_CACHE)
      }

      case 'discover-tv': {
        if (!genreId) return json({ error: 'genreId required' }, 400, NO_STORE)
        const data = await tmdbFetch<{ results?: TVShow[] }>(
          `/discover/tv?with_genres=${encodeURIComponent(genreId)}&language=es-ES&page=${page}&sort_by=popularity.desc`,
        )
        return json(data.results?.slice(0, 22) ?? [], 200, CATALOG_CACHE)
      }

      default:
        return json({ error: 'invalid action' }, 400, NO_STORE)
    }
  } catch (err) {
    console.error('[TMDB Route]', err)
    const message = err instanceof TmdbUpstreamError ? 'tmdb upstream failed' : 'internal server error'
    return json({ error: message }, 502, NO_STORE)
  }
}

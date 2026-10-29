import { tmdbFetch } from './upstream'
import type { Movie, Paged, TVShow, Video, WatchProviders, WatchRegion } from './types'

interface TmdbPage<T> {
  results?: T[]
  page?: number
  total_pages?: number
}

export function todayISO(now = new Date()): string {
  return now.toISOString().split('T')[0]
}

export function isReleasedBy(date: string | undefined | null, today: string): boolean {
  return !date || date <= today
}

export function isUpcomingBy(date: string | undefined | null, today: string): boolean {
  return Boolean(date && date > today)
}

function asPaged<T>(data: TmdbPage<T>): Paged<T> {
  return {
    results: data.results ?? [],
    page: data.page ?? 1,
    total_pages: data.total_pages ?? 1,
  }
}

function pageQuery(page: number): string {
  const safe = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1
  return `page=${safe}`
}

export async function fetchTrendingMovies(page = 1): Promise<Paged<Movie>> {
  const data = await tmdbFetch<TmdbPage<Movie>>(`/trending/movie/day?language=es-ES&${pageQuery(page)}`)
  return asPaged(data)
}

export async function fetchTrendingTV(page = 1): Promise<Paged<TVShow>> {
  const data = await tmdbFetch<TmdbPage<TVShow>>(`/trending/tv/day?language=es-ES&${pageQuery(page)}`)
  return asPaged(data)
}

export async function fetchUpcomingMovies(page = 1): Promise<Paged<Movie>> {
  const data = await tmdbFetch<TmdbPage<Movie>>(`/movie/upcoming?language=es-ES&${pageQuery(page)}`)
  return asPaged(data)
}

export async function fetchNowPlayingMovies(page = 1): Promise<Paged<Movie>> {
  const data = await tmdbFetch<TmdbPage<Movie>>(`/movie/now_playing?language=es-ES&${pageQuery(page)}`)
  return asPaged(data)
}

export async function fetchOnAirTV(page = 1): Promise<Paged<TVShow>> {
  const data = await tmdbFetch<TmdbPage<TVShow>>(`/tv/on_the_air?language=es-ES&${pageQuery(page)}`)
  return asPaged(data)
}

export async function fetchNowPlayingTop(): Promise<Movie | null> {
  const data = await tmdbFetch<TmdbPage<Movie>>('/movie/now_playing?language=en-US&page=1')
  const sorted = (data.results ?? [])
    .filter((movie) => movie.original_language !== 'zh')
    .sort((a, b) => b.vote_average - a.vote_average)
  return sorted[0] ?? null
}

export async function fetchOnAirTop(): Promise<TVShow | null> {
  const data = await tmdbFetch<TmdbPage<TVShow>>('/tv/on_the_air?language=en-US&page=1')
  const sorted = (data.results ?? [])
    .filter((show) => show.original_language !== 'zh')
    .sort((a, b) => b.vote_average - a.vote_average)
  return sorted[0] ?? null
}

export function pickTrailers(results: Video[] | undefined | null): Video[] {
  return (results ?? [])
    .filter((video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser'))
    .sort((a, b) => (a.official === b.official ? 0 : a.official ? -1 : 1))
}

export function pickWatchRegion(payload: { results?: Record<string, WatchProviders> } | null | undefined): {
  providers: WatchProviders | null
  region: WatchRegion | null
} {
  const results = payload?.results
  if (results?.AR) return { providers: { ...results.AR, region: 'AR' }, region: 'AR' }
  if (results?.US) return { providers: { ...results.US, region: 'US' }, region: 'US' }
  return { providers: null, region: null }
}

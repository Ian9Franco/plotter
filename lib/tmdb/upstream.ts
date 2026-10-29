// Server-side TMDb fetch. The Data Cache is keyed by URL, so Server Components
// and the proxy share one hour of responses without the browser calling /api/tmdb.

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export class TmdbUpstreamError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'TmdbUpstreamError'
    this.status = status
  }
}

export async function tmdbFetch<T>(endpoint: string, revalidate = 3600): Promise<T> {
  const token = process.env.TMDB_BEARER_TOKEN
  if (!token) {
    throw new TmdbUpstreamError('TMDB_BEARER_TOKEN is not set', 500)
  }

  const res = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    next: { revalidate },
  })

  if (!res.ok) {
    throw new TmdbUpstreamError(`TMDB ${res.status}: ${endpoint}`, res.status)
  }

  return res.json() as Promise<T>
}

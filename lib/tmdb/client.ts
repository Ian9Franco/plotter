// Browser calls to the TMDb proxy. Caching lives on the HTTP response
// (Cache-Control), not on `next: { revalidate }`, which the browser ignores.

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export class TMDBError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TMDBError'
    this.status = status
  }
}

export async function apiFetch<T>(
  action: string,
  params: Record<string, string | number> = {},
  init: { signal?: AbortSignal } = {},
): Promise<T> {
  const searchParams = new URLSearchParams({
    action,
    ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
  })

  const res = await fetch(`/api/tmdb?${searchParams.toString()}`, { signal: init.signal })

  if (!res.ok) {
    throw new TMDBError(`API error: ${res.status}`, res.status)
  }

  return res.json() as Promise<T>
}

export function getPosterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'): string {
  if (!path) return '/placeholder-poster.svg'
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780'): string {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function getLogoUrl(path: string | null, size: 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'original' = 'w92'): string {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

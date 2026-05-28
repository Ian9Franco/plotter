// lib/tmdb/client.ts — Base fetch wrapper for client-side API calls

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export class TMDBError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'TMDBError'
  }
}

type FetchOptions = {
  revalidate?: number
}

export async function apiFetch<T>(
  action: string,
  params: Record<string, string | number> = {},
  options: FetchOptions = {}
): Promise<T> {
  const searchParams = new URLSearchParams({ action, ...Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  )})

  const res = await fetch(`/api/tmdb?${searchParams.toString()}`, {
    next: options.revalidate !== undefined
      ? { revalidate: options.revalidate }
      : undefined,
  })

  if (!res.ok) {
    throw new TMDBError(`API error: ${res.status}`, res.status)
  }

  return res.json() as Promise<T>
}

// Image URL helpers
export function getPosterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
  if (!path) return '/placeholder-poster.svg'
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function getLogoUrl(path: string | null, size: 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'original' = 'w92'): string {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

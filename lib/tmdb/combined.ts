// lib/tmdb/combined.ts — Cross-type queries (search all, trending all)
import { apiFetch } from './client'
import { getNowPlayingTop } from './movies'
import { getOnAirTop }      from './tv'
import type { MediaItem } from './types'

export async function searchAll(query: string): Promise<MediaItem[]> {
  return apiFetch<MediaItem[]>('search', { query, type: 'all' })
}

export async function getTrendingAll(): Promise<MediaItem[]> {
  return apiFetch<MediaItem[]>('trending', { type: 'all' }, { revalidate: 3600 })
}

// Re-export for convenience when importing from combined
export { getNowPlayingTop, getOnAirTop }

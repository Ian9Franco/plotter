// lib/tmdb/combined.ts — Cross-type queries (search all, trending all)
import { apiFetch } from './client'
import { getNowPlayingTop } from './movies'
import { getOnAirTop }      from './tv'
import type { MediaItem, Paged } from './types'

export async function searchAllPage(query: string, page = 1, signal?: AbortSignal): Promise<Paged<MediaItem>> {
  return apiFetch<Paged<MediaItem>>('search', { query, type: 'all', page }, { signal })
}

export async function searchAll(query: string): Promise<MediaItem[]> {
  const page = await searchAllPage(query, 1)
  return page.results
}

export async function getTrendingAll(): Promise<MediaItem[]> {
  const page = await apiFetch<{ results?: MediaItem[] }>('trending', { type: 'all', page: 1 })
  return page.results ?? []
}

// Re-export for convenience when importing from combined
export { getNowPlayingTop, getOnAirTop }

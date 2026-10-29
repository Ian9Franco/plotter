import { apiFetch } from './client'
import type { Paged, TitleBundle, TVDetails, TVShow, Video, WatchProviders } from './types'

export async function getTrendingTVPage(page = 1): Promise<Paged<TVShow>> {
  return apiFetch<Paged<TVShow>>('trending', { type: 'tv', page })
}

export async function getTrendingTV(): Promise<TVShow[]> {
  const page = await getTrendingTVPage(1)
  return page.results
}

export async function getOnAirTop(): Promise<TVShow | null> {
  return apiFetch<TVShow | null>('top-rated-air')
}

export async function getOnAirTVPage(page = 1): Promise<Paged<TVShow>> {
  return apiFetch<Paged<TVShow>>('on-air', { page })
}

export async function getOnAirTV(): Promise<TVShow[]> {
  const page = await getOnAirTVPage(1)
  return page.results
}

export async function discoverTVPage(genreId: number, page = 1, signal?: AbortSignal): Promise<Paged<TVShow>> {
  return apiFetch<Paged<TVShow>>('discover-tv', { genreId, page }, { signal })
}

export async function discoverTV(genreId: number): Promise<TVShow[]> {
  const page = await discoverTVPage(genreId, 1)
  return page.results
}

export async function searchTVPage(query: string, page = 1, signal?: AbortSignal): Promise<Paged<TVShow>> {
  return apiFetch<Paged<TVShow>>('search', { query, type: 'tv', page }, { signal })
}

export async function searchTV(query: string): Promise<TVShow[]> {
  const page = await searchTVPage(query, 1)
  return page.results
}

export async function getTVTitle(id: number): Promise<TitleBundle<TVDetails>> {
  return apiFetch<TitleBundle<TVDetails>>('tv-details', { id })
}

export async function getTVWatchProviders(id: number): Promise<WatchProviders | null> {
  return apiFetch<WatchProviders | null>('watch-providers', { id, type: 'tv' })
}

export async function getTVVideos(id: number): Promise<Video[]> {
  return apiFetch<Video[]>('videos', { id, type: 'tv' })
}

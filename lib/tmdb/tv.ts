// lib/tmdb/tv.ts — All TV show-related API calls

import { apiFetch } from './client'
import type { TVShow, TVDetails, WatchProviders, Video } from './types'

export async function getTrendingTV(): Promise<TVShow[]> {
  return apiFetch<TVShow[]>('trending', { type: 'tv' }, { revalidate: 3600 })
}

export async function getOnAirTop(): Promise<TVShow | null> {
  return apiFetch<TVShow | null>('top-rated-air', {}, { revalidate: 3600 })
}

export async function getOnAirTV(): Promise<TVShow[]> {
  return apiFetch<TVShow[]>('on-air', {}, { revalidate: 3600 })
}

export async function discoverTV(genreId: number): Promise<TVShow[]> {
  return apiFetch<TVShow[]>('discover-tv', { genreId }, { revalidate: 3600 })
}

export async function searchTV(query: string): Promise<TVShow[]> {
  return apiFetch<TVShow[]>('search', { query, type: 'tv' })
}

export async function getTVDetails(id: number): Promise<TVDetails> {
  return apiFetch<TVDetails>('tv-details', { id })
}

export async function getTVWatchProviders(id: number): Promise<WatchProviders | null> {
  return apiFetch<WatchProviders | null>('watch-providers', { id, type: 'tv' }, { revalidate: 3600 })
}

export async function getTVVideos(id: number): Promise<Video[]> {
  return apiFetch<Video[]>('videos', { id, type: 'tv' }, { revalidate: 3600 })
}

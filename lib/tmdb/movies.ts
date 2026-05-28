// lib/tmdb/movies.ts — All movie-related API calls

import { apiFetch } from './client'
import type { Movie, MovieDetails, WatchProviders, Video } from './types'

export async function getTrendingMovies(): Promise<Movie[]> {
  return apiFetch<Movie[]>('trending', { type: 'movie' }, { revalidate: 3600 })
}

export async function getNowPlayingTop(): Promise<Movie | null> {
  return apiFetch<Movie | null>('top-rated-theaters', {}, { revalidate: 3600 })
}

export async function searchMovies(query: string): Promise<Movie[]> {
  return apiFetch<Movie[]>('search', { query, type: 'movie' })
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  return apiFetch<MovieDetails>('movie-details', { id })
}

export async function getMovieWatchProviders(id: number): Promise<WatchProviders | null> {
  return apiFetch<WatchProviders | null>('watch-providers', { id, type: 'movie' }, { revalidate: 3600 })
}

export async function getMovieVideos(id: number): Promise<Video[]> {
  return apiFetch<Video[]>('videos', { id, type: 'movie' }, { revalidate: 3600 })
}

import { apiFetch } from './client'
import type { Movie, MovieDetails, Paged, TitleBundle, Video, WatchProviders } from './types'

export async function getTrendingMoviesPage(page = 1): Promise<Paged<Movie>> {
  return apiFetch<Paged<Movie>>('trending', { type: 'movie', page })
}

export async function getTrendingMovies(): Promise<Movie[]> {
  const page = await getTrendingMoviesPage(1)
  return page.results
}

export async function getNowPlayingTop(): Promise<Movie | null> {
  return apiFetch<Movie | null>('top-rated-theaters')
}

export async function getUpcomingMoviesPage(page = 1): Promise<Paged<Movie>> {
  return apiFetch<Paged<Movie>>('upcoming', { page })
}

export async function getUpcomingMovies(): Promise<Movie[]> {
  const page = await getUpcomingMoviesPage(1)
  return page.results
}

export async function getNowPlayingMoviesPage(page = 1): Promise<Paged<Movie>> {
  return apiFetch<Paged<Movie>>('now-playing', { page })
}

export async function getNowPlayingMovies(): Promise<Movie[]> {
  const page = await getNowPlayingMoviesPage(1)
  return page.results
}

export async function searchMovies(query: string): Promise<Movie[]> {
  return apiFetch<Movie[]>('search', { query, type: 'movie' })
}

export async function getMovieTitle(id: number): Promise<TitleBundle<MovieDetails>> {
  return apiFetch<TitleBundle<MovieDetails>>('movie-details', { id })
}

export async function getMovieWatchProviders(id: number): Promise<WatchProviders | null> {
  return apiFetch<WatchProviders | null>('watch-providers', { id, type: 'movie' })
}

export async function getMovieVideos(id: number): Promise<Video[]> {
  return apiFetch<Video[]>('videos', { id, type: 'movie' })
}

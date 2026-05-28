// lib/tmdb/types.ts — Single source of truth for all TMDB types

export interface Movie {
  id: number
  media_type?: 'movie'
  title: string
  original_title: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  vote_count: number
  release_date: string
  overview: string
  genre_ids: number[]
  original_language: string
  popularity: number
  adult: boolean
}

export interface TVShow {
  id: number
  media_type?: 'tv'
  name: string
  original_name: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  vote_count: number
  first_air_date: string
  overview: string
  genre_ids: number[]
  original_language: string
  popularity: number
}

export type MediaItem = Movie | TVShow

export interface Genre {
  id: number
  name: string
}

export interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
}

export interface WatchProviders {
  flatrate?: WatchProvider[]
  rent?: WatchProvider[]
  buy?: WatchProvider[]
  free?: WatchProvider[]
  ads?: WatchProvider[]
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
  published_at: string
}

export interface MovieDetails extends Movie {
  runtime: number | null
  genres: Genre[]
  tagline: string
  budget: number
  revenue: number
  status: string
  production_countries: { iso_3166_1: string; name: string }[]
  spoken_languages: { iso_639_1: string; name: string }[]
}

export interface TVDetails extends TVShow {
  episode_run_time: number[]
  genres: Genre[]
  tagline: string
  status: string
  number_of_seasons: number
  number_of_episodes: number
  networks: { id: number; name: string; logo_path: string | null }[]
  created_by: { id: number; name: string }[]
}

export type AnyDetails = MovieDetails | TVDetails

// Type guards
export function isMovie(item: MediaItem): item is Movie {
  return 'title' in item
}

export function isTVShow(item: MediaItem): item is TVShow {
  return 'name' in item
}

// Helpers
export function getTitle(item: MediaItem): string {
  return isMovie(item) ? item.title : item.name
}

export function getReleaseDate(item: MediaItem): string {
  return isMovie(item) ? item.release_date : item.first_air_date
}

export function getReleaseYear(item: MediaItem): string {
  const date = getReleaseDate(item)
  if (!date) return 'N/A'
  return new Date(date).getFullYear().toString()
}

export function getMediaType(item: MediaItem): 'movie' | 'tv' {
  return isMovie(item) ? 'movie' : 'tv'
}

// Genre maps
export const MOVIE_GENRES: Record<number, string> = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familia',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia ficción',
  53: 'Thriller',
  10752: 'Bélica',
  37: 'Western',
}

export const TV_GENRES: Record<number, string> = {
  10759: 'Acción y aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familia',
  10762: 'Infantil',
  9648: 'Misterio',
  10763: 'Noticias',
  10764: 'Reality',
  10765: 'Sci-Fi y Fantasía',
  10766: 'Telenovela',
  10767: 'Talk show',
  10768: 'Guerra y política',
  37: 'Western',
}

// lib/tmdb.ts
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

// Interfaces
export interface Movie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date: string
  overview: string
  genre_ids: number[]
  original_language: string
}

export interface TVShow {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  first_air_date: string
  overview: string
  genre_ids: number[]
  original_language: string
}

export interface Genre {
  id: number
  name: string
}

export interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string
}

export interface WatchProviders {
  flatrate?: WatchProvider[]
  rent?: WatchProvider[]
  buy?: WatchProvider[]
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

// -------------------
// Safe Client-Side Helpers
// -------------------
export function getImageUrl(path: string | null, size = "w500"): string {
  if (!path) return "/placeholder.svg?height=750&width=500"
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}

export async function getTopRatedInTheaters(): Promise<Movie | null> {
  try {
    const response = await fetch("/api/tmdb?action=top-rated-theaters")
    if (!response.ok) throw new Error("Failed to fetch")
    return await response.json()
  } catch (error) {
    console.error("Error fetching top rated in theaters:", error)
    return null
  }
}

export async function getTopRatedOnAir(): Promise<TVShow | null> {
  try {
    const response = await fetch("/api/tmdb?action=top-rated-air")
    if (!response.ok) throw new Error("Failed to fetch")
    return await response.json()
  } catch (error) {
    console.error("Error fetching top rated on air:", error)
    return null
  }
}

export async function getTrending(mediaType: "all" | "movie" | "tv" = "all"): Promise<(Movie | TVShow)[]> {
  try {
    const response = await fetch(`/api/tmdb?action=trending&type=${mediaType}`)
    if (!response.ok) throw new Error("Failed to fetch")
    return await response.json()
  } catch (error) {
    console.error("Error fetching trending:", error)
    return []
  }
}

export async function searchMulti(query: string, type: "all" | "movie" | "tv" = "all"): Promise<(Movie | TVShow)[]> {
  try {
    const response = await fetch(`/api/tmdb?action=search&query=${encodeURIComponent(query)}&type=${type}`)
    if (!response.ok) throw new Error("Failed to fetch")
    return await response.json()
  } catch (error) {
    console.error("Error searching:", error)
    return []
  }
}

export async function discoverMoviesByGenre(genreId: number): Promise<Movie[]> {
  try {
    const response = await fetch(`/api/tmdb?action=discover-movies&genreId=${genreId}`)
    if (!response.ok) throw new Error("Failed to fetch")
    return await response.json()
  } catch (error) {
    console.error("Error discovering movies by genre:", error)
    return []
  }
}

export async function discoverTVByGenre(genreId: number): Promise<TVShow[]> {
  try {
    const response = await fetch(`/api/tmdb?action=discover-tv&genreId=${genreId}`)
    if (!response.ok) throw new Error("Failed to fetch")
    return await response.json()
  } catch (error) {
    console.error("Error discovering TV by genre:", error)
    return []
  }
}

export async function getWatchProviders(id: number, type: "movie" | "tv"): Promise<WatchProviders | null> {
  try {
    const response = await fetch(`/api/tmdb?action=watch-providers&id=${id}&type=${type}`)
    if (!response.ok) throw new Error("Failed to fetch")
    return await response.json()
  } catch (error) {
    console.error("Error fetching watch providers:", error)
    return null
  }
}

export async function getVideos(id: number, type: "movie" | "tv"): Promise<Video[]> {
  try {
    const response = await fetch(`/api/tmdb?action=videos&id=${id}&type=${type}`)
    if (!response.ok) throw new Error("Failed to fetch")
    return await response.json()
  } catch (error) {
    console.error("Error fetching videos:", error)
    return []
  }
}

// -------------------
// Genres (Safe Constants)
// -------------------
export const MOVIE_GENRES: { [key: string]: number } = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "science-fiction": 878,
  thriller: 53,
  war: 10752,
  western: 37,
}

export const TV_GENRES: { [key: string]: number } = {
  "action-adventure": 10759,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  kids: 10762,
  mystery: 9648,
  news: 10763,
  reality: 10764,
  "sci-fi-fantasy": 10765,
  soap: 10766,
  talk: 10767,
  "war-politics": 10768,
  western: 37,
}

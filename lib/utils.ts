import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ------------------- Tailwind helpers -------------------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ------------------- TMDB types -------------------
export interface Movie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  overview: string
  release_date: string
  original_language: string
}

export interface TVShow {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  overview: string
  first_air_date: string
  original_language?: string
}

// ------------------- TMDB helpers -------------------
const BASE_URL = "https://api.themoviedb.org/3"
const HEADERS = {
  Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
  accept: "application/json",
  "Content-Type": "application/json",
}

// Allowed regions for movies: US + main EU + LATAM
const MOVIE_REGIONS = ["US", "GB", "FR", "DE", "ES", "MX", "BR", "AR"]

/**
 * Helper: fetch TMDB endpoint and parse JSON
 */
async function fetchTMDB(endpoint: string) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: HEADERS,
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      console.error(`TMDB API error for endpoint ${endpoint}:`, res.status, res.statusText)
      return null
    }
    return res.json()
  } catch (err) {
    console.error("TMDB fetch error:", err)
    return null
  }
}

/**
 * Filter out Chinese movies or TV shows
 */
function filterChinese<T extends { original_language: string }>(items: T[]): T[] {
  // Keep all properties, just filter out items with zh
  return items.filter((item) => item.original_language !== "zh")
}

// ------------------- Movies -------------------

export async function getPopularMovies(count = 12): Promise<Movie[]> {
  const movies: Movie[] = []

  for (const region of MOVIE_REGIONS) {
    const data = await fetchTMDB(`/movie/popular?language=en-US&page=1&region=${region}`)
    if (!data) continue
    movies.push(...data.results)
  }

  // Remove Chinese movies
  const filtered = filterChinese(movies)

  // Remove duplicates by ID
  const uniqueMovies = Array.from(new Map(filtered.map((m) => [m.id, m])).values())
  return uniqueMovies.slice(0, count)
}

export async function getTopRatedMovies(count = 2): Promise<Movie[]> {
  const movies: Movie[] = []

  for (const region of MOVIE_REGIONS) {
    const data = await fetchTMDB(`/movie/top_rated?language=en-US&page=1&region=${region}`)
    if (!data) continue
    movies.push(...data.results)
  }

  const filtered = filterChinese(movies)
  const uniqueMovies = Array.from(new Map(filtered.map((m) => [m.id, m])).values())
  return uniqueMovies.slice(0, count)
}

export async function getNowPlayingMovies(count = 1): Promise<Movie[]> {
  const movies: Movie[] = []

  for (const region of MOVIE_REGIONS) {
    const data = await fetchTMDB(`/movie/now_playing?language=en-US&page=1&region=${region}`)
    if (!data) continue
    movies.push(...data.results)
  }

  const filtered = filterChinese(movies)
  const uniqueMovies = Array.from(new Map(filtered.map((m) => [m.id, m])).values())
  return uniqueMovies.slice(0, count)
}

// ------------------- TV Shows -------------------

export async function getTopRatedTVShows(count = 2): Promise<TVShow[]> {
  const data = await fetchTMDB(`/tv/top_rated?language=en-US&page=1`)
  if (!data) return []

  // Type the results as TVShow[]
  const results: TVShow[] = data.results as TVShow[]

  // Filter Chinese content
  const filtered: TVShow[] = results.filter((show) => show.original_language !== "zh")
  return filtered.slice(0, count)
}

export async function getOnAirTVShows(count = 1): Promise<TVShow[]> {
  const data = await fetchTMDB(`/tv/on_the_air?language=en-US&page=1`)
  if (!data) return []

  const results: TVShow[] = data.results as TVShow[]
  const filtered: TVShow[] = results.filter((show) => show.original_language !== "zh")
  return filtered.slice(0, count)
}

// ------------------- Image Helper -------------------

export function getImageUrl(path: string | null, size: "w300" | "w500" | "w780" | "w1280" | "original" = "w500") {
  if (!path) return "/placeholder.svg"
  return `https://image.tmdb.org/t/p/${size}${path}`
}

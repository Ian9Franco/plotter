"use client"

import { useState, useEffect } from "react"
import MovieCard from "@/components/MovieCard"
import { getTrending, searchMulti, discoverMoviesByGenre, discoverTVByGenre, MOVIE_GENRES, TV_GENRES } from "@/lib/tmdb"

interface Movie {
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

interface TVShow {
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

interface DynamicContentProps {
  searchQuery: string
  searchType: "all" | "movie" | "tv"
  category: string
  contentType: "all" | "movie" | "tv"
}

export default function DynamicContent({ searchQuery, searchType, category, contentType }: DynamicContentProps) {
  const [content, setContent] = useState<(Movie | TVShow)[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)
      setError(null)

      try {
        let results: (Movie | TVShow)[] = []

        if (searchQuery) {
          // Search mode
          results = await searchMulti(searchQuery, searchType)
        } else {
          // Category mode
          switch (category) {
            case "trending":
              results = await getTrending(contentType)
              break
            case "action":
              if (contentType === "tv") {
                results = await discoverTVByGenre(TV_GENRES["action-adventure"])
              } else {
                results = await discoverMoviesByGenre(MOVIE_GENRES.action)
              }
              break
            case "romance":
              if (contentType === "tv") {
                results = await discoverTVByGenre(TV_GENRES.romance || 10749)
              } else {
                results = await discoverMoviesByGenre(MOVIE_GENRES.romance || 10749)
              }
              break
            case "horror":
              if (contentType === "tv") {
                results = await discoverTVByGenre(TV_GENRES.horror || 27)
              } else {
                results = await discoverMoviesByGenre(MOVIE_GENRES.horror || 27)
              }
              break
            case "animation":
              if (contentType === "tv") {
                results = await discoverTVByGenre(TV_GENRES.animation || 16)
              } else {
                results = await discoverMoviesByGenre(MOVIE_GENRES.animation || 16)
              }
              break
            case "comedy":
              if (contentType === "tv") {
                results = await discoverTVByGenre(TV_GENRES.comedy)
              } else {
                results = await discoverMoviesByGenre(MOVIE_GENRES.comedy)
              }
              break
            case "drama":
              if (contentType === "tv") {
                results = await discoverTVByGenre(TV_GENRES.drama)
              } else {
                results = await discoverMoviesByGenre(MOVIE_GENRES.drama)
              }
              break
            default:
              results = await getTrending(contentType)
          }
        }

        setContent(results)
      } catch (err) {
        console.error("Error loading content:", err)
        setError("Error al cargar el contenido")
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [searchQuery, searchType, category, contentType])

  const getTitle = () => {
    if (searchQuery) {
      return `Resultados para "${searchQuery}"`
    }

    const categoryTitles: { [key: string]: string } = {
      trending: "Tendencias",
      popular: "Populares",
      "top-rated": "Mejor Valoradas",
      action: "Acción",
      romance: "Romance",
      horror: "Terror",
      animation: "Animación",
      comedy: "Comedia",
      drama: "Drama",
    }

    return categoryTitles[category] || "Contenido"
  }

  if (loading) {
    return (
      <div className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8">{getTitle()}</h2>

        {content.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontró contenido</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {content.slice(0, 22).map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

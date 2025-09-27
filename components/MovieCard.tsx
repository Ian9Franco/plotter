import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb"

interface MovieCardProps {
  movie: {
    id: number
    title?: string // For movies
    name?: string // For TV shows
    poster_path: string | null
    vote_average: number
    release_date?: string // For movies
    first_air_date?: string // For TV shows
    media_type?: string // For multi search results
  }
}

export default function MovieCard({ movie }: MovieCardProps) {
  const title = movie.title || movie.name || "Unknown Title"
  const releaseDate = movie.release_date || movie.first_air_date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "N/A"
  const rating = Math.round(movie.vote_average * 10) / 10

  const isMovie = movie.title || movie.media_type === "movie"
  const linkPath = isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`

  const imageUrl = movie.poster_path ? getImageUrl(movie.poster_path, "w500") : "/movie-poster-placeholder.png"

  return (
    <Link href={linkPath} className="block group">
      <div className="glass-card rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 fade-in">
        {/* Póster de la película/serie */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/movie-poster-placeholder.png"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white text-sm font-medium">{rating}</span>
            </div>
          </div>

          {movie.media_type && (
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-primary/90 backdrop-blur-sm rounded-full px-2 py-1">
                <span className="text-black text-xs font-bold uppercase">
                  {movie.media_type === "movie" ? "Movie" : "TV"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-white mb-2 line-clamp-2 text-sm md:text-base leading-tight group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>

          {/* Year and rating */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">{year}</span>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-gray-300 text-sm font-medium">{rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

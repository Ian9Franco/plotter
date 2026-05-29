"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const [isActive, setIsActive] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const title = movie.title || movie.name || "Unknown Title"
  const releaseDate = movie.release_date || movie.first_air_date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "N/A"
  const rating = Math.round(movie.vote_average * 10) / 10

  const isMovie = movie.title || movie.media_type === "movie"
  const linkPath = isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`

  const imageUrl = movie.poster_path ? getImageUrl(movie.poster_path, "w500") : "/movie-poster-placeholder.png"

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsActive(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches
    if (isTouch) {
      if (!isActive) {
        e.preventDefault()
        e.stopPropagation()
        setIsActive(true)
      } else {
        router.push(linkPath)
      }
    } else {
      router.push(linkPath)
    }
  }

  return (
    <article
      ref={cardRef}
      className="block group cursor-pointer"
      onClick={handleClick}
    >
      <div className={`glass-card rounded-3xl overflow-hidden transition-all duration-500 fade-in ${
        isActive
          ? "shadow-2xl shadow-primary/10 scale-105 -translate-y-2"
          : "hover:shadow-2xl hover:shadow-primary/10 hover:scale-105 hover:-translate-y-2"
      }`}>
        {/* Póster de la película/serie */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            fill
            className={`object-cover transition-transform duration-700 ${
              isActive ? "scale-110" : "group-hover:scale-110"
            }`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/movie-poster-placeholder.png"
            }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`} />

          {/* Calificación arriba a la derecha */}
          <div className={`absolute top-4 right-4 transition-all duration-300 transform ${
            isActive ? "opacity-100 translate-y-0" : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          }`}>
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <svg className="w-4 h-4 text-[#F5C518]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white text-sm font-medium">{rating}</span>
            </div>
          </div>

          {movie.media_type && (
            <div className={`absolute top-4 left-4 transition-all duration-300 ${
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              <div className="bg-primary/90 backdrop-blur-sm rounded-full px-2 py-1">
                <span className="text-black text-xs font-bold uppercase">
                  {movie.media_type === "movie" ? "Movie" : "TV"}
                </span>
              </div>
            </div>
          )}

          {/* Información en la parte inferior */}
          <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col justify-end items-center text-center">
            {/* Title (Always visible, Centered) */}
            <h3 className={`font-bold text-[15px] leading-tight font-['Outfit'] drop-shadow-md transition-all duration-500 w-full ${
              isActive ? "text-primary -translate-y-1" : "text-white group-hover:text-primary group-hover:-translate-y-1"
            }`}>
              {title}
            </h3>

            {/* Metadata (Year & Rating) - Shows on Hover/Active only */}
            <div className={`flex flex-col items-center justify-center transition-all duration-300 w-full ${
              isActive 
                ? "opacity-100 mt-2 visible h-auto" 
                : "h-0 opacity-0 overflow-hidden group-hover:h-auto group-hover:opacity-100 group-hover:mt-2 group-hover:visible"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-gray-300 text-[12px] font-semibold bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">{year}</span>
                <div className="flex items-center bg-[#F5C518] rounded px-1.5 py-0.5 shadow-sm">
                  <span className="text-black font-black text-[9px] tracking-tight">IMDb</span>
                  <span className="text-black font-bold text-[11px] ml-1">{rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

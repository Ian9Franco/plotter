'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear, isMovie } from '@/lib/tmdb/types'
import type { MediaItem } from '@/lib/tmdb/types'

interface MediaCardProps {
  item: MediaItem
  priority?: boolean
}

export default function MediaCard({ item, priority = false }: MediaCardProps) {
  const router    = useRouter()
  const [isActive, setIsActive] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef   = useRef<HTMLDivElement>(null)

  const title     = getTitle(item)
  const year      = getReleaseYear(item)
  const posterUrl = getPosterUrl(item.poster_path, 'w342')
  const type      = isMovie(item) ? 'movie' : 'tv'
  const rating    = item.vote_average.toFixed(1)

  // Extra OMDb Ratings State
  const [omdbRatings, setOmdbRatings] = useState<{
    rottenTomatoes: string | null
    imdb: string | null
    metacritic: string | null
  } | null>(null)
  const [omdbLoading, setOmdbLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Reset active state when clicking/tapping outside
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

  // On-demand fetch of OMDb ratings on hover or click
  useEffect(() => {
    if ((isHovered || isActive) && !hasFetched && !omdbLoading) {
      setOmdbLoading(true)
      setHasFetched(true)
      fetch(`/api/omdb?tmdbId=${item.id}&type=${type}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setOmdbRatings(data)
          }
        })
        .catch(console.error)
        .finally(() => setOmdbLoading(false))
    }
  }, [isHovered, isActive, item.id, type, hasFetched, omdbLoading])

  const handleClick = (e: React.MouseEvent) => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches
    if (isTouch) {
      if (!isActive) {
        e.preventDefault()
        e.stopPropagation()
        setIsActive(true)
      } else {
        router.push(`/${type}/${item.id}`)
      }
    } else {
      router.push(`/${type}/${item.id}`)
    }
  }

  return (
    <article
      ref={cardRef as any}
      id={`media-card-${type}-${item.id}`}
      className="group cursor-pointer relative transition-all duration-500 hover:-translate-y-2 focus:outline-none"
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && router.push(`/${type}/${item.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Ver ${title}`}
    >
      <div className={`aspect-[2/3] relative overflow-hidden bg-[#0A0F1A] rounded-[20px] border transition-all duration-500 shadow-[0_8px_24px_rgba(0,0,0,0.5)] ${
        isActive 
          ? "border-primary/40 shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(244,98,42,0.15)] scale-[1.03]" 
          : "border-white/[0.04] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(244,98,42,0.15)] group-hover:border-white/[0.08]"
      }`}>
        {/* Poster image */}
        <img
          src={posterUrl}
          alt={`Póster de ${title}`}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            isActive ? "scale-110" : "group-hover:scale-110"
          }`}
          loading={priority ? 'eager' : 'lazy'}
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-poster.svg' }}
        />

        {/* Permanent dark gradient for immersive text readability */}
        <div className={`absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t pointer-events-none transition-opacity duration-500 ${
          isActive 
            ? "from-[#020408] via-[#020408]/95 to-transparent" 
            : "from-[#04080F] via-[#04080F]/80 to-transparent group-hover:from-[#020408] group-hover:via-[#020408]/90"
        }`} />

        {/* Premium Content (Bottom pinned, Centered) */}
        <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col justify-end items-center text-center">
          
          {/* Title (Always visible, Centered) */}
          <h3 className={`font-bold text-[15px] leading-tight font-['Outfit'] drop-shadow-md transition-all duration-500 ${
            isActive ? "text-primary -translate-y-0.5" : "text-white group-hover:text-primary group-hover:-translate-y-0.5"
          }`}>
            {title}
          </h3>

          {/* Metadata (Rating & Year) - Shows on Hover/Active only */}
          <div className={`flex flex-col items-center justify-center transition-all duration-300 w-full ${
            isActive 
              ? "opacity-100 mt-2 visible" 
              : "h-0 opacity-0 overflow-hidden group-hover:h-12 group-hover:opacity-100 group-hover:mt-2 group-hover:visible"
          }`}>
            <span className="text-[var(--plotter-muted)] text-[11px] font-semibold mb-1">{year}</span>
            
            <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
              {/* IMDb Rating */}
              <div className="flex items-center bg-[#F5C518] rounded px-1 py-[2px] shadow-sm select-none">
                <span className="text-black font-black text-[8px] tracking-tight">IMDb</span>
                <span className="text-black font-bold text-[9px] ml-1">
                  {omdbRatings?.imdb ? omdbRatings.imdb.replace('/10', '') : rating}
                </span>
              </div>

              {/* Rotten Tomatoes */}
              {(omdbRatings?.rottenTomatoes || omdbLoading) && (
                <div className="flex items-center bg-red-600/90 text-white rounded px-1 py-[2px] shadow-sm select-none gap-0.5">
                  <span className="text-[9px]">🍅</span>
                  <span className="font-bold text-[9px]">{omdbLoading ? '...' : omdbRatings?.rottenTomatoes}</span>
                </div>
              )}

              {/* Metacritic */}
              {(omdbRatings?.metacritic || omdbLoading) && (
                <div className="flex items-center bg-[#66CC33] text-white rounded px-1 py-[2px] shadow-sm select-none gap-0.5">
                  <span className="font-extrabold text-[8px]">M</span>
                  <span className="font-bold text-[9px]">{omdbLoading ? '...' : omdbRatings?.metacritic}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </article>
  )
}

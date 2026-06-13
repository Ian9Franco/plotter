'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear, isMovie } from '@/lib/tmdb/types'
import type { MediaItem } from '@/lib/tmdb/types'
import { Ticket, Calendar, Tv } from 'lucide-react'

import { useLanguage } from '@/hooks/useLanguage'

interface MediaCardProps {
  item: MediaItem
  priority?: boolean
  variant?: 'default' | 'wide'
}

export default function MediaCard({ item, priority = false, variant = 'default' }: MediaCardProps) {
  const router    = useRouter()
  const { useOriginal } = useLanguage()
  const [isActive, setIsActive] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef   = useRef<HTMLDivElement>(null)

  const title     = getTitle(item, useOriginal)
  const year      = getReleaseYear(item)
  const posterUrl = getPosterUrl(item.poster_path, 'w342')
  const backdropUrl = getBackdropUrl(item.backdrop_path, 'w780')
  const type      = isMovie(item) && !('first_air_date' in item) ? 'movie' : 'tv'
  const rating    = item.vote_average.toFixed(1)

  const isMovieItem = isMovie(item) && !('first_air_date' in item)
  const releaseDateStr = isMovieItem ? (item as any).release_date : (item as any).first_air_date
  
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const isInTheaters = (() => {
    if (!isMovieItem || !releaseDateStr) return false
    const releaseDate = new Date(releaseDateStr)
    const fortyFiveDaysAgo = new Date()
    fortyFiveDaysAgo.setDate(today.getDate() - 45)
    return releaseDate <= today && releaseDate >= fortyFiveDaysAgo
  })()

  const isOnAir = (() => {
    if (isMovieItem || !releaseDateStr) return false
    const releaseDate = new Date(releaseDateStr)
    return releaseDate <= today
  })()

  const isUpcoming = (() => {
    if (!releaseDateStr) return false
    return releaseDateStr > todayStr
  })()

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
      <div
        className={`${variant === 'wide' ? 'aspect-[16/9]' : 'aspect-[2/3]'} relative overflow-hidden bg-[#0A0F1A] rounded-[20px] transition-all duration-500`}
        style={{
          boxShadow: isActive
            ? (isMovieItem && isInTheaters)
              ? '0 20px 40px rgba(239,68,68,0.3), 0 0 30px rgba(239,68,68,0.15), var(--nm-raised)'
              : (!isMovieItem && isOnAir)
                ? '0 20px 40px rgba(16,185,129,0.3), 0 0 30px rgba(16,185,129,0.15), var(--nm-raised)'
                : isUpcoming
                  ? '0 20px 40px rgba(245,158,11,0.3), 0 0 30px rgba(245,158,11,0.15), var(--nm-raised)'
                  : 'var(--nm-glow-orange)'
            : isHovered
              ? 'var(--nm-glow-orange)'
              : 'var(--nm-raised)',
          transform: isActive ? 'scale(1.03)' : isHovered ? 'translateY(-6px)' : undefined,
        }}
      >
        {/* Floating status badges */}
        {isMovieItem && isInTheaters && (
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
            <div className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-orange-600 text-white font-['Outfit'] font-black text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(220,38,38,0.4)] border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <Ticket className="w-2.5 h-2.5 animate-bounce" />
              <span>En Cines</span>
            </div>
          </div>
        )}

        {!isMovieItem && isOnAir && (
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
            <div className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-['Outfit'] font-black text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.4)] border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <Tv className="w-2.5 h-2.5 animate-bounce" />
              <span>En Emisión</span>
            </div>
          </div>
        )}

        {isUpcoming && (
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-['Outfit'] font-black text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(245,158,11,0.3)] border border-black/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <Calendar className="w-2.5 h-2.5" />
              <span>Próximamente</span>
            </div>
          </div>
        )}

        {/* Poster image */}
        <img
          src={variant === 'wide' && backdropUrl ? backdropUrl : posterUrl}
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
            isActive ? "text-white -translate-y-0.5" : "text-white group-hover:text-white group-hover:-translate-y-0.5"
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

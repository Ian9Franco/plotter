'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear, isMovie } from '@/lib/tmdb/types'
import type { MediaItem } from '@/lib/tmdb/types'
import { Star, Calendar, Film, Tv, ChevronRight } from 'lucide-react'

interface HeroBannerProps {
  items: MediaItem[]
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [fading, setFading]   = useState(false)

  const goTo = useCallback((index: number) => {
    if (index === current) return
    setFading(true)
    setTimeout(() => {
      setCurrent(index)
      setFading(false)
    }, 300)
  }, [current])

  // Autoplay every 6s
  useEffect(() => {
    if (items.length < 2) return
    const id = setInterval(() => {
      goTo((current + 1) % items.length)
    }, 6000)
    return () => clearInterval(id)
  }, [current, items.length, goTo])

  if (!items.length) return <HeroBannerSkeleton />

  const item       = items[current]
  const title      = getTitle(item)
  const year       = getReleaseYear(item)
  const type       = isMovie(item) ? 'movie' : 'tv'
  const backdropUrl= getBackdropUrl(item.backdrop_path, 'w1280')
  const overview   = item.overview?.slice(0, 140)

  const handleCTA = () => router.push(`/${type}/${item.id}`)

  return (
    <section className="relative h-[55vh] min-h-[340px] max-h-[480px] overflow-hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
        )}
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 hero-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Content */}
      <div className={`absolute inset-0 flex flex-col justify-end p-5 pb-6 transition-all duration-500 ${fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        {/* Type badge */}
        <div className="mb-2">
          <span className={`badge ${type === 'movie' ? 'badge-movie' : 'badge-tv'}`}>
            {type === 'movie'
              ? <><Film className="w-2.5 h-2.5" />Película</>
              : <><Tv className="w-2.5 h-2.5" />Serie</>
            }
          </span>
        </div>

        {/* Title */}
        <h1 className="font-['Outfit'] font-black text-2xl sm:text-3xl text-white leading-tight mb-1 max-w-xs">
          {title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-300 mb-2">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-[var(--plotter-orange)] fill-current" />
            {item.vote_average.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {year}
          </span>
        </div>

        {/* Overview */}
        {overview && (
          <p className="text-gray-400 text-xs leading-relaxed mb-3 max-w-xs line-clamp-2">
            {overview}…
          </p>
        )}

        {/* CTA */}
        <button
          id={`hero-cta-${type}-${item.id}`}
          onClick={handleCTA}
          className="btn-primary self-start text-sm py-2.5 px-5"
        >
          Ver detalles
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-5 h-1.5 bg-[var(--plotter-orange)]'
                  : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Ir al ítem ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function HeroBannerSkeleton() {
  return (
    <div className="h-[55vh] min-h-[340px] max-h-[480px] skeleton" />
  )
}

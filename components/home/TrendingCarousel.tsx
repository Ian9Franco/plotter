'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MediaItem } from '@/lib/tmdb/types'
import { getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear, isMovie } from '@/lib/tmdb/types'
import { useRouter } from 'next/navigation'
import HeroBanner from './HeroBanner'

interface TrendingCarouselProps {
  movies: MediaItem[]
  tv: MediaItem[]
}

export default function TrendingCarousel({ movies, tv }: TrendingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()

  // Interleave movies and TV shows: movie, tv, movie, tv...
  const items = (() => {
    const mixed: MediaItem[] = []
    const maxLen = Math.max(movies.length, tv.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < movies.length) {
        mixed.push({ ...movies[i], media_type: 'movie' } as any)
      }
      if (i < tv.length) {
        mixed.push({ ...tv[i], media_type: 'tv' } as any)
      }
    }
    return mixed.slice(0, 10)
  })()

  const activeItem = items[activeIndex]
  const activeType = activeItem ? (activeItem.media_type || (isMovie(activeItem) ? 'movie' : 'tv')) : 'movie'

  const handleNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % items.length)
  }, [items.length])

  // Auto-play interval
  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => {
      handleNext()
    }, 10000)
    return () => clearInterval(timer)
  }, [items.length, handleNext])

  const handleCardClick = (item: MediaItem) => {
    const type = item.media_type || (isMovie(item) ? 'movie' : 'tv')
    router.push(`/${type}/${item.id}`)
  }

  const [omdbScores, setOmdbScores] = useState<Record<number, string | null>>({})

  useEffect(() => {
    if (!activeItem) return
    
    // Solo consultar si no tenemos el dato cacheado localmente
    if (omdbScores[activeItem.id] !== undefined) return

    fetch(`/api/omdb?tmdbId=${activeItem.id}&type=${activeType}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.rottenTomatoes) {
          setOmdbScores(prev => ({ ...prev, [activeItem.id]: data.rottenTomatoes }))
        } else {
          setOmdbScores(prev => ({ ...prev, [activeItem.id]: 'N/A' }))
        }
      })
      .catch(() => {
        setOmdbScores(prev => ({ ...prev, [activeItem.id]: 'N/A' }))
      })
  }, [activeItem?.id, activeType])

  if (items.length === 0) return null

  return (
    <>
      <HeroBanner item={activeItem} />
      <div className="w-full overflow-visible py-6 -mt-[45vh] relative z-20 pointer-events-none max-w-[1400px] mx-auto">
        {/* 3D Carousel Container */}
        <div className="relative h-[480px] w-full flex justify-center items-center pointer-events-auto" style={{ perspective: '1200px' }}>
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((item, index) => {
              const offset = index - activeIndex
              const isCenter = offset === 0

              // Hide cards that are too far away to improve performance
              if (Math.abs(offset) > 2) return null

              const scale = 1 - Math.abs(offset) * 0.15
              const rotateY = offset * -35 // Turn inwards
              const x = offset * 220 // Spread horizontally
              const zIndex = 10 - Math.abs(offset)
              const opacity = 1 - Math.abs(offset) * 0.4
              const itemType = item.media_type || (isMovie(item) ? 'movie' : 'tv')

              return (
                <motion.div
                  key={`mixed-${itemType}-${item.id}`}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_e, info) => {
                    if (info.offset.x < -30 && activeIndex < items.length - 1) setActiveIndex(prev => prev + 1)
                    else if (info.offset.x > 30 && activeIndex > 0) setActiveIndex(prev => prev - 1)
                  }}
                  onTap={() => {
                    if (isCenter) {
                      handleCardClick(item)
                    } else {
                      setActiveIndex(index)
                    }
                  }}
                  className="absolute w-[280px] h-[420px] rounded-2xl overflow-hidden bg-[var(--plotter-card)] shadow-[var(--nm-raised-lg)] cursor-grab active:cursor-grabbing border border-white/5"
                  style={{ zIndex }}
                  initial={{ opacity: 0, scale: 0.8, x: offset > 0 ? 300 : -300 }}
                  animate={{
                    opacity,
                    scale,
                    x,
                    rotateY,
                    filter: isCenter ? 'brightness(1)' : 'brightness(0.6)'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <div className="w-full h-full relative">
                    <img
                      src={getPosterUrl(item.poster_path, 'w500')}
                      alt={getTitle(item)}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                    {/* Permanent dark gradient for text legibility */}
                    <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
                    
                    {/* Premium info on center card */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isCenter ? 1 : 0 }}
                      transition={{ delay: 0.1 }}
                      className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col justify-end pointer-events-none"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {omdbScores[item.id] && omdbScores[item.id] !== 'N/A' && (
                          <div className="flex items-center bg-red-600/90 text-white rounded px-1.5 py-[2px] shadow-sm gap-0.5">
                            <span className="text-[10px]">🍅</span>
                            <span className="text-white font-bold text-[11px]">{omdbScores[item.id]}</span>
                          </div>
                        )}
                        <span className="text-white/80 text-[12px] font-semibold">{getReleaseYear(item)}</span>
                      </div>
                      <h3 className="text-white font-bold text-[20px] leading-tight line-clamp-2 font-['Outfit'] drop-shadow-lg">
                        {getTitle(item)}
                      </h3>
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        
        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {items.map((_, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === activeIndex ? 'w-8 bg-[var(--plotter-orange)] shadow-[0_0_10px_rgba(244,98,42,0.5)]' : 'w-2 bg-[var(--plotter-subtle)] hover:bg-[var(--plotter-muted)]'}`}
            />
          ))}
        </div>
      </div> 
    </>
  )
}

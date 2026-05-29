'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import type { MediaItem } from '@/lib/tmdb/types'
import { getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear } from '@/lib/tmdb/types'
import { useRouter, useSearchParams } from 'next/navigation'
import HeroBanner from './HeroBanner'

interface TrendingCarouselProps {
  movies: MediaItem[]
  tv: MediaItem[]
}

export default function TrendingCarousel({ movies, tv }: TrendingCarouselProps) {
  const searchParams = useSearchParams()
  const activeSection = searchParams.get('tab') === 'tv' ? 'tv' : 'movies'
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()

  const currentItems = activeSection === 'movies' ? movies : tv
  const items = currentItems.slice(0, 10)
  const activeItem = items[activeIndex]

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

  useEffect(() => {
    setActiveIndex(0)
  }, [activeSection])

  const handleCardClick = (id: number) => {
    router.push(`/${activeSection === 'movies' ? 'movie' : 'tv'}/${id}`)
  }

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

            return (
              <motion.div
                key={`${activeSection}-${item.id}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_e, info) => {
                  if (info.offset.x < -30 && activeIndex < items.length - 1) setActiveIndex(prev => prev + 1)
                  else if (info.offset.x > 30 && activeIndex > 0) setActiveIndex(prev => prev - 1)
                }}
                onTap={() => {
                  if (isCenter) {
                    handleCardClick(item.id)
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
                      <div className="flex items-center bg-[#F5C518] rounded px-1.5 py-[2px] shadow-sm">
                        <span className="text-black font-black text-[10px] tracking-tight">IMDb</span>
                        <span className="text-black font-bold text-[11px] ml-1">{item.vote_average.toFixed(1)}</span>
                      </div>
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPosterUrl } from '@/lib/tmdb/client'
import { getTitle } from '@/lib/tmdb/types'
import { useLanguage } from '@/hooks/useLanguage'
import { useRouter } from 'next/navigation'
import type { MediaItem } from '@/lib/tmdb/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import HeroBanner from '../home/HeroBanner'

interface NeoBrutalistCarouselProps {
  items: MediaItem[]
}

const BRUTAL_COLORS = [
  'bg-[#4C79FF]', // Blueberry
  'bg-[#CAB1FF]', // Lavender
  'bg-[#A8FF99]', // Lime
  'bg-[#FFD23F]', // Yellow
  'bg-[#FF5C5C]', // Red
  'bg-[#FF99C2]', // Pink
]

export default function NeoBrutalistCarousel({ items }: NeoBrutalistCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const { useOriginal } = useLanguage()

  if (!items || items.length === 0) return null

  const displayItems = items.slice(0, 6) // up to 6 items

  const handleNext = useCallback(() => setActiveIndex((prev) => (prev + 1) % displayItems.length), [displayItems.length])
  const handlePrev = useCallback(() => setActiveIndex((prev) => (prev === 0 ? displayItems.length - 1 : prev - 1)), [displayItems.length])

  // Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext()
    }, 10000)
    return () => clearInterval(timer)
  }, [handleNext])

  const activeItem = displayItems[activeIndex]

  return (
    <>
      <HeroBanner item={activeItem} />
      <div className="relative w-full h-[520px] flex flex-col justify-center items-center py-6 pointer-events-none mb-8 -mt-[52vh] z-20 max-w-[1400px] mx-auto">
      


      <div className="relative w-full h-[360px] flex justify-center items-center mt-6 pointer-events-auto">
        <AnimatePresence initial={false} mode="popLayout">
          {displayItems.map((item, index) => {
            const offset = index - activeIndex
            const normalizedOffset = offset < -2 ? offset + displayItems.length : offset > 2 ? offset - displayItems.length : offset
            
            // Render only 3 cards
            if (Math.abs(normalizedOffset) > 1 && displayItems.length > 3) return null

            const isCenter = normalizedOffset === 0
            const isLeft = normalizedOffset === -1
            const isRight = normalizedOffset === 1

            const zIndex = isCenter ? 30 : 20
            const scale = isCenter ? 1 : 0.85
            const x = isCenter ? 0 : isLeft ? -160 : 160
            const rotate = isCenter ? 0 : isLeft ? -4 : 4
            
            const colorClass = BRUTAL_COLORS[index % BRUTAL_COLORS.length]

            return (
              <motion.div
                key={item.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x
                  if (swipe < -50) {
                    handleNext()
                  } else if (swipe > 50) {
                    handlePrev()
                  }
                }}
                className={`absolute w-[240px] h-[340px] rounded-xl border-[3px] border-black ${colorClass} cursor-grab active:cursor-grabbing overflow-hidden transition-shadow duration-300 ${isCenter ? 'shadow-[8px_8px_0px_#000] hover:shadow-[12px_12px_0px_#000]' : 'shadow-[4px_4px_0px_#000]'}`}
                style={{ zIndex }}
                initial={{ opacity: 0, scale: 0.8, x: x + (isLeft ? -50 : 50) }}
                animate={{ opacity: 1, scale, x, rotate }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                onClick={() => {
                  if (isCenter) router.push(`/tv/${item.id}`)
                  else if (isLeft) handlePrev()
                  else if (isRight) handleNext()
                }}
              >
                <div className="w-full h-full relative p-3 flex flex-col items-center justify-between">
                  {/* Brutalist Text inside card */}
                  <h3 className="font-['Outfit'] font-black text-black text-[22px] leading-tight mb-2 mt-1 line-clamp-2 text-center w-full px-2">
                      {getTitle(item, useOriginal)}
                  </h3>
                  
                  {/* Image container */}
                  <div className="w-full flex-1 relative border-[3px] border-black bg-black rounded-lg overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                    <img 
                      src={getPosterUrl(item.poster_path, 'w342')} 
                      alt={getTitle(item, useOriginal)}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>

                  {/* ID / Rating brutalist badge */}
                  <div className="absolute bottom-1.5 left-2 bg-white border-2 border-black rounded px-1.5 py-0.5 shadow-[2px_2px_0px_#000] transform rotate-3">
                    <span className="text-black font-black text-[10px]">⭐ {item.vote_average.toFixed(1)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>


      </div>
    </div>
    </>
  )
}

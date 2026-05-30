'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MediaCard from './MediaCard'
import type { MediaItem } from '@/lib/tmdb/types'

interface MediaCarouselProps {
  items: MediaItem[]
  title: string
  variant?: 'default' | 'wide'
}

export default function MediaCarousel({ items, title, variant = 'default' }: MediaCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Max 15 items
  const carouselItems = items.slice(0, 15)

  const checkScrollLimits = () => {
    const container = containerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 15)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollLimits, { passive: true })
      checkScrollLimits()
    }
    
    window.addEventListener('resize', checkScrollLimits)
    
    // Check again after a tiny delay for layout stabilization
    const timer = setTimeout(checkScrollLimits, 150)
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollLimits)
      }
      window.removeEventListener('resize', checkScrollLimits)
      clearTimeout(timer)
    }
  }, [carouselItems.length])

  const handlePrev = () => {
    const container = containerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      if (scrollLeft <= 10) {
        container.scrollTo({ left: scrollWidth, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: -clientWidth * 0.75, behavior: 'smooth' })
      }
    }
  }

  const handleNext = () => {
    const container = containerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      if (scrollLeft + clientWidth >= scrollWidth - 25) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: clientWidth * 0.75, behavior: 'smooth' })
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - containerRef.current.offsetLeft)
    setScrollLeft(containerRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    e.preventDefault()
    const x = e.pageX - containerRef.current.offsetLeft
    const walk = (x - startX) * 2 // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk
  }

  if (carouselItems.length === 0) return null

  return (
    <section className="relative group/carousel px-4 mb-12 w-full pointer-events-auto">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="w-1.5 h-6 rounded-full bg-[var(--plotter-orange)] shadow-[0_0_10px_rgba(244,98,42,0.5)]" />
        <h2 className="text-lg md:text-xl font-black text-white font-['Outfit'] tracking-tight">
          {title}
        </h2>
      </div>

      <div className="relative w-full">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className={`absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/85 backdrop-blur-md text-white border border-white/10 shadow-2xl transition-all duration-300 transform active:scale-90 cursor-pointer ${
            showLeftArrow 
              ? 'opacity-100 scale-100 visible' 
              : 'opacity-0 scale-75 pointer-events-none'
          } md:group-hover/carousel:opacity-100 md:group-hover/carousel:scale-100`}
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6 text-[var(--plotter-orange)]" strokeWidth={3} />
        </button>

        {/* Scroll Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-2 no-scrollbar select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {carouselItems.map((item, idx) => (
            <div
              key={`${item.id}-${'title' in item ? 'movie' : 'tv'}`}
              className={`flex-shrink-0 snap-start pointer-events-none ${variant === 'wide' ? 'w-[280px] sm:w-[340px]' : 'w-[180px] sm:w-[220px]'}`}
            >
              <div className="pointer-events-auto">
                <MediaCard item={item} priority={idx < 5} variant={variant} />
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className={`absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/85 backdrop-blur-md text-white border border-white/10 shadow-2xl transition-all duration-300 transform active:scale-90 cursor-pointer ${
            showRightArrow 
              ? 'opacity-100 scale-100 visible' 
              : 'opacity-0 scale-75 pointer-events-none'
          } md:group-hover/carousel:opacity-100 md:group-hover/carousel:scale-100`}
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6 text-[var(--plotter-orange)]" strokeWidth={3} />
        </button>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
    </section>
  )
}

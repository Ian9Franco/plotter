'use client'

import { useRouter } from 'next/navigation'
import { getBackdropUrl } from '@/lib/tmdb/client'
import { getTitle, isMovie, getReleaseYear } from '@/lib/tmdb/types'
import type { MediaItem, WatchProviders as WatchProvidersType } from '@/lib/tmdb/types'
import { getMovieWatchProviders } from '@/lib/tmdb/movies'
import { getTVWatchProviders } from '@/lib/tmdb/tv'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Calendar } from 'lucide-react'
import { WatchProviders } from '@/components/ui/WatchProviders'
import { useState, useEffect } from 'react'

interface HeroBannerProps {
  item: MediaItem
}

export default function HeroBanner({ item }: HeroBannerProps) {
  const router = useRouter()

  if (!item) return <HeroBannerSkeleton />

  const title      = getTitle(item)
  const type       = isMovie(item) ? 'movie' : 'tv'
  const backdropUrl = getBackdropUrl(item.backdrop_path, 'w1280')
  const genres      = item.genre_ids && item.genre_ids.length > 0 ? 'TENDENCIA' : 'SPOTLIGHT'
  let overview      = item.overview || ''
  const firstPeriod = overview.indexOf('.')
  if (firstPeriod !== -1) {
    overview = overview.substring(0, firstPeriod + 1)
  }
  const year        = getReleaseYear(item)
  const rating     = item.vote_average?.toFixed(1)

  const [providers, setProviders] = useState<WatchProvidersType | null>(null)

  useEffect(() => {
    if (!item) return
    let mounted = true
    const isM = isMovie(item)
    const fetchProviders = isM ? getMovieWatchProviders : getTVWatchProviders

    fetchProviders(item.id).then(res => {
      if (mounted) setProviders(res)
    }).catch(console.error)

    return () => { mounted = false; setProviders(null) }
  }, [item])

  const handleCTA = () => router.push(`/${type}/${item.id}`)

  return (
    <section 
      className="relative w-full h-[80vh] min-h-[600px] max-h-[900px] overflow-hidden cursor-pointer"
      onClick={handleCTA}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gray-800" />
          )}

          {/* Gradients for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--plotter-black)] via-transparent to-transparent opacity-80" />

          {/* Info Content at the TOP */}
          <div className="absolute inset-0 flex flex-col justify-start px-6 md:px-16 pt-[100px] md:pt-[120px] max-w-[1400px] mx-auto w-full pointer-events-none">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-2xl"
            >
              <span className="text-xs md:text-sm font-black tracking-[0.2em] text-[var(--plotter-orange)] uppercase mb-2 block drop-shadow-md">
                {type === 'movie' ? 'PELÍCULA' : 'SERIE'} • {genres}
              </span>
              
              <h1 className="font-['Outfit'] font-black text-4xl md:text-6xl text-white leading-tight line-clamp-2 drop-shadow-xl mb-3">
                {title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-white/90 font-medium mb-4 drop-shadow-md">
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[var(--plotter-orange)] fill-[var(--plotter-orange)]" /> {rating}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {year}</span>
                
                <div onClick={(e) => e.stopPropagation()} className="pl-4 border-l border-white/20">
                  <WatchProviders providers={providers} />
                </div>
              </div>
              
              {overview && (
                <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-2xl drop-shadow-md">
                  {overview.includes('.') ? overview.substring(0, overview.indexOf('.') + 1) : overview}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

function HeroBannerSkeleton() {
  return (
    <div className="h-[80vh] min-h-[600px] max-h-[900px] w-full skeleton" />
  )
}

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
import { useLanguage } from '@/hooks/useLanguage'

interface HeroBannerProps {
  item: MediaItem
}

export default function HeroBanner({ item }: HeroBannerProps) {
  const router = useRouter()
  const { useOriginal } = useLanguage()

  if (!item) return <HeroBannerSkeleton />

  const title      = getTitle(item, useOriginal)
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
  const [omdb, setOmdb] = useState<{ imdb: string | null; metacritic: string | null } | null>(null)
  const [omdbLoading, setOmdbLoading] = useState(false)

  useEffect(() => {
    if (!item) return
    let mounted = true
    const isM = isMovie(item)
    const fetchProviders = isM ? getMovieWatchProviders : getTVWatchProviders

    fetchProviders(item.id).then(res => {
      if (mounted) setProviders(res)
    }).catch(console.error)

    // Fetch OMDb ratings for banner
    setOmdbLoading(true)
    const type = isM ? 'movie' : 'tv'
    fetch(`/api/omdb?tmdbId=${item.id}&type=${type}`)
      .then(res => res.json())
      .then(data => {
        if (mounted && data && !data.error) {
          setOmdb({ imdb: data.imdb, metacritic: data.metacritic })
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setOmdbLoading(false)
      })

    return () => { 
      mounted = false
      setProviders(null)
      setOmdb(null)
    }
  }, [item])

  return (
    <section 
      className="relative w-full h-[80vh] min-h-[600px] max-h-[900px] overflow-hidden"
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
          <div className="absolute inset-0 flex flex-col justify-start px-6 md:px-16 pt-[80px] md:pt-[100px] max-w-[1400px] mx-auto w-full pointer-events-none">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-2xl"
            >
              {/* Type badge */}
              <div className="inline-flex items-center px-3 py-1 rounded-full mb-3 pointer-events-none"
                style={{ boxShadow: '3px 3px 10px rgba(0,0,0,0.5), -1px -1px 6px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)', backgroundColor: 'rgba(244,98,42,0.15)', border: '1px solid rgba(244,98,42,0.3)' }}
              >
                <span className="text-[10px] font-black tracking-[0.2em] text-[var(--plotter-orange)] uppercase drop-shadow-md">
                  {type === 'movie' ? 'PELÍCULA' : 'SERIE'} • {genres}
                </span>
              </div>

              <h1 className="font-['Outfit'] font-black text-4xl md:text-6xl text-white leading-tight line-clamp-2 drop-shadow-xl mb-4">
                {title}
              </h1>

              {/* Metadata nm-pill row */}
              <div className="flex flex-wrap items-center gap-2 mb-4 pointer-events-auto">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                  style={{ boxShadow: '3px 3px 12px rgba(0,0,0,0.6), -2px -2px 8px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,26,46,0.7)', backdropFilter: 'blur(12px)' }}
                >
                  <Star className="w-3.5 h-3.5 text-[var(--plotter-orange)] fill-[var(--plotter-orange)]" />
                  {rating}
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                  style={{ boxShadow: '3px 3px 12px rgba(0,0,0,0.6), -2px -2px 8px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,26,46,0.7)', backdropFilter: 'blur(12px)' }}
                >
                  <Calendar className="w-3.5 h-3.5 text-white/60" />
                  {year}
                </div>

                {/* IMDb / Metacritic */}
                {(omdb || omdbLoading) && (
                  <>
                    {omdbLoading ? (
                      <div className="h-7 w-16 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    ) : (
                      <>
                        {omdb?.imdb && (
                          <div
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black"
                            style={{ backgroundColor: '#F5C518', color: '#000' }}
                          >
                            IMDb {omdb.imdb.replace('/10', '')}
                          </div>
                        )}
                        {omdb?.metacritic && (
                          <div
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black text-white"
                            style={{ backgroundColor: '#66CC33' }}
                          >
                            M {omdb.metacritic}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
                  <WatchProviders providers={providers} />
                </div>
              </div>

              {overview && (
                <div className="max-w-lg pointer-events-auto">
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      boxShadow: '5px 5px 20px rgba(0,0,0,0.7), -3px -3px 12px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
                      backgroundColor: 'rgba(8,12,20,0.6)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
                      {overview}
                    </p>
                  </div>
                </div>
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

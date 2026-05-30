'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import MediaCarousel from '@/components/media/MediaCarousel'
import { getTrendingMovies, getNowPlayingMovies, getUpcomingMovies } from '@/lib/tmdb/movies'
import type { Movie } from '@/lib/tmdb/types'
import { Sparkles, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

let cachedTrendingMovies: Movie[] | null = null
let cachedNowPlayingMovies: Movie[] | null = null
let cachedUpcomingMovies: Movie[] | null = null
let cachedFeaturedMovie: Movie | null = null

function MoviesPageContent() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>(cachedTrendingMovies || [])
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>(cachedNowPlayingMovies || [])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>(cachedUpcomingMovies || [])
  const [loading, setLoading] = useState(!cachedTrendingMovies)
  const [featured, setFeatured] = useState<Movie | null>(cachedFeaturedMovie)
  
  const searchParams = useSearchParams()
  const selectedGenre = searchParams.get('genre') || 'Todo'

  useEffect(() => {
    if (cachedTrendingMovies && cachedNowPlayingMovies && cachedUpcomingMovies) {
      return
    }

    async function load() {
      setLoading(true)
      try {
        const [trendingData, nowPlayingData, upcomingData] = await Promise.all([
          getTrendingMovies(),
          getNowPlayingMovies(),
          getUpcomingMovies(),
        ])

        const todayStr = new Date().toISOString().split('T')[0]
        
        // Filter trending and now playing to make sure unreleased movies are excluded
        const releasedTrending = trendingData.filter(m => !m.release_date || m.release_date <= todayStr)
        const releasedNowPlaying = nowPlayingData.filter(m => !m.release_date || m.release_date <= todayStr)
        
        // Filter upcoming movies to ensure they are strictly in the future
        const strictlyUpcoming = upcomingData.filter(m => m.release_date && m.release_date > todayStr)

        cachedTrendingMovies = releasedTrending
        cachedNowPlayingMovies = releasedNowPlaying
        cachedUpcomingMovies = strictlyUpcoming

        // Set featured movie from now playing or trending
        if (releasedNowPlaying.length > 0) {
          cachedFeaturedMovie = releasedNowPlaying[0]
        } else if (releasedTrending.length > 0) {
          cachedFeaturedMovie = releasedTrending[0]
        }

        setTrendingMovies(releasedTrending)
        setNowPlayingMovies(releasedNowPlaying)
        setUpcomingMovies(strictlyUpcoming)
        setFeatured(cachedFeaturedMovie)
      } catch (err) {
        console.error('Error loading movies:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const GENRE_MAP: Record<string, number> = {
    'Acción': 28,
    'Aventura': 12,
    'Comedia': 35,
    'Drama': 18,
    'Terror': 27,
    'Ciencia Ficción': 878,
  }

  const filteredMovies = selectedGenre === 'Todo'
    ? trendingMovies
    : trendingMovies.filter(m => m.genre_ids?.includes(GENRE_MAP[selectedGenre]))

  return (
    <div className="min-h-full bg-[var(--plotter-black)] flex flex-col">
      <main className="page-content pt-24 max-w-[1400px] mx-auto w-full flex-1">

        {/* Featured Card (Top Movie) */}
        {!loading && featured && selectedGenre === 'Todo' && (
          <div className="px-4 mb-6">
            <div 
              className="relative h-[220px] rounded-[var(--radius-xl)] overflow-hidden cursor-pointer nm-raised-lg group"
              onClick={() => window.location.href = `/movie/${featured.id}`}
            >
              {featured.backdrop_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w780${featured.backdrop_path}`}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060A12] via-black/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col gap-1">
                <span className="badge badge-movie self-start mb-1 shadow-sm uppercase text-[9px] tracking-wider font-bold">
                  Destacada hoy
                </span>
                <h2 className="text-white font-['Outfit'] font-bold text-lg leading-tight truncate">
                  {featured.title}
                </h2>
                <p className="text-white/60 text-xs line-clamp-1">
                  {featured.overview}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Movies Carousels or Grid depending on Selected Genre */}
        {selectedGenre === 'Todo' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-12 px-4">
                {Array.from({ length: 3 }).map((_, sectionIdx) => (
                  <div key={sectionIdx} className="space-y-4">
                    <div className="skeleton h-6 w-48 rounded" />
                    <div className="flex gap-4 overflow-x-hidden py-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[180px] sm:w-[220px] aspect-[2/3] skeleton rounded-2xl" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <MediaCarousel items={trendingMovies} title="Tendencias de la Semana" />
                <MediaCarousel items={nowPlayingMovies} title="En Cines Hoy" />
                <MediaCarousel items={upcomingMovies} title="Próximamente" />
              </>
            )}
          </div>
        ) : (
          <MediaGrid
            items={filteredMovies}
            title={`Películas de ${selectedGenre}`}
            loading={loading}
            columns={3}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function MoviesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-full bg-[var(--plotter-black)] flex items-center justify-center pt-32">
        <div className="spinner" />
      </div>
    }>
      <MoviesPageContent />
    </Suspense>
  )
}

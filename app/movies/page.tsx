'use client'

import { useState, useEffect, Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import MediaCarousel from '@/components/media/MediaCarousel'
import { getTrendingMovies, getNowPlayingMovies, getUpcomingMovies } from '@/lib/tmdb/movies'
import type { Movie } from '@/lib/tmdb/types'
import { Sparkles, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MoviesPage() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState<Movie | null>(null)
  const [selectedGenre, setSelectedGenre] = useState('Todo')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
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

        setTrendingMovies(releasedTrending)
        setNowPlayingMovies(releasedNowPlaying)
        setUpcomingMovies(strictlyUpcoming)

        // Set featured movie from now playing or trending
        if (releasedNowPlaying.length > 0) {
          setFeatured(releasedNowPlaying[0])
        } else if (releasedTrending.length > 0) {
          setFeatured(releasedTrending[0])
        }
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
    <div className="min-h-dvh bg-[var(--plotter-black)]">
      <Suspense fallback={<div className="h-20" />}>
        <Navbar />
      </Suspense>

      <main className="page-content pt-20 max-w-[1400px] mx-auto w-full">
        {/* Page Header */}
        <div className="px-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-white font-['Outfit'] font-black text-xl leading-tight">
              Películas
            </h1>
            <p className="text-[var(--plotter-muted)] text-xs">
              Descubrí las últimas tendencias del cine
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="px-4 mb-6 relative z-30">
          <div className="relative inline-block text-left">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--plotter-card)]/40 hover:bg-[var(--plotter-card)]/60 text-[var(--plotter-white)] text-sm font-medium border border-[var(--plotter-border)] shadow-[var(--nm-raised-sm)] transition-all duration-300 group cursor-pointer"
            >
              <span className="text-[var(--plotter-muted)]">Género:</span>
              <span className="text-[var(--plotter-orange)] font-bold">{selectedGenre}</span>
              <ChevronDown className={`w-4 h-4 ml-1 text-[var(--plotter-muted)] transition-transform duration-300 group-hover:text-[var(--plotter-white)] ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                  
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-56 rounded-[var(--radius-xl)] bg-[var(--plotter-card)] border border-[var(--plotter-border)] shadow-2xl z-40 overflow-hidden backdrop-blur-xl"
                  >
                    <div className="py-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {['Todo', 'Acción', 'Aventura', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => {
                            setSelectedGenre(tab)
                            setIsOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 hover:bg-[var(--plotter-card-hover)] flex items-center justify-between cursor-pointer ${
                            selectedGenre === tab 
                              ? 'text-[var(--plotter-orange)] font-bold' 
                              : 'text-[var(--plotter-muted)] hover:text-[var(--plotter-white)]'
                          }`}
                        >
                          {tab}
                          {selectedGenre === tab && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--plotter-orange)] shadow-[0_0_8px_rgba(244,98,42,0.6)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

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
                <span className="badge badge-movie self-start mb-1 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> Destacada hoy
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
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  )
}

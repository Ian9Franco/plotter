'use client'

import { useState, useEffect, Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import { getTrendingTV, getOnAirTop } from '@/lib/tmdb/tv'
import type { TVShow } from '@/lib/tmdb/types'
import { Sparkles, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TVPage() {
  const [tvShows, setTvShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState<TVShow | null>(null)
  const [selectedGenre, setSelectedGenre] = useState('Todo')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [trendingData, topTV] = await Promise.all([
          getTrendingTV(),
          getOnAirTop(),
        ])
        setTvShows(trendingData)
        if (topTV) setFeatured(topTV)
      } catch (err) {
        console.error('Error loading TV shows:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const GENRE_MAP: Record<string, number> = {
    'Acción y Aventura': 10759,
    'Animación': 16,
    'Comedia': 35,
    'Crimen': 80,
    'Documental': 99,
    'Drama': 18,
    'Sci-Fi & Fantasy': 10765,
  }

  const filteredTV = selectedGenre === 'Todo'
    ? tvShows
    : tvShows.filter(t => t.genre_ids?.includes(GENRE_MAP[selectedGenre]))

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
              Series
            </h1>
            <p className="text-[var(--plotter-muted)] text-xs">
              Descubrí las mejores series del momento
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
              <span className="text-[var(--plotter-blue)] font-bold">{selectedGenre}</span>
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
                      {['Todo', 'Acción y Aventura', 'Animación', 'Comedia', 'Crimen', 'Documental', 'Drama', 'Sci-Fi & Fantasy'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => {
                            setSelectedGenre(tab)
                            setIsOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 hover:bg-[var(--plotter-card-hover)] flex items-center justify-between cursor-pointer ${
                            selectedGenre === tab 
                              ? 'text-[var(--plotter-blue)] font-bold' 
                              : 'text-[var(--plotter-muted)] hover:text-[var(--plotter-white)]'
                          }`}
                        >
                          {tab}
                          {selectedGenre === tab && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--plotter-blue)] shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
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

        {/* Featured Card (Top TV Show) */}
        {!loading && featured && (
          <div className="px-4 mb-6">
            <div 
              className="relative h-[220px] rounded-[var(--radius-xl)] overflow-hidden cursor-pointer nm-raised-lg group"
              onClick={() => window.location.href = `/tv/${featured.id}`}
            >
              {featured.backdrop_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w780${featured.backdrop_path}`}
                  alt={featured.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060A12] via-black/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col gap-1">
                <span className="badge badge-tv self-start mb-1 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> Destacada hoy
                </span>
                <h2 className="text-white font-['Outfit'] font-bold text-lg leading-tight truncate">
                  {featured.name}
                </h2>
                <p className="text-white/60 text-xs line-clamp-1">
                  {featured.overview}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TV Shows Grid */}
        <MediaGrid
          items={filteredTV}
          title={selectedGenre === 'Todo' ? "Tendencias de la semana" : `Series de ${selectedGenre}`}
          loading={loading}
          columns={3}
        />
      </main>

      <Footer />
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  )
}

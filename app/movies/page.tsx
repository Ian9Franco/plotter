'use client'

import { useState, useEffect, Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import { getTrendingMovies, getNowPlayingTop } from '@/lib/tmdb/movies'
import type { Movie } from '@/lib/tmdb/types'
import { Film, Sparkles, TrendingUp } from 'lucide-react'

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState<Movie | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [trendingData, topMovie] = await Promise.all([
          getTrendingMovies(),
          getNowPlayingTop(),
        ])
        setMovies(trendingData)
        if (topMovie) setFeatured(topMovie)
      } catch (err) {
        console.error('Error loading movies:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-dvh bg-[var(--plotter-black)]">
      <Suspense fallback={<div className="h-20" />}>
        <Navbar />
      </Suspense>

      <main className="page-content pt-20 max-w-[1400px] mx-auto w-full">
        {/* Page Header */}
        <div className="px-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full nm-raised flex items-center justify-center text-[var(--plotter-orange)]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-['Outfit'] font-black text-xl leading-tight">
                Películas
              </h1>
              <p className="text-[var(--plotter-muted)] text-xs">
                Descubrí las últimas tendencias del cine
              </p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-4 mb-6">
          <div className="flex flex-wrap gap-2 pb-2">
            {['Todo', 'Acción', 'Aventura', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción'].map(tab => (
              <button
                key={tab}
                className={`chip shrink-0 ${tab === 'Todo' ? 'chip-active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Card (Top Movie) */}
        {!loading && featured && (
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

        {/* Movies Grid */}
        <MediaGrid
          items={movies}
          title="Tendencias de la semana"
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

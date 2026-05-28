'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import { getTrendingTV, getOnAirTop } from '@/lib/tmdb/tv'
import type { TVShow } from '@/lib/tmdb/types'
import { Tv, Sparkles } from 'lucide-react'

export default function TVPage() {
  const [tvShows, setTvShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState<TVShow | null>(null)

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

  return (
    <div className="min-h-dvh bg-[var(--plotter-black)]">
      <Navbar />

      <main className="page-content pt-20">
        {/* Page Header */}
        <div className="px-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full nm-raised flex items-center justify-center text-[var(--plotter-blue)]">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-['Outfit'] font-black text-xl leading-tight">
                Series
              </h1>
              <p className="text-[var(--plotter-muted)] text-xs">
                Descubrí las mejores series del momento
              </p>
            </div>
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
          items={tvShows}
          title="Tendencias de la semana"
          loading={loading}
          columns={3}
        />
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}

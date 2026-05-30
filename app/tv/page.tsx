'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import HeroBanner from '@/components/home/HeroBanner'
import MediaCarousel from '@/components/media/MediaCarousel'
import NeoBrutalistCarousel from '@/components/media/NeoBrutalistCarousel'
import { getTrendingTV, getOnAirTop, getOnAirTV, discoverTV } from '@/lib/tmdb/tv'
import type { TVShow } from '@/lib/tmdb/types'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

let cachedTvShows: TVShow[] | null = null
let cachedFeaturedTv: TVShow | null = null
let cachedOnAirTv: TVShow[] | null = null

function TVPageContent() {
  const [tvShows, setTvShows] = useState<TVShow[]>(cachedTvShows || [])
  const [loading, setLoading] = useState(!cachedTvShows)
  const [featured, setFeatured] = useState<TVShow | null>(cachedFeaturedTv)
  const [onAirTv, setOnAirTv] = useState<TVShow[]>(cachedOnAirTv || [])
  
  const searchParams = useSearchParams()
  const selectedGenre = searchParams.get('genre') || 'Todo'

  useEffect(() => {
    if (cachedTvShows) return

    async function load() {
      setLoading(true)
      try {
        const [trendingData, topTV, onAirData] = await Promise.all([
          getTrendingTV(),
          getOnAirTop(),
          getOnAirTV(),
        ])
        
        cachedTvShows = trendingData
        if (topTV) cachedFeaturedTv = topTV
        cachedOnAirTv = onAirData
        
        setTvShows(cachedTvShows)
        setFeatured(cachedFeaturedTv)
        setOnAirTv(cachedOnAirTv)
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

  useEffect(() => {
    async function fetchGenreData() {
      if (!cachedTvShows) return // Wait for initial load
      
      if (selectedGenre === 'Todo') {
        setTvShows(cachedTvShows)
        setFeatured(cachedFeaturedTv)
        setOnAirTv(cachedOnAirTv || [])
        return
      }
      
      const genreId = GENRE_MAP[selectedGenre]
      if (!genreId) return

      let localFiltered = cachedTvShows.filter(t => t.genre_ids?.includes(genreId))
      
      if (localFiltered.length < 10) {
        setLoading(true)
        try {
          const discoverData = await discoverTV(genreId)
          if (discoverData && discoverData.length > 0) {
             setTvShows(discoverData)
             setFeatured(discoverData[0] || null)
             setOnAirTv(discoverData.slice(1, 15))
          }
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      } else {
         setTvShows(localFiltered)
         setFeatured(localFiltered[0] || null)
         const localOnAir = (cachedOnAirTv || []).filter(t => t.genre_ids?.includes(genreId))
         setOnAirTv(localOnAir.length > 5 ? localOnAir : localFiltered.slice(1))
      }
    }
    fetchGenreData()
  }, [selectedGenre, loading])

  const filteredTV = tvShows

  return (
    <div className="min-h-full bg-[var(--plotter-black)] flex flex-col">
      <main className="page-content w-full flex-1">


        {/* Neo Brutalist Carousel (Trending) - Overlapping HeroBanner */}
        {!loading && tvShows.length > 0 && (
          <NeoBrutalistCarousel items={tvShows} />
        )}

        {/* Latest Releases Carousel */}
        {!loading && onAirTv.length > 0 && (
          <div className="max-w-[1400px] mx-auto px-6 mt-16 pointer-events-auto relative z-20">
             <MediaCarousel items={onAirTv} title="Últimas Lanzadas" variant="wide" />
          </div>
        )}

        {/* TV Shows Grid */}
        {selectedGenre !== 'Todo' && (
          <div className="max-w-[1400px] mx-auto w-full pt-16">
            <MediaGrid
              items={filteredTV}
              title={`Series de ${selectedGenre}`}
              loading={loading}
              columns={3}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function TVPage() {
  return (
    <Suspense fallback={
      <div className="min-h-full bg-[var(--plotter-black)] flex items-center justify-center pt-32">
        <div className="spinner" />
      </div>
    }>
      <TVPageContent />
    </Suspense>
  )
}

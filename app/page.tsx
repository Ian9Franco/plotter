'use client'

import { useState, useEffect, Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import TrendingCarousel from '@/components/home/TrendingCarousel'
import { getNowPlayingTop, getOnAirTop } from '@/lib/tmdb/combined'
import { getTrendingMovies } from '@/lib/tmdb/movies'
import { getTrendingTV } from '@/lib/tmdb/tv'
import type { MediaItem, Movie, TVShow } from '@/lib/tmdb/types'

export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([])
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [moviesData, tvData] = await Promise.all([
          getTrendingMovies(),
          getTrendingTV(),
        ])

        setTrendingMovies(moviesData)
        setTrendingTV(tvData)
      } catch (err) {
        console.error('Error loading home:', err)
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

      <main className="page-content w-full">



        {/* Trending 3D Carousel */}
        {!loading && (
          <Suspense fallback={<div className="h-[480px]" />}>
            <TrendingCarousel movies={trendingMovies} tv={trendingTV} />
          </Suspense>
        )}
      </main>

      <Footer />
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  )
}

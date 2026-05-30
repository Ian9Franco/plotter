'use client'

import { useState, useEffect, Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import TrendingCarousel from '@/components/home/TrendingCarousel'
import MediaCarousel from '@/components/media/MediaCarousel'
import { getTrendingMovies, getUpcomingMovies } from '@/lib/tmdb/movies'
import { getTrendingTV } from '@/lib/tmdb/tv'
import type { MediaItem, Movie } from '@/lib/tmdb/types'

export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([])
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [moviesData, tvData, upcomingData] = await Promise.all([
          getTrendingMovies(),
          getTrendingTV(),
          getUpcomingMovies(),
        ])

        const todayStr = new Date().toISOString().split('T')[0]
        const releasedMovies = moviesData.filter(m => !m.release_date || m.release_date <= todayStr)
        const releasedTV = tvData.filter(t => !t.first_air_date || t.first_air_date <= todayStr)
        const strictlyUpcoming = upcomingData.filter(m => m.release_date && m.release_date > todayStr)

        setTrendingMovies(releasedMovies)
        setTrendingTV(releasedTV)
        setUpcomingMovies(strictlyUpcoming)
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

        {/* Upcoming Section */}
        {!loading && upcomingMovies.length > 0 && (
          <div className="max-w-[1400px] mx-auto px-6 pb-24 mt-16 pointer-events-auto relative z-20">
            <Suspense fallback={<div className="h-[300px] skeleton rounded-2xl" />}>
              <MediaCarousel items={upcomingMovies} title="Próximos Estrenos" variant="wide" />
            </Suspense>
          </div>
        )}
      </main>

      <Footer />
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  )
}

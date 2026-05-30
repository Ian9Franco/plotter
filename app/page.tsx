'use client'

import { useState, useEffect, Suspense } from 'react'
import Footer from '@/components/layout/Footer'
import TrendingCarousel from '@/components/home/TrendingCarousel'
import MediaCarousel from '@/components/media/MediaCarousel'
import { getTrendingMovies, getUpcomingMovies } from '@/lib/tmdb/movies'
import { getTrendingTV } from '@/lib/tmdb/tv'
import type { MediaItem, Movie } from '@/lib/tmdb/types'

let cachedTrendingMovies: MediaItem[] | null = null
let cachedTrendingTV: MediaItem[] | null = null
let cachedUpcomingMovies: Movie[] | null = null

export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>(cachedTrendingMovies || [])
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>(cachedTrendingTV || [])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>(cachedUpcomingMovies || [])
  const [loading,   setLoading]   = useState(!cachedTrendingMovies)

  useEffect(() => {
    if (cachedTrendingMovies && cachedTrendingTV && cachedUpcomingMovies) {
      return
    }

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

        cachedTrendingMovies = releasedMovies
        cachedTrendingTV = releasedTV
        cachedUpcomingMovies = strictlyUpcoming

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
    <div className="min-h-full bg-[var(--plotter-black)] flex flex-col">

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
    </div>
  )
}

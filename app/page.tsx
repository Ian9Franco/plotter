'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import HeroBanner from '@/components/home/HeroBanner'
import SearchBar from '@/components/home/SearchBar'
import MediaGrid from '@/components/media/MediaGrid'
import { getTrendingAll, getNowPlayingTop, getOnAirTop } from '@/lib/tmdb/combined'
import type { MediaItem, Movie, TVShow } from '@/lib/tmdb/types'

export default function HomePage() {
  const [heroItems, setHeroItems] = useState<MediaItem[]>([])
  const [trending,  setTrending]  = useState<MediaItem[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [topMovie, topTV, trendingData] = await Promise.all([
          getNowPlayingTop(),
          getOnAirTop(),
          getTrendingAll(),
        ])

        const hero: MediaItem[] = []
        if (topMovie) hero.push(topMovie as Movie)
        if (topTV)    hero.push(topTV as TVShow)
        setHeroItems(hero)
        setTrending(trendingData)
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
      <Navbar />

      <main className="page-content">
        {/* Hero */}
        <HeroBanner items={heroItems} />

        {/* Search */}
        <div className="px-4 py-4 -mt-0">
          <SearchBar />
        </div>

        {/* Filter tabs */}
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Todo', 'Películas', 'Series', 'Acción', 'Drama', 'Terror'].map(tab => (
              <button
                key={tab}
                className={`chip shrink-0 ${tab === 'Todo' ? 'chip-active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Trending grid */}
        <MediaGrid
          items={trending}
          title="Tendencias"
          loading={loading}
          columns={3}
        />
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}

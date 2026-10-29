'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import PagedMediaCarousel from '@/components/media/PagedMediaCarousel'
import NeoBrutalistCarousel from '@/components/media/NeoBrutalistCarousel'
import { discoverTV } from '@/lib/tmdb/tv'
import type { TVShow } from '@/lib/tmdb/types'

interface TVBrowserProps {
  trending: TVShow[]
  onAir: TVShow[]
  onAirPages: number
}

const GENRE_MAP: Record<string, number> = {
  'Acción y Aventura': 10759,
  'Animación': 16,
  'Comedia': 35,
  'Crimen': 80,
  'Documental': 99,
  'Drama': 18,
  'Sci-Fi & Fantasy': 10765,
}

function TVBrowserContent({ trending, onAir, onAirPages }: TVBrowserProps) {
  const searchParams = useSearchParams()
  const selectedGenre = searchParams.get('genre') || 'Todo'
  const [tvShows, setTvShows] = useState(trending)
  const [onAirTv, setOnAirTv] = useState(onAir)
  const [loadingGenre, setLoadingGenre] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function applyGenre() {
      if (selectedGenre === 'Todo') {
        setTvShows(trending)
        setOnAirTv(onAir)
        return
      }

      const genreId = GENRE_MAP[selectedGenre]
      if (!genreId) return

      const localFiltered = trending.filter((show) => show.genre_ids?.includes(genreId))
      if (localFiltered.length >= 10) {
        setTvShows(localFiltered)
        const localOnAir = onAir.filter((show) => show.genre_ids?.includes(genreId))
        setOnAirTv(localOnAir.length > 5 ? localOnAir : localFiltered.slice(1))
        return
      }

      setLoadingGenre(true)
      try {
        const discoverData = await discoverTV(genreId)
        if (cancelled || !discoverData?.length) return
        setTvShows(discoverData)
        setOnAirTv(discoverData.slice(1, 15))
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoadingGenre(false)
      }
    }

    applyGenre()
    return () => { cancelled = true }
  }, [onAir, selectedGenre, trending])

  return (
    <div className="min-h-full bg-[var(--plotter-black)] flex flex-col">
      <main className="page-content w-full flex-1">
        {tvShows.length > 0 && (
          <NeoBrutalistCarousel items={tvShows} />
        )}

        {onAirTv.length > 0 && (
          <div className="max-w-[1400px] mx-auto px-6 mt-16 pointer-events-auto relative z-20">
            <PagedMediaCarousel
              initialItems={selectedGenre === 'Todo' ? onAir : onAirTv}
              totalPages={selectedGenre === 'Todo' ? onAirPages : 1}
              title="Últimas Lanzadas"
              action="on-air"
              variant="wide"
            />
          </div>
        )}

        {selectedGenre !== 'Todo' && (
          <div className="max-w-[1400px] mx-auto w-full pt-16">
            <MediaGrid
              items={tvShows}
              title={`Series de ${selectedGenre}`}
              loading={loadingGenre}
              columns={3}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function TVBrowser(props: TVBrowserProps) {
  return (
    <Suspense fallback={
      <div className="min-h-full bg-[var(--plotter-black)] flex items-center justify-center pt-32">
        <div className="spinner" />
      </div>
    }>
      <TVBrowserContent {...props} />
    </Suspense>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import PagedMediaCarousel from '@/components/media/PagedMediaCarousel'
import NeoBrutalistCarousel from '@/components/media/NeoBrutalistCarousel'
import { discoverTVPage } from '@/lib/tmdb/tv'
import { TV_GENRE_MENU, genreIdByLabel } from '@/lib/tmdb/genres'
import type { TVShow } from '@/lib/tmdb/types'

interface TVBrowserProps {
  trending: TVShow[]
  onAir: TVShow[]
  onAirPages: number
}

function TVBrowserContent({ trending, onAir, onAirPages }: TVBrowserProps) {
  const searchParams = useSearchParams()
  const selectedGenre = searchParams.get('genre') || 'Todo'
  const genreId = genreIdByLabel(TV_GENRE_MENU, selectedGenre)
  const [shows, setShows] = useState<TVShow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (selectedGenre === 'Todo' || genreId == null) return
    const controller = new AbortController()
    setStatus('loading')
    setPage(1)
    discoverTVPage(genreId, 1, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setShows(data.results)
        setTotalPages(data.total_pages)
        setStatus(data.results.length === 0 ? 'empty' : 'ready')
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setShows([])
        setStatus('error')
      })
    return () => controller.abort()
  }, [attempt, genreId, selectedGenre])

  const loadMore = async () => {
    if (genreId == null || page >= totalPages) return
    const next = page + 1
    const data = await discoverTVPage(genreId, next)
    setShows((current) => {
      const seen = new Set(current.map((show) => show.id))
      return [...current, ...data.results.filter((show) => !seen.has(show.id))]
    })
    setPage(next)
    setTotalPages(data.total_pages)
  }

  return (
    <div className="min-h-full bg-[var(--plotter-black)] flex flex-col">
      <main className="page-content w-full flex-1">
        {selectedGenre === 'Todo' ? (
          <>
            {trending.length > 0 && <NeoBrutalistCarousel items={trending} />}
            {onAir.length > 0 && (
              <div className="max-w-[1400px] mx-auto px-6 mt-16 pointer-events-auto relative z-20">
                <PagedMediaCarousel
                  initialItems={onAir}
                  totalPages={onAirPages}
                  title="Últimas Lanzadas"
                  action="on-air"
                  variant="wide"
                />
              </div>
            )}
          </>
        ) : status === 'error' ? (
          <div className="px-4 py-24 text-center">
            <p className="text-[var(--plotter-muted)] text-sm">No se pudieron cargar las series de {selectedGenre}.</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--plotter-orange)' }}>
              Reintentar
            </button>
          </div>
        ) : status === 'empty' ? (
          <div className="px-4 py-24 text-center">
            <p className="text-[var(--plotter-muted)] text-sm">No hay series de {selectedGenre} en este listado.</p>
            <Link href="/tv" className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--plotter-orange)' }}>
              Volver a Todo
            </Link>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto w-full pt-6">
            <MediaGrid
              items={shows}
              title={`Series de ${selectedGenre}`}
              loading={status === 'loading' || status === 'idle'}
              columns={3}
            />
            {status === 'ready' && page < totalPages && (
              <div className="flex justify-center py-8">
                <button type="button" onClick={loadMore} className="px-5 py-3 rounded-2xl text-sm font-bold text-[var(--plotter-white)] border border-white/10" style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}>
                  Cargar más
                </button>
              </div>
            )}
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

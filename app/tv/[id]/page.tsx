'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import DetailHero from '@/components/detail/DetailHero'
import WatchProvidersSection from '@/components/detail/WatchProviders'
import ReviewEditor from '@/components/review/ReviewEditor'
import { getTVDetails, getTVWatchProviders } from '@/lib/tmdb/tv'
import type { TVDetails, WatchProviders } from '@/lib/tmdb/types'

interface TVPageProps {
  params: { id: string }
}

export default function TVPage({ params }: TVPageProps) {
  const id = Number(params.id)

  const [show,      setShow]      = useState<TVDetails | null>(null)
  const [providers, setProviders] = useState<WatchProviders | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [tvData, providersData] = await Promise.all([
          getTVDetails(id),
          getTVWatchProviders(id),
        ])
        setShow(tvData)
        setProviders(providersData)
      } catch (err) {
        console.error('Error loading TV show:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <DetailSkeleton />

  if (!show) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--plotter-black)]">
        <p className="text-[var(--plotter-muted)]">Serie no encontrada</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[var(--plotter-black)]">
      <Navbar />

      <main className="page-content pt-0">
        <DetailHero
          item={show}
          onWriteReview={() => {
            setShowReview(true)
            setTimeout(() => {
              document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }}
        />

        {/* Season/Episode info */}
        {(show.number_of_seasons || show.number_of_episodes) && (
          <div className="px-4 mt-4">
            <div className="flex gap-3">
              {show.number_of_seasons > 0 && (
                <div className="flex-1 glass-card rounded-[var(--radius-lg)] p-3 text-center">
                  <p className="font-['Outfit'] font-black text-2xl text-[var(--plotter-orange)]">
                    {show.number_of_seasons}
                  </p>
                  <p className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider mt-0.5">
                    Temporada{show.number_of_seasons > 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {show.number_of_episodes > 0 && (
                <div className="flex-1 glass-card rounded-[var(--radius-lg)] p-3 text-center">
                  <p className="font-['Outfit'] font-black text-2xl text-[var(--plotter-orange)]">
                    {show.number_of_episodes}
                  </p>
                  <p className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider mt-0.5">
                    Episodios
                  </p>
                </div>
              )}
              {show.status && (
                <div className="flex-1 glass-card rounded-[var(--radius-lg)] p-3 text-center">
                  <p className="font-['Outfit'] font-black text-sm text-white leading-tight">
                    {show.status === 'Returning Series' ? 'En curso'
                      : show.status === 'Ended' ? 'Finalizada'
                      : show.status === 'Canceled' ? 'Cancelada'
                      : show.status}
                  </p>
                  <p className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider mt-0.5">
                    Estado
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <WatchProvidersSection providers={providers} />

        {/* Review section */}
        <div id="review-section">
          {showReview ? (
            <ReviewEditor item={show} />
          ) : (
            <div className="px-4 mt-6">
              <button
                id="open-review-section-btn"
                onClick={() => setShowReview(true)}
                className="w-full py-4 rounded-[var(--radius-xl)] border border-dashed border-[var(--plotter-border)] text-[var(--plotter-muted)] text-sm hover:border-[var(--plotter-border-glow)] hover:text-[var(--plotter-orange)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span className="text-lg">✏️</span>
                Escribir mi reseña
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="min-h-dvh bg-[var(--plotter-black)]">
      <div className="skeleton h-52 w-full" />
      <div className="mx-4 -mt-8 rounded-[var(--radius-xl)] p-4 glass-card space-y-3">
        <div className="flex gap-4">
          <div className="skeleton w-20 h-[120px] rounded-[var(--radius-md)] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-6 w-3/4 rounded-lg" />
            <div className="skeleton h-4 w-1/2 rounded-lg" />
            <div className="skeleton h-4 w-2/3 rounded-lg" />
          </div>
        </div>
        <div className="skeleton h-16 w-full rounded-lg" />
      </div>
    </div>
  )
}

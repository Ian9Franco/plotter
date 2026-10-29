'use client'

import { useEffect, useState } from 'react'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabase'
import DetailHero from '@/components/detail/DetailHero'
import WatchProvidersSection from '@/components/detail/WatchProviders'
import ReviewEditor from '@/components/review/ReviewEditor'
import TitleReviews from '@/components/review/TitleReviews'
import type { Review } from '@/lib/review/storage'
import type { TVDetails, Video, WatchProviders, WatchRegion } from '@/lib/tmdb/types'

interface TVDetailProps {
  show: TVDetails
  providers: WatchProviders | null
  region: WatchRegion | null
  trailer: Video | null
  reviews: Review[]
}

export default function TVDetail({ show, providers, region, trailer, reviews }: TVDetailProps) {
  const [showReview, setShowReview] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null))
  }, [])

  const ownsReview = Boolean(userId && reviews.some((review) => review.user_id === userId))

  return (
    <div className="min-h-full flex flex-col bg-[var(--plotter-black)]">
      <main className="page-content pt-0 flex-1 w-full pb-10">
        <DetailHero
          item={show}
          trailer={trailer}
          writeLabel={ownsReview ? 'Editar tu reseña' : 'Mi Reseña'}
          onWriteReview={() => {
            setShowReview(true)
            setTimeout(() => {
              document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }}
        />

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

        <WatchProvidersSection providers={providers} region={region} />
        <TitleReviews reviews={reviews} currentUserId={userId} />
        <div id="review-section">
          {showReview && <ReviewEditor item={show} />}
        </div>
      </main>
      <Footer />
    </div>
  )
}

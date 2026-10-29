'use client'

import { useState } from 'react'
import Footer from '@/components/layout/Footer'
import MovieHero from '@/components/detail/MovieHero'
import WatchProvidersSection from '@/components/detail/WatchProviders'
import ReviewEditor from '@/components/review/ReviewEditor'
import TitleReviews from '@/components/review/TitleReviews'
import type { Review } from '@/lib/review/storage'
import type { MovieDetails, Video, WatchProviders, WatchRegion } from '@/lib/tmdb/types'

interface MovieDetailProps {
  movie: MovieDetails
  providers: WatchProviders | null
  region: WatchRegion | null
  trailer: Video | null
  reviews: Review[]
}

export default function MovieDetail({ movie, providers, region, trailer, reviews }: MovieDetailProps) {
  const [showReview, setShowReview] = useState(false)

  return (
    <div className="min-h-full flex flex-col bg-[var(--plotter-black)]">
      <main className="page-content pt-0 flex-1 w-full pb-10">
        <MovieHero
          item={movie}
          trailer={trailer}
          onWriteReview={() => {
            setShowReview(true)
            setTimeout(() => {
              document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }}
        />
        <WatchProvidersSection providers={providers} region={region} />
        <TitleReviews reviews={reviews} />
        <div id="review-section">
          {showReview && <ReviewEditor item={movie} />}
        </div>
      </main>
      <Footer />
    </div>
  )
}

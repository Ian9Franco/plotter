'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/layout/Footer'
import MovieHero from '@/components/detail/MovieHero'
import WatchProvidersSection from '@/components/detail/WatchProviders'
import ReviewEditor from '@/components/review/ReviewEditor'
import { getMovieDetails, getMovieWatchProviders } from '@/lib/tmdb/movies'
import type { MovieDetails, WatchProviders } from '@/lib/tmdb/types'

interface MoviePageProps {
  params: { id: string }
}

export default function MoviePage({ params }: MoviePageProps) {
  const id = Number(params.id)

  const [movie,     setMovie]     = useState<MovieDetails | null>(null)
  const [providers, setProviders] = useState<WatchProviders | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [movieData, providersData] = await Promise.all([
          getMovieDetails(id),
          getMovieWatchProviders(id),
        ])
        setMovie(movieData)
        setProviders(providersData)
      } catch (err) {
        console.error('Error loading movie:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <DetailSkeleton />

  if (!movie) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--plotter-black)]">
        <p className="text-[var(--plotter-muted)]">Película no encontrada</p>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col bg-[var(--plotter-black)]">
      <main className="page-content pt-0 flex-1 w-full pb-10">
        <MovieHero
          item={movie}
          onWriteReview={() => {
            setShowReview(true)
            setTimeout(() => {
              document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }}
        />

        <WatchProvidersSection providers={providers} />

        {/* Review section */}
        <div id="review-section">
          {showReview && (
            <ReviewEditor item={movie} />
          )}
        </div>
      </main>

      <Footer />
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

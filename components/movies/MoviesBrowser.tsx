'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import PagedMediaCarousel from '@/components/media/PagedMediaCarousel'
import type { Movie } from '@/lib/tmdb/types'

interface MoviesBrowserProps {
  trending: Movie[]
  trendingPages: number
  nowPlaying: Movie[]
  nowPlayingPages: number
  upcoming: Movie[]
  upcomingPages: number
  featured: Movie | null
}

function MoviesBrowserContent({
  trending,
  trendingPages,
  nowPlaying,
  nowPlayingPages,
  upcoming,
  upcomingPages,
  featured,
}: MoviesBrowserProps) {
  const searchParams = useSearchParams()
  const selectedGenre = searchParams.get('genre') || 'Todo'

  const GENRE_MAP: Record<string, number> = {
    'Acción': 28,
    'Aventura': 12,
    'Comedia': 35,
    'Drama': 18,
    'Terror': 27,
    'Ciencia Ficción': 878,
  }

  const filteredMovies = selectedGenre === 'Todo'
    ? trending
    : trending.filter((movie) => movie.genre_ids?.includes(GENRE_MAP[selectedGenre]))

  return (
    <div className="min-h-full bg-[var(--plotter-black)] flex flex-col">
      <main className="page-content pt-24 max-w-[1400px] mx-auto w-full flex-1">
        {featured && selectedGenre === 'Todo' && (
          <div className="px-4 mb-6">
            <Link
              href={`/movie/${featured.id}`}
              className="relative block h-[220px] rounded-[var(--radius-xl)] overflow-hidden nm-raised-lg group"
            >
              {featured.backdrop_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w780${featured.backdrop_path}`}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1400px) 100vw, 1400px"
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060A12] via-black/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col gap-1">
                <span className="badge badge-movie self-start mb-1 shadow-sm uppercase text-[9px] tracking-wider font-bold">
                  Destacada hoy
                </span>
                <h2 className="text-white font-['Outfit'] font-bold text-lg leading-tight truncate">
                  {featured.title}
                </h2>
                <p className="text-white/60 text-xs line-clamp-1">
                  {featured.overview}
                </p>
              </div>
            </Link>
          </div>
        )}

        {selectedGenre === 'Todo' ? (
          <div className="space-y-4">
            <PagedMediaCarousel
              initialItems={trending}
              totalPages={trendingPages}
              title="Tendencias de la Semana"
              action="trending"
              type="movie"
              mode="released"
            />
            <PagedMediaCarousel
              initialItems={nowPlaying}
              totalPages={nowPlayingPages}
              title="En Cines Hoy"
              action="now-playing"
              mode="released"
            />
            <PagedMediaCarousel
              initialItems={upcoming}
              totalPages={upcomingPages}
              title="Próximamente"
              action="upcoming"
              mode="upcoming"
            />
          </div>
        ) : (
          <MediaGrid
            items={filteredMovies}
            title={`Películas de ${selectedGenre}`}
            columns={3}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function MoviesBrowser(props: MoviesBrowserProps) {
  return (
    <Suspense fallback={
      <div className="min-h-full bg-[var(--plotter-black)] flex items-center justify-center pt-32">
        <div className="spinner" />
      </div>
    }>
      <MoviesBrowserContent {...props} />
    </Suspense>
  )
}

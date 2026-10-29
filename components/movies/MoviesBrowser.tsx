'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import PagedMediaCarousel from '@/components/media/PagedMediaCarousel'
import { discoverMoviesPage } from '@/lib/tmdb/movies'
import { MOVIE_GENRE_MENU, genreIdByLabel } from '@/lib/tmdb/genres'
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
  const genreId = genreIdByLabel(MOVIE_GENRE_MENU, selectedGenre)
  const [genreMovies, setGenreMovies] = useState<Movie[]>([])
  const [genrePage, setGenrePage] = useState(1)
  const [genrePages, setGenrePages] = useState(1)
  const [genreStatus, setGenreStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle')
  const [genreAttempt, setGenreAttempt] = useState(0)

  useEffect(() => {
    if (selectedGenre === 'Todo' || genreId == null) return
    const controller = new AbortController()
    setGenreStatus('loading')
    setGenrePage(1)
    discoverMoviesPage(genreId, 1, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setGenreMovies(data.results)
        setGenrePages(data.total_pages)
        setGenreStatus(data.results.length === 0 ? 'empty' : 'ready')
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setGenreMovies([])
        setGenreStatus('error')
      })
    return () => controller.abort()
  }, [genreAttempt, genreId, selectedGenre])

  const loadMoreGenre = async () => {
    if (genreId == null || genrePage >= genrePages) return
    const next = genrePage + 1
    const data = await discoverMoviesPage(genreId, next)
    setGenreMovies((current) => {
      const seen = new Set(current.map((movie) => movie.id))
      return [...current, ...data.results.filter((movie) => !seen.has(movie.id))]
    })
    setGenrePage(next)
    setGenrePages(data.total_pages)
  }

  return (
    <div className="min-h-full bg-[var(--plotter-black)] flex flex-col">
      <main className="page-content pt-4 max-w-[1400px] mx-auto w-full flex-1">
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
        ) : genreStatus === 'error' ? (
          <div className="px-4 py-16 text-center">
            <p className="text-[var(--plotter-muted)] text-sm">No se pudieron cargar las películas de {selectedGenre}.</p>
            <button type="button" onClick={() => setGenreAttempt((value) => value + 1)} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--plotter-orange)' }}>
              Reintentar
            </button>
          </div>
        ) : genreStatus === 'empty' ? (
          <div className="px-4 py-16 text-center">
            <p className="text-[var(--plotter-muted)] text-sm">No hay películas de {selectedGenre} en este listado.</p>
            <Link href="/movies" className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--plotter-orange)' }}>
              Volver a Todo
            </Link>
          </div>
        ) : (
          <>
            <MediaGrid
              items={genreMovies}
              title={`Películas de ${selectedGenre}`}
              loading={genreStatus === 'loading'}
              columns={3}
            />
            {genreStatus === 'ready' && genrePage < genrePages && (
              <div className="flex justify-center py-8">
                <button type="button" onClick={loadMoreGenre} className="px-5 py-3 rounded-2xl text-sm font-bold text-[var(--plotter-white)] border border-white/10" style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}>
                  Cargar más
                </button>
              </div>
            )}
          </>
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

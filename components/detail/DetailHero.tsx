'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear, isMovie } from '@/lib/tmdb/types'
import { getMovieVideos } from '@/lib/tmdb/movies'
import { getTVVideos } from '@/lib/tmdb/tv'
import type { MovieDetails, TVDetails, Video } from '@/lib/tmdb/types'
import { Star, CalendarDays, Clock, Play, Award, Pencil, X, Film, Tv, Layers, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

interface DetailHeroProps {
  item: MovieDetails | TVDetails
  onWriteReview: () => void
}

export default function DetailHero({ item, onWriteReview }: DetailHeroProps) {
  const router = useRouter()
  const { useOriginal } = useLanguage()
  const title = getTitle(item, useOriginal)
  const year = getReleaseYear(item)
  const backdropUrl = getBackdropUrl(item.backdrop_path, 'w1280')
  const posterUrl = getPosterUrl(item.poster_path, 'w342')
  const movie = isMovie(item)

  const imdbId = movie
    ? (item as any).imdb_id
    : (item as any).external_ids?.imdb_id

  const [omdbRatings, setOmdbRatings] = useState<{
    rottenTomatoes: string | null
    imdb: string | null
    metacritic: string | null
  } | null>(null)
  const [omdbLoading, setOmdbLoading] = useState(false)
  const [trailer, setTrailer] = useState<Video | null>(null)
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false)

  useEffect(() => {
    async function loadTrailer() {
      try {
        const videos = movie ? await getMovieVideos(item.id) : await getTVVideos(item.id)
        if (videos && videos.length > 0) setTrailer(videos[0])
      } catch (e) { console.error(e) }
    }
    loadTrailer()
  }, [item.id, movie])

  useEffect(() => {
    if (!imdbId) return
    async function fetchOmdb() {
      setOmdbLoading(true)
      try {
        const res = await fetch(`/api/omdb?imdbId=${imdbId}`)
        if (res.ok) setOmdbRatings(await res.json())
      } catch (err) { console.error('Error loading OMDb ratings:', err) }
      finally { setOmdbLoading(false) }
    }
    fetchOmdb()
  }, [imdbId])

  const handleBack = () => {
    if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
      router.back()
    } else {
      router.push(movie ? '/movies' : '/tv')
    }
  }

  // Runtime / Seasons
  let runtime: string | null = null
  if (movie && (item as MovieDetails).runtime) {
    runtime = `${(item as MovieDetails).runtime!} mins`
  } else if (!movie) {
    const tv = item as TVDetails
    if (tv.number_of_seasons) runtime = `${tv.number_of_seasons} temp`
  }

  const genres = item.genres?.slice(0, 2).map(g => g.name) || []
  const ratingValue = item.vote_average || 7.0
  const voteCount = item.vote_count || 120
  const ratingPercent = Math.round((ratingValue / 10) * 100)

  // Bell-curve histogram
  const baseDistrib = [12, 18, 38, 55, 28]
  const peakIndex = Math.min(4, Math.max(0, Math.floor((ratingValue / 10) * 5)))
  const distribution = baseDistrib.map((val, idx) => {
    const distance = Math.abs(idx - peakIndex)
    return Math.max(6, Math.round(val / (distance + 1)))
  })

  const hasValidOmdb = omdbRatings && (
    (omdbRatings.imdb && omdbRatings.imdb !== 'N/A') ||
    (omdbRatings.rottenTomatoes && omdbRatings.rottenTomatoes !== 'N/A') ||
    (omdbRatings.metacritic && omdbRatings.metacritic !== 'N/A')
  )
  const showOmdbSection = imdbId && (omdbLoading || hasValidOmdb)

  // Shared pill style
  const nmPill: React.CSSProperties = {
    boxShadow: 'var(--nm-pill)',
    backgroundColor: 'var(--plotter-card)',
  }
  const nmInset: React.CSSProperties = {
    boxShadow: 'var(--nm-inset)',
    backgroundColor: 'var(--plotter-deep, var(--plotter-black))',
  }

  return (
    <div className="relative w-full bg-[var(--plotter-black)] text-[var(--plotter-white)] overflow-hidden pb-8">

      {/* ── Backdrop ── */}
      <div className="relative h-[48vh] w-full overflow-hidden shrink-0 bg-black">
        {isPlayingTrailer && trailer ? (
          <div className="w-full h-full relative z-30">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&controls=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
            <button
              onClick={() => setIsPlayingTrailer(false)}
              className="absolute top-4 right-4 z-40 bg-black/50 hover:bg-[var(--plotter-orange)] text-white rounded-full p-2 backdrop-blur-md transition-all border border-white/20"
              aria-label="Cerrar trailer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <>
            {backdropUrl ? (
              <>
                <img
                  src={backdropUrl}
                  alt={title}
                  className="w-full h-full object-cover object-top scale-105 filter brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--plotter-black)] via-[var(--plotter-black)]/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-10" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-950 via-slate-900 to-[var(--plotter-black)]" />
            )}

            {/* Play Trailer */}
            {trailer && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
                <button
                  onClick={() => setIsPlayingTrailer(true)}
                  className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-2xl group hover:scale-110"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  <Play className="w-6 h-6 ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                </button>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/70 select-none">Trailer</span>
              </div>
            )}

            {/* Write Review FAB */}
            <button
              onClick={onWriteReview}
              className="absolute bottom-5 right-5 z-[60] w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-95 transition-all hover:scale-110 cursor-pointer"
              style={{
                boxShadow: 'var(--nm-glow-orange)',
                backgroundColor: 'var(--plotter-orange)',
              }}
              aria-label="Escribir mi reseña"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* ── Title + Poster Grid ── */}
      <div className="relative px-5 -mt-36 z-20 flex gap-5 items-end">
        {/* Title block */}
        <div className="flex-1 min-w-0 pb-1">
          {item.tagline && (
            <p className="text-[var(--plotter-orange)] text-[10px] tracking-wider uppercase font-black mb-1.5 opacity-90 drop-shadow-md select-none">
              ✨ {item.tagline}
            </p>
          )}
          <h1 className="font-['Outfit'] font-black text-2xl md:text-3xl text-[var(--plotter-white)] leading-tight mb-3 pr-2 tracking-tight drop-shadow-lg">
            {title}
          </h1>

          {/* Neumorphic metadata pills */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-[var(--plotter-white)] cursor-default select-none hover:-translate-y-0.5 transition-transform" style={nmPill}>
              <CalendarDays className="w-3 h-3 text-[var(--plotter-orange)]" />
              {year}
            </div>
            {runtime && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-[var(--plotter-white)] cursor-default select-none hover:-translate-y-0.5 transition-transform" style={nmPill}>
                {movie ? <Clock className="w-3 h-3 text-[var(--plotter-orange)]" /> : <Layers className="w-3 h-3 text-[var(--plotter-orange)]" />}
                {runtime}
              </div>
            )}
            {genres.length > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-[var(--plotter-white)] cursor-default select-none hover:-translate-y-0.5 transition-transform" style={nmPill}>
                {movie ? <Film className="w-3 h-3 text-[var(--plotter-orange)]" /> : <Tv className="w-3 h-3 text-[var(--plotter-orange)]" />}
                {genres.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Poster — extruded neumorphic frame */}
        <div
          className="shrink-0 w-[100px] h-[150px] rounded-2xl overflow-hidden transition-all duration-500 active:scale-[0.98] hover:-translate-y-1"
          style={{
            boxShadow: '8px 8px 24px rgba(0,0,0,0.85), -4px -4px 16px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(255,255,255,0.08)',
          }}
        >
          <img
            src={posterUrl}
            alt={`Póster de ${title}`}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = '/placeholder-poster.svg' }}
          />
        </div>
      </div>

      {/* ── Info Panels ── */}
      <div className="px-5 mt-6 space-y-4">

        {/* Synopsis Panel */}
        {item.overview && (
          <div
            className="p-5 rounded-3xl transition-all duration-300"
            style={{ boxShadow: 'var(--nm-raised-lg)', backgroundColor: 'var(--plotter-card)' }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full mb-3" style={nmInset}>
              <span className="text-[var(--plotter-muted)] text-[9px] uppercase tracking-[0.2em] font-black">Sinopsis</span>
            </div>
            <p className="text-[var(--plotter-white)]/85 text-[13px] leading-relaxed font-light">
              {item.overview}
            </p>
          </div>
        )}

        {/* Community Score Panel */}
        <div
          className="relative p-5 rounded-3xl overflow-hidden transition-all duration-300"
          style={{ boxShadow: 'var(--nm-raised-lg)', backgroundColor: 'var(--plotter-card)' }}
        >
          {/* Ambient bottom glow */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-10 rounded-full opacity-20 blur-2xl pointer-events-none"
            style={{ backgroundColor: 'var(--plotter-orange)' }}
          />

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-1.5" style={nmInset}>
                <TrendingUp className="w-3 h-3 text-[var(--plotter-orange)]" />
                <span className="text-[var(--plotter-muted)] text-[9px] uppercase tracking-[0.18em] font-black">Comunidad TMDB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[var(--plotter-orange)] fill-[var(--plotter-orange)]" />
                <span className="text-[var(--plotter-white)] font-['Outfit'] font-black text-xl">{ratingValue.toFixed(1)}</span>
                <span className="text-[var(--plotter-muted)] text-sm font-medium">/ 10</span>
                <span className="text-[var(--plotter-muted)] text-xs ml-1">({voteCount.toLocaleString()} votos)</span>
              </div>
            </div>

            {/* Score circle */}
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                boxShadow: 'var(--nm-inset)',
                backgroundColor: 'var(--plotter-deep, var(--plotter-black))',
              }}
            >
              <span className="font-['Outfit'] font-black text-lg text-[var(--plotter-white)]">{ratingValue.toFixed(1)}</span>
              {/* Circular progress arc using conic-gradient */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `conic-gradient(var(--plotter-orange) ${ratingPercent * 3.6}deg, transparent ${ratingPercent * 3.6}deg)`,
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
                  opacity: 0.85,
                }}
              />
            </div>
          </div>

          {/* Histogram bars */}
          <div
            className="flex items-end justify-between h-12 px-2 py-1 rounded-2xl gap-1.5"
            style={nmInset}
          >
            {distribution.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t-sm transition-all duration-700"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === peakIndex ? 'var(--plotter-orange)' : 'rgba(107,126,158,0.25)',
                    boxShadow: i === peakIndex ? '0 0 8px rgba(244,98,42,0.5)' : 'none',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[8px] font-bold text-[var(--plotter-muted)] px-2 mt-1.5 uppercase tracking-wider">
            <span>Pésima</span><span>Regular</span><span>Buena</span><span>Excelente</span>
          </div>
        </div>

        {/* OMDb Ratings Panel */}
        {showOmdbSection && (
          <div
            className="p-5 rounded-3xl transition-all duration-300"
            style={{ boxShadow: 'var(--nm-raised-lg)', backgroundColor: 'var(--plotter-card)' }}
          >
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-4" style={nmInset}>
              <Award className="w-3 h-3 text-[var(--plotter-orange)]" />
              <span className="text-[var(--plotter-muted)] text-[9px] uppercase tracking-[0.18em] font-black">Crítica Especializada</span>
            </div>

            {omdbLoading ? (
              <div className="flex gap-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex-1 h-14 rounded-2xl animate-pulse" style={nmInset} />
                ))}
              </div>
            ) : (
              <div className="flex gap-3">
                {/* IMDb */}
                {omdbRatings?.imdb && omdbRatings.imdb !== 'N/A' && (
                  <div
                    className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl cursor-default hover:-translate-y-0.5 transition-transform duration-300"
                    style={nmInset}
                  >
                    <div className="flex items-center bg-[#F5C518] text-black font-extrabold text-[9px] px-1.5 py-[2px] rounded tracking-tight shadow-sm select-none mb-2">
                      IMDb
                    </div>
                    <span className="text-[var(--plotter-white)] text-sm font-black font-['Outfit']">
                      {omdbRatings.imdb}
                    </span>
                  </div>
                )}
                {/* Rotten Tomatoes */}
                {omdbRatings?.rottenTomatoes && omdbRatings.rottenTomatoes !== 'N/A' && (
                  <div
                    className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl cursor-default hover:-translate-y-0.5 transition-transform duration-300"
                    style={nmInset}
                  >
                    <div className="flex items-center gap-1 select-none mb-2">
                      <span className="text-xs">🍅</span>
                      <span className="text-[var(--plotter-white)] font-bold text-[9px] uppercase tracking-wider">Rotten</span>
                    </div>
                    <span className="text-[var(--plotter-white)] text-sm font-black font-['Outfit']">
                      {omdbRatings.rottenTomatoes}
                    </span>
                  </div>
                )}
                {/* Metacritic */}
                {omdbRatings?.metacritic && omdbRatings.metacritic !== 'N/A' && (
                  <div
                    className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl cursor-default hover:-translate-y-0.5 transition-transform duration-300"
                    style={nmInset}
                  >
                    <div className="flex items-center gap-1 select-none mb-2">
                      <div className="bg-[#66CC33] text-white font-extrabold text-[9px] px-1.5 py-[2px] rounded leading-none">M</div>
                      <span className="text-[var(--plotter-white)] font-bold text-[9px] uppercase tracking-wider">Metascore</span>
                    </div>
                    <span className="text-[var(--plotter-white)] text-sm font-black font-['Outfit']">
                      {omdbRatings.metacritic}/100
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

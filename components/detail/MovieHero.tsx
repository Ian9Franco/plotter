'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb/client'
import { getMovieVideos } from '@/lib/tmdb/movies'
import type { MovieDetails, Video } from '@/lib/tmdb/types'
import { Star, Clock, Play, Pencil, Film, CalendarDays, X, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

interface MovieHeroProps {
  item: MovieDetails
  onWriteReview: () => void
}

export default function MovieHero({ item, onWriteReview }: MovieHeroProps) {
  const router = useRouter()
  const { useOriginal } = useLanguage()
  const title = useOriginal ? (item.original_title || item.title || '') : (item.title || item.original_title || '')
  const year = item.release_date ? item.release_date.substring(0, 4) : ''
  const backdropUrl = getBackdropUrl(item.backdrop_path, 'w1280')
  const posterUrl = getPosterUrl(item.poster_path, 'w342')
  const runtime = item.runtime ? `${item.runtime} min` : null
  const genres = item.genres?.slice(0, 3).map(g => g.name) || []

  const ratingValue = item.vote_average || 0
  const voteCount = item.vote_count || 0
  const ratingPercent = Math.round((ratingValue / 10) * 100)

  const [trailer, setTrailer] = useState<Video | null>(null)
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false)

  useEffect(() => {
    async function loadTrailer() {
      try {
        const videos = await getMovieVideos(item.id)
        if (videos && videos.length > 0) setTrailer(videos[0])
      } catch (e) { console.error(e) }
    }
    loadTrailer()
  }, [item.id])

  return (
    <div className="relative w-full text-[var(--plotter-white)] overflow-hidden pb-10">

      {/* ── Cinematic Backdrop ── */}
      <div className="relative h-[60vh] w-full shrink-0 bg-[#050810]">
        {isPlayingTrailer && trailer ? (
          <div className="w-full h-full relative z-30 bg-black">
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
                  className="w-full h-full object-cover object-top opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--plotter-black)] via-[var(--plotter-black)]/50 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--plotter-black)]/80 via-transparent to-transparent z-10" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-[var(--plotter-black)]" />
            )}

            {/* Play Trailer Button */}
            {trailer && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
                <button
                  onClick={() => setIsPlayingTrailer(true)}
                  className="w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-2xl group"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 0 rgba(244,98,42,0)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 40px rgba(244,98,42,0.5), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 60px rgba(244,98,42,0.2)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,98,42,0.85)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(244,98,42,0.6)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)' }}
                >
                  <Play className="w-7 h-7 ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                </button>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70 drop-shadow-md">Ver Trailer</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Content Container ── */}
      <div className="relative px-5 -mt-24 z-20">

        {/* Title + Tagline */}
        <div className="flex flex-col mb-6">
          {item.tagline && (
            <p className="text-[var(--plotter-orange)] text-xs tracking-[0.18em] uppercase font-black mb-2 opacity-90 drop-shadow-md">
              {item.tagline}
            </p>
          )}
          <h1 className="font-['Outfit'] font-black text-4xl md:text-5xl text-[var(--plotter-white)] leading-[1.1] mb-5 tracking-tight drop-shadow-xl max-w-3xl">
            {title}
          </h1>

          {/* ── Neumorphic Metadata Pills ── */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Year pill */}
            <div
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[var(--plotter-white)] cursor-default select-none transition-all duration-300 hover:-translate-y-0.5"
              style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[var(--plotter-orange)]" />
              {year}
            </div>

            {/* Runtime pill */}
            {runtime && (
              <div
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[var(--plotter-white)] cursor-default select-none transition-all duration-300 hover:-translate-y-0.5"
                style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
              >
                <Clock className="w-3.5 h-3.5 text-[var(--plotter-orange)]" />
                {runtime}
              </div>
            )}

            {/* Genres pill */}
            {genres.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[var(--plotter-white)] cursor-default select-none transition-all duration-300 hover:-translate-y-0.5"
                style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
              >
                <Film className="w-3.5 h-3.5 text-[var(--plotter-orange)]" />
                {genres.join(', ')}
              </div>
            )}

            {/* Write Review — glowing orange pill */}
            <button
              id="movie-write-review-btn-inline"
              onClick={onWriteReview}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white cursor-pointer select-none transition-all duration-300 active:scale-95 hover:-translate-y-0.5"
              style={{
                boxShadow: 'var(--nm-glow-orange)',
                backgroundColor: 'var(--plotter-orange)',
              }}
              aria-label="Escribir mi reseña"
            >
              <Pencil className="w-3.5 h-3.5" fill="currentColor" />
              <span className="hidden sm:inline">Mi Reseña</span>
            </button>
          </div>
        </div>

        {/* ── Main Panels Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Sinopsis Panel — raised neumorphic card */}
          <div
            className="md:col-span-2 p-5 rounded-3xl flex gap-5 items-start transition-all duration-300"
            style={{ boxShadow: 'var(--nm-raised-lg)', backgroundColor: 'var(--plotter-card)' }}
          >
            <div className="flex-1 min-w-0">
              {/* Inset label well */}
              <div
                className="inline-flex items-center px-3 py-1 rounded-full mb-3"
                style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
              >
                <span className="text-[var(--plotter-muted)] text-[9px] uppercase tracking-[0.2em] font-black">Sinopsis</span>
              </div>
              <p className="text-[var(--plotter-white)]/85 text-sm md:text-[15px] leading-relaxed font-light">
                {item.overview || 'No hay sinopsis disponible.'}
              </p>
            </div>

            {/* Poster — extruded neumorphic frame */}
            <div
              className="shrink-0 w-[95px] md:w-[120px] aspect-[2/3] rounded-2xl overflow-hidden group transition-all duration-500 hover:-translate-y-1"
              style={{
                boxShadow: '8px 8px 20px rgba(0,0,0,0.7), -4px -4px 14px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.08)',
              }}
            >
              <img
                src={posterUrl}
                alt={`Póster de ${title}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={e => { (e.target as HTMLImageElement).src = '/placeholder-poster.svg' }}
              />
            </div>
          </div>

          {/* Score Panel — glowing neumorphic card */}
          <div
            className="relative p-5 rounded-3xl flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-300 group hover:-translate-y-1"
            style={{ boxShadow: 'var(--nm-glow-orange)', backgroundColor: 'var(--plotter-card)' }}
          >
            {/* Ambient orange bottom glow */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-12 rounded-full opacity-30 blur-2xl pointer-events-none"
              style={{ backgroundColor: 'var(--plotter-orange)' }}
            />

            {/* Inset label */}
            <div
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-4"
              style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
            >
              <TrendingUp className="w-3 h-3 text-[var(--plotter-orange)]" />
              <span className="text-[var(--plotter-muted)] text-[9px] uppercase tracking-[0.18em] font-black">TMDB Score</span>
            </div>

            {/* Score */}
            <div className="flex items-end gap-1 mb-2">
              <span className="font-['Outfit'] font-black text-5xl text-[var(--plotter-white)] leading-none drop-shadow-xl">
                {ratingValue.toFixed(1)}
              </span>
              <span className="text-[var(--plotter-muted)] text-lg font-bold mb-1">/10</span>
            </div>

            {/* Rating bar */}
            <div
              className="w-full h-2 rounded-full overflow-hidden mb-3"
              style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${ratingPercent}%`,
                  background: 'linear-gradient(90deg, var(--plotter-orange), #FFB347)',
                  boxShadow: '0 0 8px rgba(244,98,42,0.6)',
                }}
              />
            </div>

            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[var(--plotter-orange)] fill-[var(--plotter-orange)]" />
              <span className="text-[var(--plotter-muted)] text-[11px] font-medium">
                {voteCount.toLocaleString()} votos
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

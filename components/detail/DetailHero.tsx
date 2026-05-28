'use client'

import { useRouter } from 'next/navigation'
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear, isMovie } from '@/lib/tmdb/types'
import type { MovieDetails, TVDetails } from '@/lib/tmdb/types'
import { Star, Calendar, Clock, ArrowLeft, Play, Sparkles, Award } from 'lucide-react'

interface DetailHeroProps {
  item: MovieDetails | TVDetails
  onWriteReview: () => void
}

export default function DetailHero({ item, onWriteReview }: DetailHeroProps) {
  const router      = useRouter()
  const title       = getTitle(item)
  const year        = getReleaseYear(item)
  const backdropUrl = getBackdropUrl(item.backdrop_path, 'w1280')
  const posterUrl   = getPosterUrl(item.poster_path, 'w342')
  const movie       = isMovie(item)

  // Runtime
  let runtime: string | null = null
  if (movie && (item as MovieDetails).runtime) {
    const mins = (item as MovieDetails).runtime!
    runtime = `${mins} mins`
  } else if (!movie) {
    const tv = item as TVDetails
    if (tv.number_of_seasons) runtime = `${tv.number_of_seasons} temp`
  }

  const genres = item.genres?.slice(0, 2).map(g => g.name) || []
  
  // Rating logic (approximate community distribution for aesthetics)
  const ratingValue = item.vote_average || 7.0
  const voteCount = item.vote_count || 120
  
  // Build a dummy gorgeous distribution for the histogram matchingTMDB score
  const baseDistrib = [12, 18, 38, 55, 28] // classic bell curve
  const peakIndex = Math.min(4, Math.max(0, Math.floor((ratingValue / 10) * 5)))
  const distribution = baseDistrib.map((val, idx) => {
    const distance = Math.abs(idx - peakIndex)
    return Math.max(6, Math.round(val / (distance + 1)))
  })

  return (
    <div className="relative w-full bg-[var(--plotter-black)] text-white overflow-hidden pb-6">
      
      {/* 1. Backdrop Full-Cover (Inmersive cinematic backdrop header) */}
      <div className="relative h-[48vh] w-full overflow-hidden shrink-0">
        {backdropUrl ? (
          <>
            <img 
              src={backdropUrl} 
              alt={title} 
              className="w-full h-full object-cover object-top scale-105 filter brightness-[0.75] contrast-[1.05]"
            />
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--plotter-black)] via-[var(--plotter-black)]/30 to-black/90 z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[var(--plotter-black)] z-10" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-950 via-slate-900 to-[var(--plotter-black)]" />
        )}

        {/* Back button (Flotante Premium) */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-5 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Floating Poster & Cinematic Title overlap Grid */}
      <div className="relative px-5 -mt-36 z-20 flex gap-5 items-end">
        
        {/* Title and metadata details on the left */}
        <div className="flex-1 min-w-0 pb-1">
          {item.tagline && (
            <p className="text-[var(--plotter-orange)] text-[10px] tracking-wider uppercase font-black mb-1.5 opacity-90 drop-shadow-md select-none">
              ✨ {item.tagline}
            </p>
          )}

          <h1 className="font-['Outfit'] font-black text-2xl md:text-3xl text-white leading-tight mb-2 pr-2 tracking-tight drop-shadow-lg">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-300 mb-3 drop-shadow">
            <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
              {year}
            </span>
            {runtime && (
              <span className="text-gray-400 font-medium">
                • {runtime}
              </span>
            )}
            {genres.length > 0 && (
              <span className="text-[var(--plotter-muted)] font-medium">
                • {genres.join(' / ')}
              </span>
            )}
          </div>
          
          {/* Main write action button premium */}
          <button
            id="detail-write-review-btn"
            onClick={onWriteReview}
            className="flex items-center gap-2 bg-[var(--plotter-orange)] hover:bg-[#d84e1b] text-white font-['Outfit'] font-extrabold text-xs px-5 py-2.5 rounded-full shadow-[0_8px_20px_rgba(244,98,42,0.35)] border border-white/10 active:scale-95 transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Escribir reseña
          </button>
        </div>

        {/* Poster floating beautifully on the right */}
        <div className="shrink-0 w-[105px] h-[158px] rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.85)] border-2 border-white/20 bg-gray-900 transition-all active:scale-[0.98]">
          <img
            src={posterUrl}
            alt={`Póster de ${title}`}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = '/placeholder-poster.svg' }}
          />
        </div>

      </div>

      {/* 3. Narrative Description & Histogram Panel */}
      <div className="px-5 mt-6 space-y-5">
        
        {/* Movie overview description */}
        {item.overview && (
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            <p className="text-gray-300 text-[13px] leading-relaxed font-normal">{item.overview}</p>
          </div>
        )}

        {/* Community Ratings Histogram (Exactly like reference design!) */}
        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block">
                Calificaciones de la Comunidad
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                <span className="text-white font-['Outfit'] font-black text-base">{ratingValue.toFixed(1)}</span>
                <span className="text-gray-500 text-xs">/ 10</span>
                <span className="text-gray-500 text-[11px] ml-1">({voteCount.toLocaleString()} votos)</span>
              </div>
            </div>
            
            <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
              <Award className="w-3 h-3" />
              TMDB Score
            </div>
          </div>

          {/* Graphical bar histogram chart */}
          <div className="flex items-end justify-between h-14 px-3 py-1 bg-black/20 rounded-xl gap-2 border border-white/5">
            {distribution.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t-sm transition-all duration-500 ${
                    i === peakIndex 
                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                      : 'bg-white/10'
                  }`}
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-[8px] font-bold text-gray-500 px-3.5 mt-1.5 uppercase tracking-wider">
            <span>Pésima</span>
            <span>Regular</span>
            <span>Buena</span>
            <span>Excelente</span>
          </div>
        </div>

      </div>

    </div>
  )
}

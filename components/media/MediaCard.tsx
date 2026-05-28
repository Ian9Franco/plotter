'use client'

import { useRouter } from 'next/navigation'
import { getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear, isMovie } from '@/lib/tmdb/types'
import type { MediaItem } from '@/lib/tmdb/types'
import { Film, Tv } from 'lucide-react'

interface MediaCardProps {
  item: MediaItem
  priority?: boolean
}

export default function MediaCard({ item, priority = false }: MediaCardProps) {
  const router    = useRouter()
  const title     = getTitle(item)
  const year      = getReleaseYear(item)
  const posterUrl = getPosterUrl(item.poster_path, 'w342')
  const type      = isMovie(item) ? 'movie' : 'tv'
  const rating    = item.vote_average.toFixed(1)

  const overview  = item.overview ? item.overview.slice(0, 80) + '...' : ''

  const handleClick = () => {
    router.push(`/${type}/${item.id}`)
  }

  return (
    <article
      id={`media-card-${type}-${item.id}`}
      className="group cursor-pointer relative transition-all duration-500 hover:-translate-y-2 focus:outline-none"
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      tabIndex={0}
      role="button"
      aria-label={`Ver ${title}`}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-[#0A0F1A] rounded-[20px] border border-white/[0.04] shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(244,98,42,0.15)] group-hover:border-white/[0.08]">
        {/* Poster image */}
        <img
          src={posterUrl}
          alt={`Póster de ${title}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading={priority ? 'eager' : 'lazy'}
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-poster.svg' }}
        />

        {/* Permanent dark gradient for immersive text readability */}
        <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#04080F] via-[#04080F]/80 to-transparent pointer-events-none transition-opacity duration-500 group-hover:from-[#020408] group-hover:via-[#020408]/90" />

        {/* Type badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10 transition-transform duration-500 group-hover:-translate-y-1">
          <span className={`badge ${type === 'movie' ? 'badge-movie bg-[#0A0F1A]/60 backdrop-blur-md' : 'badge-tv bg-[#0A0F1A]/60 backdrop-blur-md'}`}>
            {type === 'movie'
              ? <><Film className="w-2.5 h-2.5" /> Peli</>
              : <><Tv  className="w-2.5 h-2.5" /> Serie</>
            }
          </span>
        </div>

        {/* Premium Content (Bottom pinned) */}
        <div className="absolute bottom-0 inset-x-0 p-3.5 z-20 flex flex-col justify-end">
          
          {/* Metadata (Rating & Year) */}
          <div className="flex items-center gap-2 mb-2 transition-transform duration-500 group-hover:-translate-y-0.5">
            {/* IMDb style badge */}
            <div className="flex items-center bg-[#F5C518] rounded px-1.5 py-[2px] shadow-sm">
              <span className="text-black font-black text-[9px] tracking-tight">IMDb</span>
              <span className="text-black font-bold text-[10px] ml-1">{rating}</span>
            </div>
            <span className="text-[var(--plotter-muted)] text-[11px] font-semibold">{year}</span>
          </div>

          {/* Title */}
          <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-2 font-['Outfit'] drop-shadow-md transition-transform duration-500 group-hover:-translate-y-0.5">
            {title}
          </h3>

          {/* Hover Overview */}
          {overview && (
            <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-out">
              <div className="overflow-hidden">
                <p className="text-white/70 text-[10px] leading-relaxed line-clamp-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  {overview}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

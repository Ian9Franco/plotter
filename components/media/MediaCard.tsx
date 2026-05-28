'use client'

import { useRouter } from 'next/navigation'
import { getPosterUrl } from '@/lib/tmdb/client'
import { getTitle, getReleaseYear, isMovie } from '@/lib/tmdb/types'
import type { MediaItem } from '@/lib/tmdb/types'
import { Star, Film, Tv } from 'lucide-react'

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
      className="nm-card group overflow-hidden cursor-pointer relative transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_40px_rgba(244,98,42,0.15)]"
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      tabIndex={0}
      role="button"
      aria-label={`Ver ${title}`}
    >
      {/* Poster image */}
      <div className="aspect-[2/3] relative overflow-hidden bg-[var(--plotter-card)] rounded-[var(--radius-lg)]">
        <img
          src={posterUrl}
          alt={`Póster de ${title}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading={priority ? 'eager' : 'lazy'}
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder-poster.svg' }}
        />

        {/* Hover glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060A12]/90 via-[#060A12]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Type badge */}
        <div className="absolute top-2 left-2 z-10 transition-transform duration-500 group-hover:-translate-y-1">
          <span className={`badge ${type === 'movie' ? 'badge-movie shadow-md' : 'badge-tv shadow-md'}`}>
            {type === 'movie'
              ? <><Film className="w-2.5 h-2.5" /> Peli</>
              : <><Tv  className="w-2.5 h-2.5" /> Serie</>
            }
          </span>
        </div>

        {/* Rating */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-full px-2 py-1 shadow-md transition-transform duration-500 group-hover:-translate-y-1">
          <Star className="w-2.5 h-2.5 text-[var(--plotter-orange)] fill-current" />
          <span className="text-[10px] font-bold text-white">{rating}</span>
        </div>

        {/* Richer Hover info */}
        <div className="absolute bottom-0 inset-x-0 p-4 z-20 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out flex flex-col gap-1.5">
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 font-['Outfit'] drop-shadow-md">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--plotter-orange)] font-medium">
            <span>{year}</span>
          </div>
          {overview && (
            <p className="text-white/70 text-[10px] leading-relaxed line-clamp-3 mt-1">
              {overview}
            </p>
          )}
        </div>
      </div>

      {/* Card footer (Hidden on hover to let the inside info shine) */}
      <div className="px-3 pt-3 pb-4 transition-opacity duration-300 group-hover:opacity-0">
        <p className="text-white text-xs font-bold truncate leading-tight font-['Outfit']">{title}</p>
        <p className="text-[var(--plotter-subtle)] text-[10px] mt-1 font-medium">{year}</p>
      </div>
    </article>
  )
}

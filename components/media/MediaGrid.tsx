import MediaCard from './MediaCard'
import type { MediaItem } from '@/lib/tmdb/types'

interface MediaGridProps {
  items: MediaItem[]
  title?: string
  loading?: boolean
  columns?: 3 | 4
}

const SKELETON_COUNT = 12

export default function MediaGrid({ items, title, loading = false, columns = 3 }: MediaGridProps) {
  const gridClass = columns === 4
    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4'
    : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4'

  if (loading) {
    return (
      <section className="px-4">
        {title && (
          <div className="skeleton h-6 w-32 mb-4 rounded-lg" />
        )}
        <div className={gridClass}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-lg)] overflow-hidden">
              <div className="skeleton aspect-[2/3]" />
              <div className="p-2 space-y-1.5">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-2.5 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!items.length) {
    return (
      <section className="px-4 py-12 text-center">
        <p className="text-[var(--plotter-muted)] text-sm">No se encontraron resultados</p>
      </section>
    )
  }

  return (
    <section className="px-4">
      {title && (
        <h2 className="section-title mb-4">{title}</h2>
      )}
      <div className={gridClass}>
        {items.map((item, i) => (
          <MediaCard key={`${item.id}-${'title' in item ? 'movie' : 'tv'}`} item={item} priority={i < 6} />
        ))}
      </div>
    </section>
  )
}

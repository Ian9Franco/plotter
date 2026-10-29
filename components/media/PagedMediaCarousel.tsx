'use client'

import { useCallback, useRef, useState } from 'react'
import MediaCarousel from './MediaCarousel'
import { apiFetch } from '@/lib/tmdb/client'
import type { MediaItem, Paged } from '@/lib/tmdb/types'

interface PagedMediaCarouselProps {
  initialItems: MediaItem[]
  totalPages: number
  title: string
  variant?: 'default' | 'wide'
  action: string
  type?: string
  mode?: 'released' | 'upcoming'
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function keepItem(item: MediaItem, mode?: 'released' | 'upcoming') {
  if (!mode) return true
  const date = 'release_date' in item ? item.release_date : item.first_air_date
  const today = todayISO()
  if (mode === 'upcoming') return Boolean(date && date > today)
  return !date || date <= today
}

export default function PagedMediaCarousel({
  initialItems,
  totalPages,
  title,
  variant = 'default',
  action,
  type,
  mode,
}: PagedMediaCarouselProps) {
  const [items, setItems] = useState(initialItems)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(totalPages)
  const requested = useRef(new Set<number>([1]))

  const loadNext = useCallback(async () => {
    const next = page + 1
    if (next > pages || requested.current.has(next)) return
    requested.current.add(next)
    try {
      const data = await apiFetch<Paged<MediaItem>>(action, {
        ...(type ? { type } : {}),
        page: next,
      })
      setPages(data.total_pages || pages)
      const extra = data.results.filter((item) => keepItem(item, mode))
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id))
        return [...prev, ...extra.filter((item) => !seen.has(item.id))]
      })
      setPage(next)
    } catch (err) {
      requested.current.delete(next)
      console.error('Error loading the next catalog page:', err)
    }
  }, [action, mode, page, pages, type])

  return (
    <MediaCarousel
      items={items}
      title={title}
      variant={variant}
      hasMore={page < pages}
      onNearEnd={loadNext}
    />
  )
}

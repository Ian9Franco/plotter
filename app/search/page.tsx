'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import { searchMoviesPage } from '@/lib/tmdb/movies'
import { searchTVPage } from '@/lib/tmdb/tv'
import { searchAllPage } from '@/lib/tmdb/combined'
import type { MediaItem, Paged } from '@/lib/tmdb/types'
import { ArrowLeft, Film, Tv, Layers } from 'lucide-react'

type Filter = 'all' | 'movie' | 'tv'

const FILTER_TABS: { id: Filter; label: string; Icon: typeof Layers }[] = [
  { id: 'all',   label: 'Todo',      Icon: Layers },
  { id: 'movie', label: 'Películas', Icon: Film   },
  { id: 'tv',    label: 'Series',    Icon: Tv     },
]

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError'
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('q') || ''

  const [filter, setFilter] = useState<Filter>('all')
  const [results, setResults] = useState<MediaItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(Boolean(queryParam.trim()))
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!queryParam.trim()) return
    const controller = new AbortController()

    async function doSearch() {
      setLoading(true)
      setError(false)
      setPage(1)
      try {
        const data = await fetchPage(queryParam, filter, 1, controller.signal)
        if (controller.signal.aborted) return
        setResults(data.results)
        setTotalPages(data.total_pages)
      } catch (err) {
        if (isAbort(err)) return
        setResults([])
        setError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    doSearch()
    return () => controller.abort()
  }, [queryParam, filter, attempt])

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return
    const next = page + 1
    setLoadingMore(true)
    try {
      const data = await fetchPage(queryParam, filter, next)
      setResults((current) => {
        const seen = new Set(current.map((item) => `${'title' in item ? 'movie' : 'tv'}-${item.id}`))
        return [...current, ...data.results.filter((item) => !seen.has(`${'title' in item ? 'movie' : 'tv'}-${item.id}`))]
      })
      setPage(next)
      setTotalPages(data.total_pages)
    } catch {
      setError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--plotter-black)]">
      <main className="page-content pt-4">
        <div className="px-4 mb-5 mt-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border-2 border-[var(--plotter-border)] flex items-center justify-center text-[var(--plotter-muted)] bg-[var(--plotter-card)] hover:text-[var(--plotter-orange)] hover:border-[var(--plotter-orange)] shadow-sm transition-all"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[var(--plotter-text)] font-['Outfit'] font-black text-2xl leading-tight">
              {queryParam ? `«${queryParam}»` : 'Búsqueda'}
            </h1>
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="flex gap-2">
            {FILTER_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`search-filter-${id}`}
                onClick={() => setFilter(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 shadow-sm ${
                  filter === id
                    ? 'bg-[var(--plotter-orange)] text-white border-[var(--plotter-orange)]'
                    : 'bg-[var(--plotter-card)] text-[var(--plotter-text)] border-[var(--plotter-border)] hover:border-[var(--plotter-orange)] hover:text-[var(--plotter-orange)]'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {!queryParam ? (
          <div className="px-4 py-16 text-center">
            <p className="text-[var(--plotter-muted)] text-sm">Escribí algo para buscar</p>
          </div>
        ) : loading ? (
          <MediaGrid items={[]} loading columns={3} />
        ) : error ? (
          <div className="px-4 py-16 text-center">
            <p className="text-[var(--plotter-muted)] text-sm">No se pudo buscar.</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--plotter-orange)' }}
            >
              Reintentar
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-[var(--plotter-muted)] text-sm">Nada con «{queryParam}»</p>
          </div>
        ) : (
          <>
            <MediaGrid items={results} columns={3} />
            {page < totalPages && (
              <div className="flex justify-center py-8">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-5 py-3 rounded-2xl text-sm font-bold text-[var(--plotter-white)] border border-white/10"
                  style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
                >
                  {loadingMore ? 'Cargando…' : 'Cargar más'}
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

function fetchPage(query: string, filter: Filter, page: number, signal?: AbortSignal): Promise<Paged<MediaItem>> {
  if (filter === 'movie') return searchMoviesPage(query, page, signal)
  if (filter === 'tv') return searchTVPage(query, page, signal)
  return searchAllPage(query, page, signal)
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}

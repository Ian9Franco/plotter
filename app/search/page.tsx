'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Footer from '@/components/layout/Footer'
import MediaGrid from '@/components/media/MediaGrid'
import { searchMovies } from '@/lib/tmdb/movies'
import { searchTV } from '@/lib/tmdb/tv'
import { searchAll } from '@/lib/tmdb/combined'
import type { MediaItem } from '@/lib/tmdb/types'
import { ArrowLeft, Film, Tv, Layers } from 'lucide-react'

type Filter = 'all' | 'movie' | 'tv'

const FILTER_TABS: { id: Filter; label: string; Icon: any }[] = [
  { id: 'all',   label: 'Todo',      Icon: Layers },
  { id: 'movie', label: 'Películas', Icon: Film   },
  { id: 'tv',    label: 'Series',    Icon: Tv     },
]

function SearchContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const queryParam   = searchParams.get('q') || ''

  const [filter,  setFilter]  = useState<Filter>('all')
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState('')

  useEffect(() => {
    if (!queryParam.trim()) return
    const controller = new AbortController()

    async function doSearch() {
      setLoading(true)
      setSearched(queryParam)
      try {
        let data: MediaItem[]
        if (filter === 'movie')  data = await searchMovies(queryParam)
        else if (filter === 'tv') data = await searchTV(queryParam)
        else                      data = await searchAll(queryParam)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    doSearch()
    return () => controller.abort()
  }, [queryParam, filter])

  return (
    <div className="min-h-dvh bg-[var(--plotter-black)]">
      <main className="page-content pt-16">
        {/* Back + title */}
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
              {queryParam ? `"${queryParam}"` : 'Búsqueda'}
            </h1>
            {!loading && searched && (
              <p className="text-[var(--plotter-muted)] text-xs">
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Filter tabs */}
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

        {/* Results grid */}
        {queryParam ? (
          <MediaGrid items={results} loading={loading} columns={3} />
        ) : (
          <div className="px-4 py-16 text-center">
            <p className="text-[var(--plotter-muted)] text-sm">Escribí algo para buscar</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}

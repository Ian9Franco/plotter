'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { searchAllPage } from '@/lib/tmdb/combined'
import { getPosterUrl } from '@/lib/tmdb/client'
import { getReleaseYear, getTitle, isMovie } from '@/lib/tmdb/types'
import type { MediaItem } from '@/lib/tmdb/types'

interface TitleSuggestProps {
  query: string
  onNavigate?: () => void
}

type Status = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError'
}

export default function TitleSuggest({ query, onNavigate }: TitleSuggestProps) {
  const [results, setResults] = useState<MediaItem[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [attempt, setAttempt] = useState(0)
  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([])
      setStatus('idle')
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setStatus('loading')
      try {
        const page = await searchAllPage(trimmed, 1, controller.signal)
        if (controller.signal.aborted) return
        const next = page.results.slice(0, 6)
        setResults(next)
        setStatus(next.length === 0 ? 'empty' : 'ready')
      } catch (err) {
        if (isAbort(err)) return
        setResults([])
        setStatus('error')
      }
    }, 200)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, attempt])

  if (trimmed.length < 2) return null

  return (
    <div className="mt-2 rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}>
      {status === 'loading' && (
        <p className="px-4 py-3 text-xs text-[var(--plotter-muted)]">Buscando…</p>
      )}
      {status === 'empty' && (
        <p className="px-4 py-3 text-xs text-[var(--plotter-muted)]">Nada con «{trimmed}»</p>
      )}
      {status === 'error' && (
        <p className="px-4 py-3 text-xs text-[var(--plotter-muted)]">
          No se pudo buscar.{' '}
          <button type="button" className="underline text-[var(--plotter-orange)]" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </button>
        </p>
      )}
      {status === 'ready' && (
        <ul>
          {results.map((item) => {
            const movie = isMovie(item)
            const href = `/${movie ? 'movie' : 'tv'}/${item.id}`
            return (
              <li key={`${movie ? 'movie' : 'tv'}-${item.id}`}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/5"
                >
                  <img
                    src={getPosterUrl(item.poster_path, 'w185')}
                    alt=""
                    className="w-8 h-12 object-cover rounded-md bg-black/40"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-[var(--plotter-white)] truncate">{getTitle(item, false)}</span>
                    <span className="block text-[10px] text-[var(--plotter-muted)]">
                      {getReleaseYear(item)} · {movie ? 'Película' : 'Serie'}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <Link
        href={`/search?q=${encodeURIComponent(trimmed)}`}
        onClick={onNavigate}
        className="block px-4 py-2.5 text-xs font-bold text-[var(--plotter-orange)] border-t border-white/10"
      >
        Ver todos
      </Link>
    </div>
  )
}

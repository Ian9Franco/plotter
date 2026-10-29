'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TitleSuggest from '@/components/search/TitleSuggest'
import { getLocalReviews } from '@/lib/review/storage'

export default function HomeAction() {
  const [query, setQuery] = useState('')
  const [localCount, setLocalCount] = useState(0)

  useEffect(() => {
    setLocalCount(getLocalReviews().length)
  }, [])

  return (
    <section className="max-w-[720px] mx-auto px-6 pt-6 pb-2">
      <h2 className="font-['Outfit'] font-black text-lg text-[var(--plotter-white)]">
        Reseñá lo último que viste
      </h2>
      <label className="mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-card)' }}>
        <span className="sr-only">Buscar un título para reseñar</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscá una película o serie"
          className="w-full bg-transparent text-sm text-[var(--plotter-white)] placeholder:text-[var(--plotter-muted)] outline-none"
        />
      </label>
      <TitleSuggest query={query} />
      {localCount > 0 && (
        <p className="mt-3 text-xs text-[var(--plotter-muted)]">
          {localCount} {localCount === 1 ? 'reseña guardada' : 'reseñas guardadas'} solo en este navegador.{' '}
          <Link href="/reviews?entrar=1" className="text-[var(--plotter-orange)] font-bold">
            Entrá para subirlas
          </Link>
        </p>
      )}
    </section>
  )
}

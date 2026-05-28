'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar() {
  const router   = useRouter()
  const [q, setQ] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setQ('')
  }

  return (
    <form onSubmit={handleSubmit} className="nm-pill relative" id="home-search-form">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--plotter-muted)] pointer-events-none z-10" />
      <input
        id="home-search-input"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar películas, series..."
        className="search-input"
        autoComplete="off"
      />
      {q.trim() && (
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary text-xs py-2 px-4"
        >
          Buscar
        </button>
      )}
    </form>
  )
}

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'

import { motion } from 'framer-motion'

const NAV_TABS = [
  { name: 'Inicio', href: '/' },
  { name: 'Películas', href: '/movies' },
  { name: 'Series', href: '/tv' },
]

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [scrolled, setScrolled]     = useState(false)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Detect scroll to add backdrop blur
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [searchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearchOpen(false)
    setQuery('')
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const handleClose = () => {
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 safe-top ${
        scrolled
          ? 'glass border-b border-[var(--plotter-border)]'
          : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-['Outfit'] font-black text-2xl tracking-tight text-white hover:text-[var(--plotter-orange)] transition-colors shrink-0"
        >
          plotter<span className="text-[var(--plotter-orange)]">.</span>
        </Link>

        {/* Desktop Tabs (Animated Glassmorphism) */}
        {!searchOpen && (
          <nav className="hidden md:flex items-center gap-1 p-1 bg-black/20 backdrop-blur-md rounded-full border border-white/5 nm-inset" onMouseLeave={() => setHoveredTab(null)}>
            {NAV_TABS.map((tab) => {
              const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  onMouseEnter={() => setHoveredTab(tab.name)}
                  className="relative px-5 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  {/* Hover Background */}
                  {hoveredTab === tab.name && (
                    <motion.div
                      layoutId="navbar-hover"
                      className="absolute inset-0 rounded-full bg-white/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  {/* Active Background (Glassmorphic) */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-full bg-[var(--plotter-orange)]/20 backdrop-blur-md border border-[var(--plotter-orange)]/30 shadow-[0_0_15px_rgba(244,98,42,0.2)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? 'text-[var(--plotter-orange)] drop-shadow-md' : 'text-white/70 hover:text-white'}`}>
                    {tab.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        )}

        {/* Search pill (expands) */}
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex-1 ml-4 flex items-center gap-2 animate-fade-in">
            <div className="nm-pill relative flex-1 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--plotter-muted)] pointer-events-none z-10" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar película o serie..."
                className="search-input py-2 text-sm"
              />
            </div>
            <button type="button" onClick={handleClose} className="btn-ghost p-2 shrink-0" aria-label="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            id="navbar-search-btn"
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center nm-raised text-[var(--plotter-muted)] hover:text-[var(--plotter-orange)] transition-all"
            aria-label="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  )
}

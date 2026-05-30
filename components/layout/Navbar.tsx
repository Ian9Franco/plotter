'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search, X, ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { AnimatePresence, motion } from 'framer-motion'

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [scrolled, setScrolled]     = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMovieDetail = pathname.startsWith('/movie/')
  const isTvDetail    = pathname.startsWith('/tv/') && pathname !== '/tv'
  const isDetailPage  = isMovieDetail || isTvDetail
  const isMoviesPage  = pathname === '/movies'
  const isTvPage      = pathname === '/tv'
  const isFilterablePage = isMoviesPage || isTvPage
  const selectedGenre = searchParams.get('genre') || 'Todo'

  const handleSelectGenre = (genre: string) => {
    if (genre === 'Todo') {
      router.push(isMoviesPage ? '/movies' : '/tv')
    } else {
      router.push(`${isMoviesPage ? '/movies' : '/tv'}?genre=${encodeURIComponent(genre)}`)
    }
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
      router.back()
    } else {
      router.push(pathname.startsWith('/movie/') ? '/movies' : '/tv')
    }
  }

  const MOVIE_GENRES = ['Todo', 'Acción', 'Aventura', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción']
  const TV_GENRES    = ['Todo', 'Acción y Aventura', 'Animación', 'Comedia', 'Crimen', 'Documental', 'Drama', 'Sci-Fi & Fantasy']
  const genres = isMoviesPage ? MOVIE_GENRES : isTvPage ? TV_GENRES : []

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

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

  // Neumorphic inline styles
  const navbarStyle: React.CSSProperties = scrolled ? {
    boxShadow: '0 10px 30px rgba(244,98,42,0.06), var(--nm-raised)',
    backgroundColor: 'color-mix(in srgb, var(--plotter-card) 45%, transparent)',
    backdropFilter: 'blur(16px) saturate(160%)',
    WebkitBackdropFilter: 'blur(16px) saturate(160%)',
    borderBottom: '1px solid color-mix(in srgb, var(--plotter-border) 40%, transparent)',
  } : {
    backgroundColor: 'color-mix(in srgb, var(--plotter-card) 15%, transparent)',
    backdropFilter: 'blur(8px) saturate(140%)',
    WebkitBackdropFilter: 'blur(8px) saturate(140%)',
  }

  const iconBtnStyle: React.CSSProperties = {
    boxShadow: '2px 2px 6px var(--nm-dark), 0 0 12px rgba(244,98,42,0.2)',
    backgroundColor: 'var(--plotter-card)',
  }

  const genrePillStyle: React.CSSProperties = {
    boxShadow: '2px 2px 6px var(--nm-dark), 0 0 12px rgba(244,98,42,0.2)',
    backgroundColor: 'var(--plotter-card)',
  }

  const dropdownStyle: React.CSSProperties = {
    boxShadow: 'var(--nm-raised-lg)',
    backgroundColor: 'var(--plotter-card)',
  }

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300 safe-top backdrop-blur-xl"
      style={navbarStyle}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Left */}
        <div className="flex-1 flex justify-start items-center gap-2 sm:gap-3 pointer-events-auto relative z-50">
          <LanguageToggle />

          {isDetailPage ? (
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--plotter-white)] hover:text-[var(--plotter-orange)] active:scale-95 transition-all cursor-pointer"
              style={iconBtnStyle}
              aria-label="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : isFilterablePage ? (
            <div className="relative inline-block text-left">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[var(--plotter-white)] text-xs font-semibold transition-all cursor-pointer max-w-[120px] sm:max-w-none hover:-translate-y-px active:scale-95"
                style={genrePillStyle}
              >
                <span className="text-[var(--plotter-muted)] hidden sm:inline">Género:</span>
                <span className={`${isMoviesPage ? 'text-[var(--plotter-orange)]' : 'text-blue-400'} font-bold truncate`}>
                  {selectedGenre}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--plotter-muted)] transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-52 rounded-3xl z-40 overflow-hidden"
                      style={dropdownStyle}
                    >
                      <div className="py-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                        {genres.map(tab => (
                          <button
                            key={tab}
                            onClick={() => { handleSelectGenre(tab); setDropdownOpen(false) }}
                            className={`w-full text-left px-4 py-2.5 text-xs transition-all duration-200 flex items-center justify-between cursor-pointer hover:bg-[var(--plotter-card-hover)] ${
                              selectedGenre === tab
                                ? `${isMoviesPage ? 'text-[var(--plotter-orange)]' : 'text-blue-400'} font-bold`
                                : 'text-[var(--plotter-muted)] hover:text-[var(--plotter-white)]'
                            }`}
                          >
                            {tab}
                            {selectedGenre === tab && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isMoviesPage ? 'bg-[var(--plotter-orange)] shadow-[0_0_8px_rgba(244,98,42,0.6)]' : 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center pointer-events-auto relative z-50">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-6 h-6 md:w-8 md:h-8 relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <img src="/plottericon_white.png" alt="Plotter Icon" className="w-full h-full object-contain logo-white drop-shadow-md" />
              <img src="/plottericon_black.png" alt="Plotter Icon" className="w-full h-full object-contain logo-black drop-shadow-md" />
            </div>
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-[var(--plotter-white)] drop-shadow-md">
              plotter<span className="text-[var(--plotter-orange)]">.</span>
            </span>
          </Link>
        </div>

        {/* Right: Theme + Search */}
        <div className="flex-1 flex justify-end items-center gap-2 md:gap-3 pointer-events-auto relative z-50">
          <ThemeToggle />
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 hover:-translate-y-px"
            style={searchOpen ? {
              backgroundColor: 'var(--plotter-orange)',
              boxShadow: 'var(--nm-glow-orange)',
              color: 'white',
            } : iconBtnStyle}
            aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
          >
            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4 text-[var(--plotter-white)]" />}
          </button>
        </div>
      </div>

      {/* Search Dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute top-14 left-0 w-full px-4 md:px-6 flex justify-center z-40 pointer-events-auto mt-3"
          >
            <form
              onSubmit={handleSearch}
              className="w-full max-w-[600px] flex items-center gap-3 p-2.5 rounded-3xl"
              style={{
                boxShadow: 'var(--nm-raised-lg)',
                backgroundColor: 'var(--plotter-card)',
              }}
            >
              <div
                className="relative flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                style={{
                  boxShadow: 'var(--nm-inset)',
                  backgroundColor: 'var(--plotter-deep, var(--plotter-black))',
                }}
              >
                <Search className="w-4 h-4 text-[var(--plotter-muted)] flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar película o serie..."
                  className="w-full bg-transparent border-none text-[var(--plotter-white)] placeholder-[var(--plotter-muted)] focus:outline-none focus:ring-0 text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl text-white text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--plotter-orange)',
                  boxShadow: 'var(--nm-glow-orange)',
                }}
              >
                Buscar
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

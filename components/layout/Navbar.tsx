'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { AnimatePresence, motion } from 'framer-motion'

const NAV_TABS = [
  { name: 'Inicio', href: '/' },
  { name: 'Películas', href: '/movies' },
  { name: 'Series', href: '/tv' },
]

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSection = searchParams.get('tab') === 'tv' ? 'tv' : 'movies'
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
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
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Left: Dropdown OR Desktop Tabs */}
        <div className="flex-1 flex justify-start pointer-events-auto relative z-50">
          {pathname === '/' ? (
            <div 
              className="relative"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-inner hover:bg-black/40 transition-colors"
              >
                <span className="text-sm md:text-base font-['Outfit'] font-black text-white drop-shadow-md">
                  {activeSection === 'movies' ? 'Películas' : 'Series'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--plotter-orange)] transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-max min-w-[160px] bg-[var(--plotter-card)]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 flex flex-col"
                  >
                    <button 
                      onClick={() => { router.push('/?tab=movies'); setDropdownOpen(false) }}
                      className={`w-full text-left px-5 py-3 text-sm font-['Outfit'] font-bold transition-colors ${activeSection === 'movies' ? 'text-[var(--plotter-orange)] bg-white/5' : 'text-[var(--plotter-white)] hover:bg-white/10'}`}
                    >
                      Películas
                    </button>
                    <button 
                      onClick={() => { router.push('/?tab=tv'); setDropdownOpen(false) }}
                      className={`w-full text-left px-5 py-3 text-sm font-['Outfit'] font-bold transition-colors ${activeSection === 'tv' ? 'text-[var(--plotter-orange)] bg-white/5' : 'text-[var(--plotter-white)] hover:bg-white/10'}`}
                    >
                      Series
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
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
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center pointer-events-auto relative z-50">
          <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter text-white drop-shadow-md">
            plotter<span className="text-[var(--plotter-orange)]">.</span>
          </Link>
        </div>

        {/* Right: Theme Toggle & Search Button */}
        <div className="flex-1 flex justify-end items-center gap-2 md:gap-4 pointer-events-auto relative z-50">
          <ThemeToggle />
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${searchOpen ? 'bg-[var(--plotter-orange)] text-white' : 'text-[var(--plotter-muted)] hover:text-[var(--plotter-orange)] hover:bg-black/20'}`}
            aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Absolute Search Dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-0 w-full px-4 md:px-6 flex justify-center z-40 pointer-events-auto"
          >
            <form onSubmit={handleSearch} className="w-full max-w-[600px] flex items-center gap-2 bg-[var(--plotter-card)]/95 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-2xl">
              <div className="relative flex-1 flex items-center bg-black/20 rounded-full border border-white/10 px-4 py-2">
                <Search className="w-5 h-5 text-[var(--plotter-muted)] pointer-events-none" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar película o serie..."
                  className="w-full bg-transparent border-none text-white focus:outline-none focus:ring-0 px-3 py-1 text-base"
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

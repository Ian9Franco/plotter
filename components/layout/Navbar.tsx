'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { AnimatePresence, motion } from 'framer-motion'

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [scrolled, setScrolled]     = useState(false)
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

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 safe-top ${
        scrolled
          ? 'glass border-b border-[var(--plotter-border)]'
          : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Left: Spacer to keep logo perfectly centered */}
        <div className="flex-1 flex justify-start pointer-events-auto relative z-50">
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


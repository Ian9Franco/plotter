'use client'

import { useTheme } from 'next-themes'
import { Sun, Coffee } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isCoffee = theme === 'coffee'

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-14 h-8 rounded-full bg-[var(--plotter-card)]/40 animate-pulse" />
  }

  return (
    <button
      onClick={() => setTheme(isCoffee ? 'modern' : 'coffee')}
      className="relative w-14 h-8 rounded-full p-1 flex items-center justify-between cursor-pointer select-none transition-all duration-300 focus:outline-none z-50 active:scale-95 hover:-translate-y-px"
      style={{ boxShadow: 'inset 2px 2px 6px var(--nm-dark), 0 0 12px rgba(244,98,42,0.2)', backgroundColor: 'var(--plotter-deep, var(--plotter-black))' }}
      aria-label="Cambiar tema"
    >
      {/* Sliding thumb */}
      <motion.div
        layout
        className="absolute left-1 top-1 w-6 h-6 rounded-full flex items-center justify-center"
        animate={{
          x: isCoffee ? 24 : 0,
          background: isCoffee
            ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)'
            : 'linear-gradient(135deg, #fbd38d 0%, #f6ad55 100%)',
          boxShadow: isCoffee
            ? '2px 2px 8px rgba(0,0,0,0.6), -1px -1px 5px rgba(255,255,255,0.06), 0 0 14px rgba(167,139,250,0.5)'
            : '2px 2px 8px rgba(0,0,0,0.5), -1px -1px 5px rgba(255,255,255,0.08), 0 0 14px rgba(251,211,141,0.5)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {isCoffee ? (
          <Coffee className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-white" />
        )}
      </motion.div>

      {/* Track icons */}
      <Sun className={`w-3.5 h-3.5 ml-1 z-0 transition-opacity duration-300 ${isCoffee ? 'text-[var(--plotter-muted)] opacity-50' : 'text-transparent'}`} />
      <Coffee className={`w-3.5 h-3.5 mr-1 z-0 transition-opacity duration-300 ${isCoffee ? 'text-transparent' : 'text-[var(--plotter-muted)] opacity-50'}`} />
    </button>
  )
}

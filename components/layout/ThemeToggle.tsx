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
    return <div className="w-14 h-8 rounded-full bg-black/20 animate-pulse" />
  }

  return (
    <button
      onClick={() => setTheme(isCoffee ? 'modern' : 'coffee')}
      className="relative w-14 h-8 rounded-full p-1 bg-black/40 hover:bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-between cursor-pointer select-none transition-colors duration-300 focus:outline-none z-50"
      aria-label="Cambiar tema"
    >
      {/* Background sliding indicator */}
      <motion.div
        layout
        className="absolute left-1 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white/20"
        animate={{
          x: isCoffee ? 24 : 0,
          background: isCoffee 
            ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' 
            : 'linear-gradient(135deg, #fbd38d 0%, #f6ad55 100%)',
          boxShadow: isCoffee 
            ? '0 0 12px rgba(167, 139, 250, 0.6)' 
            : '0 0 12px rgba(251, 211, 141, 0.6)'
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {isCoffee ? (
          <Coffee className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-white" />
        )}
      </motion.div>

      {/* Decorative Icons on Track */}
      <Sun className={`w-3.5 h-3.5 ml-1 z-0 transition-opacity duration-300 ${isCoffee ? 'text-white/30' : 'text-transparent'}`} />
      <Coffee className={`w-3.5 h-3.5 mr-1 z-0 transition-opacity duration-300 ${isCoffee ? 'text-transparent' : 'text-white/30'}`} />
    </button>
  )
}

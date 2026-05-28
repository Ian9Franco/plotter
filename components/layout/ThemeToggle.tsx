'use client'

import { useTheme } from 'next-themes'
import { Sun, Coffee } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useMotionTemplate } from 'framer-motion'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isCoffee = theme === 'coffee'
  
  // Hidden drag value (0 to 100)
  const x = useMotionValue(isCoffee ? 100 : 0)
  
  // Map 0-100 to 0-90 degrees
  const angle = useTransform(x, [0, 100], [0, 90])
  
  // Dynamic glow colors based on position
  const shadowColor = useTransform(x, [0, 100], ['rgba(251, 211, 141, 0.4)', 'rgba(167, 139, 250, 0.4)'])
  const boxShadow = useMotionTemplate`0 0 15px ${shadowColor}`

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    animate(x, isCoffee ? 100 : 0, { type: 'spring', stiffness: 300, damping: 30 })
  }, [isCoffee, mounted, x])

  if (!mounted) {
    return <div className="w-12 h-12 rounded-full bg-black/20" />
  }

  const handleDragEnd = () => {
    if (x.get() > 50) {
      setTheme('coffee')
      animate(x, 100, { type: 'spring', stiffness: 300, damping: 30 })
    } else {
      setTheme('modern')
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
    }
  }

  return (
    <div className="relative w-16 h-16 flex items-end justify-start -mr-2">
      {/* SVG Curved Track */}
      <svg className="absolute bottom-1/2 left-1/2 w-16 h-16 pointer-events-none drop-shadow-lg" style={{ overflow: 'visible' }}>
        <path 
          d="M 0 0 A 32 32 0 0 1 32 -32" 
          fill="none" 
          stroke="rgba(255,255,255,0.05)" 
          strokeWidth="16" 
          strokeLinecap="round" 
        />
        <path 
          d="M 0 0 A 32 32 0 0 1 32 -32" 
          fill="none" 
          stroke="url(#trackGrad)" 
          strokeWidth="16" 
          strokeLinecap="round" 
          opacity="0.3"
        />
        <defs>
          <linearGradient id="trackGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbd38d" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      {/* Hidden Draggable Area */}
      <motion.div
        className="absolute bottom-0 left-0 w-16 h-4 opacity-0 cursor-grab active:cursor-grabbing z-20"
        drag="x"
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onClick={() => setTheme(isCoffee ? 'modern' : 'coffee')}
      />

      {/* Visual Rotating Thumb */}
      <motion.div 
        className="absolute bottom-1/2 left-1/2 w-[64px] h-[64px] pointer-events-none z-10"
        style={{ originX: 0, originY: 0, rotate: angle }}
      >
        <motion.div 
          className="absolute left-[-12px] top-[-12px] w-6 h-6 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20"
          style={{ boxShadow }}
        >
          {isCoffee ? (
            <Coffee className="w-3 h-3 text-purple-300" />
          ) : (
            <Sun className="w-3 h-3 text-yellow-300" />
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

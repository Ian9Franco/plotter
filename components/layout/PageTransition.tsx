'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const getRouteIndex = (path: string) => {
  if (path === '/') return 0
  if (path.startsWith('/movies')) return 1
  if (path.startsWith('/tv')) return 2
  return 3 // Default for detail pages or others
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [prevIndex, setPrevIndex] = useState(getRouteIndex(pathname))
  const currentIndex = getRouteIndex(pathname)
  
  // Determine direction: if going to a higher index, slide left; if lower, slide right.
  const direction = currentIndex >= prevIndex ? 1 : -1

  useEffect(() => {
    setPrevIndex(currentIndex)
  }, [currentIndex])

  const variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
    }),
    animate: {
      x: 0,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
    })
  }

  return (
    <AnimatePresence mode="popLayout" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ willChange: 'transform' }}
        className="flex-1 overflow-y-auto overflow-x-hidden absolute inset-0 w-full h-full bg-[var(--plotter-black)]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

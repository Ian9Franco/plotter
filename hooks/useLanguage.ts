'use client'

import { useState, useEffect } from 'react'

export function useLanguage() {
  // Default to true as per user request: "los titulos de las peliculas deben estar en ingles original"
  const [useOriginal, setUseOriginal] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('plotter_use_original_titles')
    if (stored !== null) {
      setUseOriginal(stored === 'true')
    }
    
    const handleStorage = () => {
      const current = localStorage.getItem('plotter_use_original_titles')
      if (current !== null) setUseOriginal(current === 'true')
    }
    
    window.addEventListener('language_change', handleStorage)
    return () => window.removeEventListener('language_change', handleStorage)
  }, [])

  const toggleLanguage = () => {
    const next = !useOriginal
    setUseOriginal(next)
    localStorage.setItem('plotter_use_original_titles', String(next))
    window.dispatchEvent(new Event('language_change'))
  }

  return { useOriginal: mounted ? useOriginal : true, toggleLanguage, mounted }
}

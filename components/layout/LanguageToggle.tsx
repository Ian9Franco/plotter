'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { Languages } from 'lucide-react'

export function LanguageToggle() {
  const { useOriginal, toggleLanguage, mounted } = useLanguage()

  if (!mounted) {
    return <div className="w-10 h-8 rounded-full bg-[var(--plotter-card)]/40 animate-pulse" />
  }

  return (
    <button
      onClick={toggleLanguage}
      className="relative px-3 h-8 rounded-full flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all duration-300 focus:outline-none active:scale-95 hover:-translate-y-px"
      style={{ boxShadow: '2px 2px 6px var(--nm-dark), 0 0 12px rgba(244,98,42,0.2)', backgroundColor: 'var(--plotter-card)' }}
      aria-label="Cambiar idioma de títulos"
      title={useOriginal ? 'Títulos en Idioma Original' : 'Títulos Traducidos'}
    >
      <Languages className={`w-3.5 h-3.5 transition-colors ${useOriginal ? 'text-[var(--plotter-orange)]' : 'text-[var(--plotter-muted)]'}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--plotter-white)]">
        {useOriginal ? 'EN' : 'ES'}
      </span>
    </button>
  )
}

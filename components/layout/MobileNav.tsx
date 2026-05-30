'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Star, Film, Tv } from 'lucide-react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/',        label: 'Inicio',  Icon: Home },
  { href: '/movies',  label: 'Pelis',   Icon: Film },
  { href: '/tv',      label: 'Series',  Icon: Tv   },
  { href: '/reviews', label: 'Reviews', Icon: Star },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-4 pb-5 pointer-events-none select-none">
      <nav
        className="w-full max-w-[420px] mx-auto pointer-events-auto relative rounded-[32px] overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(244,98,42,0.08), var(--nm-raised-lg)',
          backgroundColor: 'color-mix(in srgb, var(--plotter-card) 75%, transparent)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
        aria-label="Navegación principal móvil"
      >
        {/* Subtle top edge highlight */}
        <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        <div className="flex items-center justify-around h-[64px] px-2 relative z-10">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-2xl relative transition-all duration-300 active:scale-90 ${
                  active
                    ? 'text-[var(--plotter-orange)]'
                    : 'text-[var(--plotter-muted)] hover:text-[var(--plotter-white)]'
                }`}
                aria-label={label}
              >
                {/* Active: inset recessed pill */}
                {active && (
                  <motion.span
                    layoutId="mobile-nav-bg"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      boxShadow: 'inset 2px 2px 6px var(--nm-dark), 0 0 12px rgba(244,98,42,0.2)',
                      backgroundColor: 'var(--plotter-deep, var(--plotter-black))',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <Icon
                  className={`w-5 h-5 transition-all duration-300 relative z-10 ${
                    active
                      ? 'drop-shadow-[0_0_10px_rgba(244,98,42,0.7)] scale-110'
                      : 'scale-100'
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />

                {/* Label */}
                <span className="text-[9px] font-bold tracking-wider uppercase select-none relative z-10">
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

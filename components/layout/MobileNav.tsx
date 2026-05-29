'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Star, Film, Tv } from 'lucide-react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/',       label: 'Inicio',  Icon: Home   },
  { href: '/movies', label: 'Pelis',   Icon: Film   },
  { href: '/tv',     label: 'Series',  Icon: Tv     },
  { href: '/reviews',label: 'Reviews', Icon: Star   },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-4 pb-5 pointer-events-none select-none">
      <nav
        className="w-full max-w-[400px] mx-auto pointer-events-auto bg-[var(--plotter-surface)]/60 backdrop-blur-2xl border border-white/[0.08] rounded-[28px] shadow-2xl"
        aria-label="Navegación principal móvil"
      >
        <div className="flex items-center justify-around h-[62px] px-1 relative">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl relative transition-colors duration-300 active:scale-90 ${
                  active
                    ? 'text-[var(--plotter-orange)]'
                    : 'text-[var(--plotter-muted)] hover:text-white'
                }`}
                aria-label={label}
              >
                {/* Active: inset pill bg */}
                {active && (
                  <motion.span
                    layoutId="mobile-nav-bg"
                    className="absolute inset-0 rounded-2xl nm-inset opacity-80"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 relative z-10 ${
                    active 
                      ? 'drop-shadow-[0_0_10px_rgba(244,98,42,0.7)] scale-110' 
                      : 'scale-100'
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                
                <span className="text-[9px] font-bold tracking-wider uppercase select-none opacity-80 relative z-10">
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

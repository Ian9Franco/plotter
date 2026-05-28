import Link from 'next/link'
import { Film, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-[var(--plotter-border)] mt-16 py-8">
      <div className="max-w-xl mx-auto px-4 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="font-['Outfit'] font-black text-lg text-white tracking-tight hover:text-[var(--plotter-orange)] transition-colors"
        >
          plotter<span className="text-[var(--plotter-orange)]">.</span>
        </Link>
        <p className="text-[var(--plotter-muted)] text-xs flex items-center gap-1">
          Hecho con <Heart className="w-3 h-3 text-[var(--plotter-orange)]" /> para cinéfilos
        </p>
        <p className="text-[var(--plotter-subtle)] text-xs">
          Datos por{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--plotter-muted)] hover:text-[var(--plotter-orange)] transition-colors"
          >
            TMDB
          </a>
        </p>
      </div>
    </footer>
  )
}

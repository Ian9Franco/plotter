import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-12 pb-24 px-4 relative z-10">
      <div
        className="max-w-sm mx-auto flex flex-col items-center gap-4 py-8 px-6 rounded-3xl"
        style={{
          boxShadow: 'var(--nm-raised-lg)',
          backgroundColor: 'var(--plotter-card)',
        }}
      >
        {/* Ambient top glow line */}
        <div className="w-1/2 h-px rounded-full opacity-40 bg-gradient-to-r from-transparent via-[var(--plotter-orange)] to-transparent" />

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group hover:-translate-y-0.5 transition-transform duration-300"
        >
          <div className="w-5 h-5 relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <img src="/plottericon_white.png" alt="Plotter Icon" className="w-full h-full object-contain logo-white" />
            <img src="/plottericon_black.png" alt="Plotter Icon" className="w-full h-full object-contain logo-black" />
          </div>
          <span className="font-['Outfit'] font-black text-lg text-[var(--plotter-white)] tracking-tight group-hover:text-[var(--plotter-orange)] transition-colors">
            plotter<span className="text-[var(--plotter-orange)]">.</span>
          </span>
        </Link>

        {/* Attribution */}
        <p className="text-[var(--plotter-muted)] text-xs flex items-center gap-1.5">
          Hecho por{' '}
          <a
            href="https://ian-pontorno-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold hover:text-[var(--plotter-orange)] transition-colors"
          >
            Ian
          </a>
          con <Heart className="w-3 h-3 text-[var(--plotter-orange)]" /> para cinéfilos
        </p>

        {/* Inset divider chip */}
        <div
          className="px-4 py-1.5 rounded-full text-[10px] text-[var(--plotter-muted)]"
          style={{
            boxShadow: 'var(--nm-inset)',
            backgroundColor: 'var(--plotter-deep, var(--plotter-black))',
          }}
        >
          Datos por{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold hover:text-[var(--plotter-orange)] transition-colors"
          >
            TMDB
          </a>
        </div>
      </div>
    </footer>
  )
}

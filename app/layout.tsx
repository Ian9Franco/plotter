import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Plotter — Tus reseñas de cine',
    template: '%s | Plotter',
  },
  description:
    'Descubrí, calificá y compartí tus reseñas de películas y series. Plotter te permite expresarte como cinéfilo y crear tarjetas listas para Instagram.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Plotter — Tus reseñas de cine',
    description: 'Descubrí, calificá y compartí tus reseñas de películas y series.',
    type: 'website',
    locale: 'es_AR',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} h-full overflow-hidden`}>
      <body className="font-sans antialiased bg-[var(--plotter-body-bg)] h-full overflow-hidden p-3 md:p-5 flex flex-col justify-stretch">
        <ThemeProvider attribute="data-theme" defaultTheme="modern" themes={['modern', 'coffee']}>
          <div 
            className="flex-1 flex flex-col w-full max-w-[1440px] mx-auto rounded-[24px] md:rounded-[36px] border border-[var(--plotter-border)] bg-[var(--plotter-black)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65)] relative overflow-hidden h-full"
            style={{ transform: 'translate3d(0, 0, 0)' }}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative h-full">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

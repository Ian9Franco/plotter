import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

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
    <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

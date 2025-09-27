import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Plotter | Tus reseñas de cine",
  description:
    "Crea y comparte tus propias reseñas de películas con estilo. Plotter te permite expresarte como cinéfilo y mostrar tu pasión por el cine, sin distracciones.",
  icons: {
    icon: "/favicon.ico",
  },
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        <Suspense>{children}</Suspense>
      </body>
    </html>
  )
}

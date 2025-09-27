"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import DynamicContent from "@/components/DynamicContent"
import Footer from "@/components/Footer"
import { getTopRatedInTheaters, getTopRatedOnAir, type Movie, type TVShow } from "@/lib/tmdb"

export default function Home() {
  const [topMovie, setTopMovie] = useState<Movie | null>(null)
  const [topTVShow, setTopTVShow] = useState<TVShow | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"all" | "movie" | "tv">("all")
  const [activeCategory, setActiveCategory] = useState("trending")
  const [contentType, setContentType] = useState<"all" | "movie" | "tv">("all")

  // Load hero content on mount
  useEffect(() => {
    const loadHeroContent = async () => {
      try {
        const [movieData, tvData] = await Promise.all([getTopRatedInTheaters(), getTopRatedOnAir()])

        setTopMovie(movieData)
        setTopTVShow(tvData)
      } catch (error) {
        console.error("Error loading hero content:", error)
      }
    }

    loadHeroContent()
  }, [])

  const handleSearch = (query: string, type: "all" | "movie" | "tv") => {
    setSearchQuery(query)
    setSearchType(type)
    setActiveCategory("") // Clear category when searching
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setSearchQuery("") // Clear search when changing category
  }

  const handleContentTypeChange = (type: "all" | "movie" | "tv") => {
    setContentType(type)
    setSearchQuery("") // Clear search and reset to trending when content type changes
    setActiveCategory("trending")
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Contenedor principal centrado como ventana flotante */}
      <div className="max-w-6xl mx-auto bg-black shadow-2xl rounded-3xl overflow-hidden border border-gray-800">
        {/* Navbar component */}
        <Navbar />

        {/* Hero section con buscador y banners dinámicos */}
        <Hero
          topMovie={topMovie}
          topTVShow={topTVShow}
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          contentType={contentType}
          onContentTypeChange={handleContentTypeChange} // <-- add this
        />

        {/* Contenido dinámico basado en búsqueda o categoría */}
        <DynamicContent
          searchQuery={searchQuery}
          searchType={searchType}
          category={activeCategory || "trending"}
          contentType={contentType}
        />

        {/* Footer component */}
        <Footer />
      </div>
    </div>
  )
}

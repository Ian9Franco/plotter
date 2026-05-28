"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { getImageUrl, type Movie, type TVShow } from "@/lib/tmdb"

interface HeroProps {
  topMovie: Movie | null
  topTVShow: TVShow | null
  onSearch: (query: string, type: "all" | "movie" | "tv") => void
  onCategoryChange: (category: string) => void
  contentType: "all" | "movie" | "tv"
  onContentTypeChange: (type: "all" | "movie" | "tv") => void
}

export default function Hero({
  topMovie,
  topTVShow,
  onSearch,
  onCategoryChange,
  contentType,
  onContentTypeChange,
}: HeroProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("trending")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), contentType)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    onCategoryChange(categoryId)
  }

  const categories = [
    { id: "trending", label: "Trending", icon: "🔥" },
    { id: "action", label: "Action", icon: "⚡" },
    { id: "romance", label: "Romance", icon: "💕" },
    { id: "animation", label: "Animation", icon: "🎨" },
    { id: "horror", label: "Horror", icon: "👻" },
    { id: "comedy", label: "Comedy", icon: "😄" },
  ]

  return (
    <div className="px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-8">
          {/* Main banner (70%) - Top rated trending movie */}
          <div className="lg:col-span-7 slide-in-left">
            {topMovie && topMovie.id > 0 ? (
              <Link href={`/movie/${topMovie.id}`}>
                <div className="hero-banner rounded-3xl overflow-hidden relative h-64 lg:h-80 group cursor-pointer">
                  <Image
                    src={getImageUrl(topMovie.backdrop_path, "w1280") || "/placeholder.svg"}
                    alt={topMovie.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-2">{topMovie.title}</h2>
                    <p className="text-gray-300 mb-4 max-w-md line-clamp-2">{topMovie.overview}</p>
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/30 transition-all">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l7-5-7-5z" />
                        </svg>
                        <span>Watch Trailer</span>
                      </button>
                      <div className="flex items-center space-x-1">
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-primary font-semibold">{topMovie.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="hero-banner rounded-3xl overflow-hidden relative h-64 lg:h-80 bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold mb-2">Configure TMDB API</h2>
                  <p className="text-gray-300">Add your TMDB_BEARER_TOKEN to see real content</p>
                </div>
              </div>
            )}
          </div>

          {/* Secondary banner (30%) - Top rated trending TV show */}
          <div className="lg:col-span-3 slide-in-right">
            {topTVShow && topTVShow.id > 0 ? (
              <Link href={`/tv/${topTVShow.id}`}>
                <div className="hero-banner rounded-3xl overflow-hidden relative h-64 lg:h-80 group cursor-pointer">
                  <Image
                    src={getImageUrl(topTVShow.backdrop_path, "w780") || "/placeholder.svg"}
                    alt={topTVShow.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{topTVShow.name}</h3>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{topTVShow.overview}</p>
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm hover:bg-white/30 transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l7-5-7-5z" />
                        </svg>
                        <span>Play</span>
                      </button>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-primary font-semibold text-sm">{topTVShow.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="hero-banner rounded-3xl overflow-hidden relative h-64 lg:h-80 bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-lg font-bold mb-1">Setup Required</h3>
                  <p className="text-gray-300 text-sm">Configure TMDB API</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-effect rounded-3xl p-6 mb-8 fade-in">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                type="button"
                onClick={() => onContentTypeChange("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  contentType === "all" ? "bg-primary text-black" : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onContentTypeChange("movie")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  contentType === "movie" ? "bg-primary text-black" : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => onContentTypeChange("tv")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  contentType === "tv" ? "bg-primary text-black" : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                Series
              </button>
            </div>

            {/* Main search input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search movies, series, or originals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-primary hover:bg-primary/80 text-black rounded-2xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-wrap justify-center gap-3 fade-in">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`category-btn px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                activeCategory === category.id ? "active" : ""
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="text-white">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

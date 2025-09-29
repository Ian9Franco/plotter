"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Download, CreditCard as Edit3, Save, X } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb"

/**
 * Enhanced ReviewCard component with improved export functionality
 * Supports both server-side and client-side export methods with fallback
 */

interface ReviewCardProps {
  movie: {
    id: number
    title?: string
    name?: string
    poster_path: string | null
    backdrop_path: string | null
    vote_average: number
    release_date?: string
    first_air_date?: string
  }
  rating?: number
  reviewText?: string
  reviewerName?: string
}

export default function ReviewCard({
  movie,
  rating = 5,
  reviewText = "",
  reviewerName = "geezatrix",
}: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [currentRating, setCurrentRating] = useState(rating)
  const [currentReview, setCurrentReview] = useState(reviewText)
  const [currentName, setCurrentName] = useState(reviewerName)
  const [isExporting, setIsExporting] = useState(false)
  const reviewCardRef = useRef<HTMLDivElement>(null)

  const contentTitle = movie.title || movie.name || "Sin título"
  const releaseDate = movie.release_date || movie.first_air_date
  const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, "w500") : "/movie-poster-placeholder.png"

  const hasReview = currentReview.trim().length > 0
  const shouldShowExpanded = isEditing || hasReview

  /**
   * Renders star rating display with interactive editing capability
   * @param rating - Current rating value (1-5)
   * @param interactive - Whether stars are clickable for editing
   */
  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && setCurrentRating(i + 1)}
        className={`text-2xl ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform ${
          i < rating ? "text-green-400" : "text-gray-600"
        }`}
      >
        ★
      </button>
    ))
  }

  /**
   * Calculates dynamic card height based on review content length
   * Ensures proper layout for both compact and expanded states
   */
  const getCardHeight = () => {
    if (!shouldShowExpanded) return 280 // Compact mode - just stars
    const baseHeight = 400
    const textLength = currentReview.length
    const additionalHeight = Math.max(0, Math.floor(textLength / 60) * 25)
    return Math.min(baseHeight + additionalHeight, 650)
  }

  const handleSave = () => setIsEditing(false)

  const handleCancel = () => {
    setCurrentRating(rating)
    setCurrentReview(reviewText)
    setCurrentName(reviewerName)
    setIsEditing(false)
  }

  /**
   * Enhanced export function with server-side rendering and client-side fallback
   * Prioritizes server-side export for better quality and consistency
   */
  const downloadReview = async () => {
    if (isExporting) {
      return
    }

    setIsExporting(true)

    try {
      console.log("[ReviewCard] Starting server-side export")
      
      // Prepare export data for server-side rendering
      const exportData = {
        movieId: movie.id,
        title: contentTitle,
        posterUrl: movie.poster_path ? getImageUrl(movie.poster_path, "original") : "",
        backdropUrl: movie.backdrop_path ? getImageUrl(movie.backdrop_path, "original") : "",
        rating: currentRating,
        reviewText: currentReview,
        reviewerName: currentName,
        releaseDate: releaseDate,
        width: 440,
        height: getCardHeight() + 100
      }

      // Try server-side export first
      try {
        const response = await fetch('/api/export-review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exportData)
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `review-${contentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          console.log("[ReviewCard] Server-side export successful")
          return
        } else {
          console.warn("[ReviewCard] Server-side export failed, falling back to client-side")
        }
      } catch (serverError) {
        console.warn("[ReviewCard] Server-side export error:", serverError)
      }

      // Fallback to client-side export using html-to-image
      console.log("[ReviewCard] Using client-side fallback export")
      
      if (!reviewCardRef.current) {
        throw new Error("Review card element not found")
      }

      // Dynamic import to avoid SSR issues
      const { toPng } = await import('html-to-image')
      
      const dataUrl = await toPng(reviewCardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: 'transparent',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      })
      
      const link = document.createElement("a")
      link.download = `review-${contentTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log("[ReviewCard] Client-side export completed")
      
    } catch (error) {
      console.error("[ReviewCard] Export failed:", error)
      alert("Error al exportar la imagen. Por favor, inténtalo de nuevo.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <div className="flex justify-end gap-2 mb-4 px-4">
        {!isEditing ? (
          <>
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="bg-gray-800/80 border-gray-700 text-white hover:bg-gray-700"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              onClick={downloadReview}
              variant="outline"
              size="sm"
              className="bg-primary/20 border-primary/30 text-primary hover:bg-primary/30"
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exportando..." : "Descargar"}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="bg-gray-800/80 border-gray-700 text-white hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </>
        )}
      </div>

      <div className="relative mx-auto" style={{ width: "400px" }}>
        {/* Poster */}
        <div className="relative z-20 flex justify-center">
          <div className="w-30 h-45 rounded-xl overflow-hidden shadow-2xl border-4 border-white">
            <img
              src={posterUrl || "/placeholder.svg"}
              alt={contentTitle}
              className="w-full h-full object-cover"
              style={{ width: "120px", height: "180px" }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/movie-poster-placeholder.png"
              }}
            />
          </div>
        </div>

        <div
          ref={reviewCardRef}
          data-review-card
          className="relative -mt-20 pt-24 pb-8 px-8 rounded-3xl shadow-2xl transition-all duration-300"
          style={{
            height: `${getCardHeight()}px`,
            background: `linear-gradient(135deg, #4a5568 0%, #2d3748 100%)`,
          }}
        >
          {/* Title and year */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 text-balance leading-tight">{contentTitle}</h2>
            <p className="text-lg text-gray-300 font-medium">
              {releaseDate ? new Date(releaseDate).getFullYear() : "N/A"}
            </p>
          </div>

          {/* Stars */}
          <div className="flex items-center justify-center mb-6">{renderStars(currentRating, isEditing)}</div>

          {shouldShowExpanded && (
            <>
              {hasReview && <div className="w-full h-px bg-gray-600 mb-6"></div>}

              {/* Review text editor/display */}
              <div className="flex-1 mb-6 px-2">
                {isEditing ? (
                  <Textarea
                    value={currentReview}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentReview(e.target.value)}
                    className="w-full min-h-32 bg-transparent border border-gray-600/50 text-white text-center resize-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-gray-400 px-4 py-3 rounded-lg"
                    placeholder="Escribe tu opinión sobre este contenido..."
                    style={{ fontSize: "14px", lineHeight: "1.6", textAlign: "center" }}
                  />
                ) : hasReview ? (
                  <div className="px-6 py-2">
                    <p className="text-white text-center text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {currentReview}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Reviewer name */}
              <div className="text-center mt-auto pt-4">
                {isEditing ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-300 text-sm">Review by</span>
                    <Input
                      value={currentName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentName(e.target.value)}
                      className="bg-transparent border border-gray-600/50 text-white text-center focus:ring-1 focus:ring-primary/50 focus:border-primary/50 max-w-32 h-8 text-sm"
                      placeholder="Tu nombre"
                    />
                  </div>
                ) : (
                  <p className="text-gray-300">
                    Review by <span className="font-bold text-white">{currentName}</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

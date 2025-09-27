import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ReviewCard from "@/components/ReviewCard"
import { getWatchProviders, getVideos, getImageUrl, type WatchProviders, type Video } from "@/lib/tmdb"

interface MovieDetails {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  genres: { id: number; name: string }[]
  vote_average: number
  release_date: string
  runtime: number
}

export default async function MoviePage({ params }: { params: { id: string } }) {
  let movie: MovieDetails | null = null
  let watchProviders: WatchProviders | null = null
  let videos: Video[] = []

  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${params.id}?language=es-ES`, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`,
        accept: "application/json",
      },
      next: { revalidate: 3600 },
    })

    if (response.ok) {
      movie = await response.json()

      if (movie) {
        watchProviders = await getWatchProviders(movie.id, "movie")
        videos = await getVideos(movie.id, "movie")
      }
    } else {
      console.error(`TMDB API error: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error fetching movie details:", error)
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Película no encontrada</h1>
          <p className="text-gray-400 mb-6">
            La película que buscas no existe o no se pudo cargar. Verifica tu configuración de API de TMDB.
          </p>
          <Link href="/" className="text-primary hover:text-primary/80 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, "w500") : "/abstract-movie-poster.png"

  const backdropUrl = movie.backdrop_path ? getImageUrl(movie.backdrop_path, "w1280") : "/movie-backdrop.png"

  const rating = Math.round(movie.vote_average * 10) / 10
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"
  const runtime = movie.runtime ? `${movie.runtime} min` : "N/A"

  const mainTrailer = videos.find((video) => video.type === "Trailer") || videos[0]

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-6xl mx-auto bg-black shadow-2xl rounded-3xl overflow-hidden border border-gray-800">
        {/* Header con imagen de fondo */}
        <div className="relative h-64 md:h-96">
          <Image src={backdropUrl || "/placeholder.svg"} alt={movie.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/60" />

          {/* Botón de volver */}
          <Link
            href="/"
            className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-2xl hover:bg-primary hover:text-black transition-all duration-300 border border-gray-700"
          >
            ← Volver
          </Link>

          {mainTrailer && (
            <a
              href={`https://www.youtube.com/watch?v=${mainTrailer.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 bg-red-600/80 text-white px-4 py-2 rounded-2xl hover:bg-red-600 transition-all duration-300 border border-red-500 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l7-5-7-5z" />
              </svg>
              Ver Trailer
            </a>
          )}
        </div>

        {/* Contenido principal */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Póster */}
            <div className="flex-shrink-0">
              <div className="relative w-48 h-72 mx-auto md:mx-0">
                <Image
                  src={posterUrl || "/placeholder.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover rounded-2xl shadow-2xl shadow-primary/20"
                />
              </div>
            </div>

            {/* Información de la película */}
            <div className="flex-1">
              {/* Título, rating y fecha de lanzamiento */}
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 text-balance">{movie.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-white font-semibold">{rating}/10</span>
                </div>
                <span className="text-gray-400">{releaseYear}</span>
                <span className="text-gray-400">{runtime}</span>
              </div>

              {/* Géneros */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm border border-primary/30"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>

              {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Disponible en:</h3>
                  <div className="space-y-3">
                    {watchProviders.flatrate && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Streaming:</p>
                        <div className="flex flex-wrap gap-2">
                          {watchProviders.flatrate.map((provider) => (
                            <div
                              key={provider.provider_id}
                              className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg"
                            >
                              <Image
                                src={getImageUrl(provider.logo_path, "w45") || "/placeholder.svg"}
                                alt={provider.provider_name}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                              <span className="text-white text-sm">{provider.provider_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {watchProviders.rent && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Alquiler:</p>
                        <div className="flex flex-wrap gap-2">
                          {watchProviders.rent.map((provider) => (
                            <div
                              key={provider.provider_id}
                              className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg"
                            >
                              <Image
                                src={getImageUrl(provider.logo_path, "w45") || "/placeholder.svg"}
                                alt={provider.provider_name}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                              <span className="text-white text-sm">{provider.provider_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sinopsis */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">Sinopsis</h2>
                <p className="text-gray-300 leading-relaxed text-pretty">
                  {movie.overview || "No hay sinopsis disponible."}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Reviews */}
          <div className="mt-16 border-t border-gray-800 pt-12">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Crea tu Review</h2>

            <ReviewCard
              movie={{
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
              }}
              rating={5}
              reviewText=""
              reviewerName="Mi Review"
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

import MovieCard from "./MovieCard"

// Interfaz para los datos de película de TMDB
interface Movie {
  id: number
  title: string
  poster_path: string
  vote_average: number
  release_date: string
  overview: string
}

// Sección de películas populares que consume la API de TMDB
export default async function PopularMovies() {
  let movies: Movie[] = []

  try {
    const response = await fetch("https://api.themoviedb.org/3/movie/popular?language=es-ES&page=1", {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        accept: "application/json",
      },
      next: { revalidate: 3600 }, // Revalidar cada hora
    })

    if (response.ok) {
      const data = await response.json()
      movies = data.results.slice(0, 12) // Mostrar solo las primeras 12 películas
    } else {
      console.error("TMDB API error:", response.status, response.statusText)
    }
  } catch (error) {
    console.error("Error fetching movies:", error)
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">Películas Populares</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 fade-in">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {movies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No se pudieron cargar las películas. Intenta más tarde.</p>
          </div>
        )}
      </div>
    </section>
  )
}

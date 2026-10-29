import MovieDetail from '@/components/detail/MovieDetail'
import { fetchReviewsForTitle } from '@/lib/review/storage'
import { fetchMovieTitle } from '@/lib/tmdb/title'

export const revalidate = 3600

interface MoviePageProps {
  params: { id: string }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--plotter-black)]">
        <p className="text-[var(--plotter-muted)]">Película no encontrada</p>
      </div>
    )
  }

  try {
    const bundle = await fetchMovieTitle(id)
    const reviews = await fetchReviewsForTitle(id, 'movie').catch(() => [])
    return (
      <MovieDetail
        movie={bundle.details}
        providers={bundle.providers}
        region={bundle.region}
        trailer={bundle.trailers[0] ?? null}
        reviews={reviews}
      />
    )
  } catch (err) {
    console.error('Error loading movie:', err)
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--plotter-black)]">
        <p className="text-[var(--plotter-muted)]">No se pudo cargar esta película</p>
      </div>
    )
  }
}

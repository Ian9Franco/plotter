import TVDetail from '@/components/detail/TVDetail'
import { fetchReviewsForTitle } from '@/lib/review/storage'
import { fetchTVTitle } from '@/lib/tmdb/title'

export const revalidate = 3600

interface TVPageProps {
  params: { id: string }
}

export default async function TVPage({ params }: TVPageProps) {
  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--plotter-black)]">
        <p className="text-[var(--plotter-muted)]">Serie no encontrada</p>
      </div>
    )
  }

  try {
    const bundle = await fetchTVTitle(id)
    const reviews = await fetchReviewsForTitle(id, 'tv').catch(() => [])
    return (
      <TVDetail
        show={bundle.details}
        providers={bundle.providers}
        region={bundle.region}
        trailer={bundle.trailers[0] ?? null}
        reviews={reviews}
      />
    )
  } catch (err) {
    console.error('Error loading TV show:', err)
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--plotter-black)]">
        <p className="text-[var(--plotter-muted)]">No se pudo cargar esta serie</p>
      </div>
    )
  }
}
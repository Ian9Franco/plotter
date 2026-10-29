import { unstable_noStore as noStore } from 'next/cache'
import Footer from '@/components/layout/Footer'
import CatalogUnavailable from '@/components/catalog/CatalogUnavailable'
import TrendingCarousel from '@/components/home/TrendingCarousel'
import PagedMediaCarousel from '@/components/media/PagedMediaCarousel'
import { fetchTrendingMovies, fetchTrendingTV, fetchUpcomingMovies, isReleasedBy, isUpcomingBy, todayISO } from '@/lib/tmdb/catalog'

export const revalidate = 3600

export default async function HomePage() {
  const today = todayISO()

  try {
    const [moviesPage, tvPage, upcomingPage] = await Promise.all([
      fetchTrendingMovies(1),
      fetchTrendingTV(1),
      fetchUpcomingMovies(1),
    ])

    const trendingMovies = moviesPage.results.filter((movie) => isReleasedBy(movie.release_date, today))
    const trendingTV = tvPage.results.filter((show) => isReleasedBy(show.first_air_date, today))
    const upcomingMovies = upcomingPage.results.filter((movie) => isUpcomingBy(movie.release_date, today))

    return (
      <div className="min-h-full bg-[var(--plotter-black)] flex flex-col">
        <main className="page-content w-full">
          <TrendingCarousel movies={trendingMovies} tv={trendingTV} />
          {upcomingMovies.length > 0 && (
            <div className="max-w-[1400px] mx-auto px-6 pb-24 mt-16 pointer-events-auto relative z-20">
              <PagedMediaCarousel
                initialItems={upcomingMovies}
                totalPages={upcomingPage.total_pages}
                title="Próximos Estrenos"
                action="upcoming"
                variant="wide"
                mode="upcoming"
              />
            </div>
          )}
        </main>
        <Footer />
      </div>
    )
  } catch (err) {
    console.error('Error loading home:', err)
    noStore()
    return <CatalogUnavailable label="el inicio" />
  }
}

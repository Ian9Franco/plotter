import { unstable_noStore as noStore } from 'next/cache'
import CatalogUnavailable from '@/components/catalog/CatalogUnavailable'
import MoviesBrowser from '@/components/movies/MoviesBrowser'
import { fetchNowPlayingMovies, fetchTrendingMovies, fetchUpcomingMovies, isReleasedBy, isUpcomingBy, todayISO } from '@/lib/tmdb/catalog'

export const revalidate = 3600

export default async function MoviesPage() {
  const today = todayISO()

  try {
    const [trendingPage, nowPlayingPage, upcomingPage] = await Promise.all([
      fetchTrendingMovies(1),
      fetchNowPlayingMovies(1),
      fetchUpcomingMovies(1),
    ])

    const trending = trendingPage.results.filter((movie) => isReleasedBy(movie.release_date, today))
    const nowPlaying = nowPlayingPage.results.filter((movie) => isReleasedBy(movie.release_date, today))
    const upcoming = upcomingPage.results.filter((movie) => isUpcomingBy(movie.release_date, today))
    const featured = nowPlaying[0] ?? trending[0] ?? null

    return (
      <MoviesBrowser
        trending={trending}
        trendingPages={trendingPage.total_pages}
        nowPlaying={nowPlaying}
        nowPlayingPages={nowPlayingPage.total_pages}
        upcoming={upcoming}
        upcomingPages={upcomingPage.total_pages}
        featured={featured}
      />
    )
  } catch (err) {
    console.error('Error loading movies:', err)
    noStore()
    return <CatalogUnavailable label="las películas" />
  }
}

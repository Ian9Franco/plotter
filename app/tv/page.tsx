import { unstable_noStore as noStore } from 'next/cache'
import CatalogUnavailable from '@/components/catalog/CatalogUnavailable'
import TVBrowser from '@/components/tv/TVBrowser'
import { fetchOnAirTV, fetchTrendingTV } from '@/lib/tmdb/catalog'

export const revalidate = 3600

export default async function TVPage() {
  try {
    const [trendingPage, onAirPage] = await Promise.all([
      fetchTrendingTV(1),
      fetchOnAirTV(1),
    ])

    return (
      <TVBrowser
        trending={trendingPage.results}
        onAir={onAirPage.results}
        onAirPages={onAirPage.total_pages}
      />
    )
  } catch (err) {
    console.error('Error loading TV shows:', err)
    noStore()
    return <CatalogUnavailable label="las series" />
  }
}

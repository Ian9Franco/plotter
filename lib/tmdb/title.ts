import { pickTrailers, pickWatchRegion } from './catalog'
import { tmdbFetch } from './upstream'
import type { MovieDetails, TitleBundle, TVDetails, Video } from './types'

interface RawTitle {
  videos?: { results?: Video[] }
  external_ids?: { imdb_id?: string | null }
  imdb_id?: string | null
  [key: string]: unknown
}

function bundleFromRaw<T extends { imdb_id?: string | null }>(data: RawTitle): TitleBundle<T> {
  const videos = data.videos
  const externalIds = data.external_ids
  const watch = data['watch/providers'] as { results?: Record<string, import('./types').WatchProviders> } | undefined
  const { providers, region } = pickWatchRegion(watch)

  const details = { ...data } as T & RawTitle
  delete (details as RawTitle).videos
  delete (details as RawTitle).external_ids
  delete (details as { 'watch/providers'?: unknown })['watch/providers']
  details.imdb_id = externalIds?.imdb_id ?? data.imdb_id ?? null

  return {
    details,
    trailers: pickTrailers(videos?.results),
    providers,
    region,
  }
}

export async function fetchMovieTitle(id: number): Promise<TitleBundle<MovieDetails>> {
  const data = await tmdbFetch<RawTitle>(
    `/movie/${id}?language=es-ES&append_to_response=videos,external_ids,watch/providers`,
  )
  return bundleFromRaw<MovieDetails>(data)
}

export async function fetchTVTitle(id: number): Promise<TitleBundle<TVDetails>> {
  const data = await tmdbFetch<RawTitle>(
    `/tv/${id}?language=es-ES&append_to_response=videos,external_ids,watch/providers`,
  )
  return bundleFromRaw<TVDetails>(data)
}

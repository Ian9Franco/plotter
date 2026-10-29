import { type NextRequest, NextResponse } from 'next/server'

interface Rating {
  Source: string
  Value: string
}

interface OMDbMovieResponse {
  Ratings?: Rating[]
  imdbRating?: string
  Response: string
}

const DAY = 'public, s-maxage=86400, stale-while-revalidate=86400'
const SHORT = 'public, s-maxage=60'
const NO_STORE = 'no-store'

function json(data: unknown, status: number, cacheControl: string) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': cacheControl },
  })
}

async function getMovieRatings(imdbId: string): Promise<{
  rottenTomatoes: string | null
  imdb: string | null
  metacritic: string | null
} | null> {
  const apiKey = process.env.OMDB_API_KEY
  if (!apiKey) return null

  const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}`
  const response = await fetch(url, { next: { revalidate: 86400 } })
  if (!response.ok) return null

  const data: OMDbMovieResponse = await response.json()
  if (data.Response === 'False') return null

  const rottenTomatoes = data.Ratings?.find((rating) => rating.Source === 'Rotten Tomatoes')?.Value || null
  let metacritic = data.Ratings?.find((rating) => rating.Source === 'Metacritic')?.Value || null
  let imdb: string | null = data.imdbRating ?? null

  if (rottenTomatoes === 'N/A' && !imdb && !metacritic) return null
  if (metacritic === 'N/A') metacritic = null
  if (imdb === 'N/A') imdb = null

  return {
    rottenTomatoes: rottenTomatoes && rottenTomatoes !== 'N/A' ? rottenTomatoes : null,
    imdb: imdb ? `${imdb}/10` : null,
    metacritic: metacritic && metacritic !== 'N/A' ? metacritic : null,
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.OMDB_API_KEY) {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': SHORT } })
  }

  const sp = new URL(request.url).searchParams
  let targetImdbId = sp.get('imdbId')

  try {
    if (!targetImdbId) {
      const tmdbId = sp.get('tmdbId')
      const type = sp.get('type') || 'movie'
      if (tmdbId) {
        const tmdbUrl = type === 'movie'
          ? `https://api.themoviedb.org/3/movie/${tmdbId}`
          : `https://api.themoviedb.org/3/tv/${tmdbId}?append_to_response=external_ids`

        const tmdbRes = await fetch(tmdbUrl, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN || ''}`,
            accept: 'application/json',
          },
          next: { revalidate: 86400 },
        })
        if (tmdbRes.ok) {
          const tmdbData = await tmdbRes.json()
          targetImdbId = type === 'movie' ? tmdbData.imdb_id : tmdbData.external_ids?.imdb_id
        }
      }
    }

    if (!targetImdbId) {
      return json({}, 200, SHORT)
    }

    const ratings = await getMovieRatings(targetImdbId)
    if (!ratings) {
      return json({}, 200, SHORT)
    }

    return json(ratings, 200, DAY)
  } catch (error) {
    console.error('Error fetching OMDb ratings:', error)
    return json({}, 200, NO_STORE)
  }
}

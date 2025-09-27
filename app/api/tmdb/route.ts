import { type NextRequest, NextResponse } from "next/server"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const BEARER_TOKEN = process.env.TMDB_BEARER_TOKEN // Server-only, no NEXT_PUBLIC prefix

const headers = {
  Authorization: `Bearer ${BEARER_TOKEN}`,
  accept: "application/json",
}

async function makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    })
    if (!response.ok) throw new Error(`API call failed: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error("TMDB API Error:", error)
    return { results: [] }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const query = searchParams.get("query")
  const type = searchParams.get("type") || "all"
  const genreId = searchParams.get("genreId")
  const id = searchParams.get("id")

  try {
    switch (action) {
      case "search":
        if (!query) {
          return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
        }
        const endpoint = type === "movie" ? "/search/movie" : type === "tv" ? "/search/tv" : "/search/multi"
        const searchData = await makeApiCall(`${endpoint}?query=${encodeURIComponent(query)}&language=es-ES&page=1`)
        return NextResponse.json(searchData.results?.filter((item: any) => item.media_type !== "person") || [])

      case "trending":
        const trendingData = await makeApiCall(`/trending/${type}/day?language=es-ES`, { next: { revalidate: 3600 } })
        return NextResponse.json(trendingData.results?.slice(0, 22) || [])

      case "top-rated-theaters":
        const theatersData = await makeApiCall("/movie/now_playing?language=en-US&page=1", {
          next: { revalidate: 3600 },
        })
        if (!theatersData.results || theatersData.results.length === 0) {
          return NextResponse.json(null)
        }
        const filteredTheaters = theatersData.results.filter((movie: any) => movie.original_language !== "zh")
        const sortedTheaters = filteredTheaters.sort((a: any, b: any) => b.vote_average - a.vote_average)
        return NextResponse.json(sortedTheaters[0] || null)

      case "top-rated-air":
        const airData = await makeApiCall("/tv/on_the_air?language=en-US&page=1", { next: { revalidate: 3600 } })
        if (!airData.results || airData.results.length === 0) {
          return NextResponse.json(null)
        }
        const filteredAir = airData.results.filter((show: any) => show.original_language !== "zh")
        const sortedAir = filteredAir.sort((a: any, b: any) => b.vote_average - a.vote_average)
        return NextResponse.json(sortedAir[0] || null)

      case "discover-movies":
        if (!genreId) {
          return NextResponse.json({ error: "GenreId parameter required" }, { status: 400 })
        }
        const moviesData = await makeApiCall(
          `/discover/movie?with_genres=${genreId}&language=es-ES&page=1&sort_by=popularity.desc`,
          { next: { revalidate: 3600 } },
        )
        return NextResponse.json(moviesData.results?.slice(0, 22) || [])

      case "discover-tv":
        if (!genreId) {
          return NextResponse.json({ error: "GenreId parameter required" }, { status: 400 })
        }
        const tvData = await makeApiCall(
          `/discover/tv?with_genres=${genreId}&language=es-ES&page=1&sort_by=popularity.desc`,
          { next: { revalidate: 3600 } },
        )
        return NextResponse.json(tvData.results?.slice(0, 22) || [])

      case "watch-providers":
        if (!id || !type) {
          return NextResponse.json({ error: "ID and type parameters required" }, { status: 400 })
        }
        const providersData = await makeApiCall(`/${type}/${id}/watch/providers`, { next: { revalidate: 3600 } })
        // Return providers for US market (most comprehensive)
        return NextResponse.json(providersData.results?.US || null)

      case "videos":
        if (!id || !type) {
          return NextResponse.json({ error: "ID and type parameters required" }, { status: 400 })
        }
        const videosData = await makeApiCall(`/${type}/${id}/videos?language=en-US`, { next: { revalidate: 3600 } })
        // Filter for trailers and teasers, prioritize official ones
        const trailers =
          videosData.results
            ?.filter((video: any) => video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser"))
            .sort((a: any, b: any) => {
              // Prioritize official trailers
              if (a.official && !b.official) return -1
              if (!a.official && b.official) return 1
              return 0
            }) || []
        return NextResponse.json(trailers)

      default:
        return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 })
    }
  } catch (error) {
    console.error("TMDB API Route Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

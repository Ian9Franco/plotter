import { type NextRequest, NextResponse } from 'next/server'

interface Rating {
  Source: string;
  Value: string;
}

interface OMDbMovieResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Rating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response: string;
  Error?: string;
}

async function getMovieRatings(imdbId: string): Promise<{
  rottenTomatoes: string | null;
  imdb: string | null;
  metacritic: string | null;
} | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;
  const url = `http://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`;

  try {
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return null;

    const data: OMDbMovieResponse = await response.json();
    if (data.Response === 'False') return null;

    const rottenTomatoes = data.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value || null;
    let metacritic = data.Ratings?.find((r) => r.Source === "Metacritic")?.Value || null;
    let imdb: string | null = data.imdbRating;

    // Handle N/A
    if (rottenTomatoes === "N/A") return null;
    if (metacritic === "N/A") metacritic = null;
    if (imdb === "N/A") imdb = null;

    return {
      rottenTomatoes: rottenTomatoes !== "N/A" ? rottenTomatoes : null,
      imdb: imdb ? `${imdb}/10` : null,
      metacritic: metacritic !== "N/A" ? metacritic : null,
    };
  } catch (error) {
    console.error("Error fetching OMDb ratings:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const imdbId = sp.get('imdbId')
  
  let targetImdbId = imdbId

  if (!targetImdbId) {
    const tmdbId = sp.get('tmdbId')
    const type = sp.get('type') || 'movie'
    if (tmdbId) {
      try {
        const tmdbUrl = type === 'movie' 
          ? `https://api.themoviedb.org/3/movie/${tmdbId}`
          : `https://api.themoviedb.org/3/tv/${tmdbId}?append_to_response=external_ids`
        
        const tmdbRes = await fetch(tmdbUrl, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN || process.env.TMDB_API_KEY}`,
            accept: 'application/json',
          },
          next: { revalidate: 86400 }
        })
        if (tmdbRes.ok) {
          const tmdbData = await tmdbRes.json()
          targetImdbId = type === 'movie' 
            ? tmdbData.imdb_id 
            : tmdbData.external_ids?.imdb_id
        }
      } catch (err) {
        console.error("Error translating TMDB ID to IMDb ID:", err)
      }
    }
  }

  if (!targetImdbId) {
    return NextResponse.json({ error: 'imdbId could not be resolved' }, { status: 400 })
  }

  const ratings = await getMovieRatings(targetImdbId);
  if (!ratings) {
    return NextResponse.json({ error: 'Movie not found or error fetching ratings' }, { status: 404 });
  }

  return NextResponse.json(ratings)
}


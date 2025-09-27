// types/movie.ts
export interface MovieDetails {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  genres: { id: number; name: string }[]
  vote_average: number
  release_date: string
  runtime: number
}

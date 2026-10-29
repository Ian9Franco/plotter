export interface GenreOption {
  label: string
  id: number | null
}

export const MOVIE_GENRE_MENU: GenreOption[] = [
  { label: 'Todo', id: null },
  { label: 'Acción', id: 28 },
  { label: 'Aventura', id: 12 },
  { label: 'Comedia', id: 35 },
  { label: 'Drama', id: 18 },
  { label: 'Terror', id: 27 },
  { label: 'Ciencia Ficción', id: 878 },
]

export const TV_GENRE_MENU: GenreOption[] = [
  { label: 'Todo', id: null },
  { label: 'Acción y Aventura', id: 10759 },
  { label: 'Animación', id: 16 },
  { label: 'Comedia', id: 35 },
  { label: 'Crimen', id: 80 },
  { label: 'Documental', id: 99 },
  { label: 'Drama', id: 18 },
  { label: 'Sci-Fi & Fantasy', id: 10765 },
]

export function genreIdByLabel(menu: GenreOption[], label: string): number | null {
  return menu.find((genre) => genre.label === label)?.id ?? null
}

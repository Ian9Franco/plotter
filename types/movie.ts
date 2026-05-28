export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  overview?: string;
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  overview?: string;
  genres?: Array<{ id: number; name: string }>;
}

export interface WatchProviders {
  flatrate?: Array<{
    provider_id: number;
    provider_name: string;
    logo_path: string;
  }>;
  rent?: Array<{
    provider_id: number;
    provider_name: string;
    logo_path: string;
  }>;
  buy?: Array<{
    provider_id: number;
    provider_name: string;
    logo_path: string;
  }>;
}

export interface Video {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}
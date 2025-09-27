peliculas :
GET /movie/{movie_id}
GET /movie/{movie_id}/account_states
GET /movie/{movie_id}/alternative_titles
GET /movie/{movie_id}/changes
GET /movie/{movie_id}/credits
GET /movie/{movie_id}/external_ids
GET /movie/{movie_id}/images
GET /movie/{movie_id}/keywords
GET /movie/latest
GET /movie/{movie_id}/lists
GET /movie/{movie_id}/recommendations
GET /movie/{movie_id}/release_dates
GET /movie/{movie_id}/reviews
GET /movie/{movie_id}/similar
GET /movie/{movie_id}/translations
GET /movie/{movie_id}/videos
GET /movie/{movie_id}/watch/providers

TV:
GET /tv/{tv_id}
GET /tv/{tv_id}/account_states
GET /tv/{tv_id}/aggregate_credits
GET /tv/{tv_id}/alternative_titles
GET /tv/{tv_id}/changes
GET /tv/{tv_id}/content_ratings
GET /tv/{tv_id}/credits
GET /tv/{tv_id}/episode_groups
GET /tv/{tv_id}/external_ids
GET /tv/{tv_id}/images
GET /tv/{tv_id}/keywords
GET /tv/latest
GET /tv/{tv_id}/lists
GET /tv/{tv_id}/recommendations
GET /tv/{tv_id}/reviews
GET /tv/{tv_id}/screened_theatrically
GET /tv/{tv_id}/similar
GET /tv/{tv_id}/translations
GET /tv/{tv_id}/videos
GET /tv/{tv_id}/watch/providers

Temporadas y Episodios:
GET /tv/{tv_id}/season/{season_number}
GET /tv/{tv_id}/season/{season_number}/account_states
GET /tv/{tv_id}/season/{season_number}/aggregate_credits
GET /tv/{tv_id}/season/{season_number}/changes
GET /tv/{tv_id}/season/{season_number}/credits
GET /tv/{tv_id}/season/{season_number}/external_ids
GET /tv/{tv_id}/season/{season_number}/images
GET /tv/{tv_id}/season/{season_number}/translations
GET /tv/{tv_id}/season/{season_number}/videos

GET /tv/{tv_id}/season/{season_number}/episode/{episode_number}
GET /tv/{tv_id}/season/{season_number}/episode/{episode_number}/account_states
GET /tv/{tv_id}/season/{season_number}/episode/{episode_number}/changes
GET /tv/{tv_id}/season/{season_number}/episode/{episode_number}/credits
GET /tv/{tv_id}/season/{season_number}/episode/{episode_number}/external_ids
GET /tv/{tv_id}/season/{season_number}/episode/{episode_number}/images
GET /tv/{tv_id}/season/{season_number}/episode/{episode_number}/translations
GET /tv/{tv_id}/season/{season_number}/episode/{episode_number}/videos


🎞️ Listas de Películas:
GET /movie/now_playing
GET /movie/popular
GET /movie/top_rated
GET /movie/upcoming


📺 Listas de Series:
GET /tv/airing_today
GET /tv/on_the_air
GET /tv/popular
GET /tv/top_rated



Búsqueda:
GET /search/collection
GET /search/company
GET /search/keyword
GET /search/movie
GET /search/multi
GET /search/person
GET /search/tv


Tendencias:
GET /trending/all/{time_window}
GET /trending/movie/{time_window}
GET /trending/person/{time_window}
GET /trending/tv/{time_window}


Descubrimiento:
GET /discover/movie
GET /discover/tv

🏢 Compañías, Redes, Personas

GET /company/{id}
GET /company/{id}/alternative_names
GET /company/{id}/images

GET /network/{id}
GET /network/{id}/alternative_names
GET /network/{id}/images

GET /person/{id}
GET /person/{id}/changes
GET /person/{id}/combined_credits
GET /person/{id}/external_ids
GET /person/{id}/images
GET /person/latest
GET /person/{id}/movie_credits
GET /person/{id}/tv_credits
GET /person/{id}/tagged_images
GET /person/{id}/translations

🧩 Otros:
GET /configuration
GET /configuration/countries
GET /configuration/jobs
GET /configuration/languages
GET /configuration/primary_translations
GET /configuration/timezones

GET /certification/movie/list
GET /certification/tv/list

GET /genre/movie/list
GET /genre/tv/list

GET /keyword/{id}
GET /keyword/{id}/movies

GET /list/{id}
GET /list/{id}/item_status

# Escalabilidad

Cada punto de abajo se puede retomar solo. El orden entre puntos está en [README.md](./README.md). Las rutas son las del repo al momento de la revisión.

## 1. Catálogo en el servidor, con caché de una hora

**Estado.** `app/page.tsx`, `app/movies/page.tsx`, `app/tv/page.tsx`, `app/movie/[id]/page.tsx` y `app/tv/[id]/page.tsx` son `'use client'`. Cargan en `useEffect` vía `lib/tmdb/client.ts`, que pega a `/api/tmdb`. Inicio y películas guardan el resultado en variables de módulo (`cachedTrendingMovies`, `cachedUpcomingMovies`, y las equivalentes de películas). Esa memoria muere al refrescar y no la comparte otro usuario.

**Objetivo.** Trending, estrenos y la ficha de lectura se resuelven en el servidor. El HTML de la primera pintura ya trae los títulos. La interacción (carrusel, editor, filtros) sigue en cliente.

**Proceso.**

1. Dejar estable el proxy (puntos 3 y 4) antes de mover el render. Si no, el Server Component hereda el fan-out de 3 páginas y el error disfrazado de lista vacía.
2. Extraer la lectura a funciones que llamen a TMDb desde el servidor, con `next: { revalidate: 3600 }` en el `fetch` saliente. No hace falta que el browser pegue a `/api/tmdb` para armar el home.
3. La page del home pasa a Server Component y le pasa los arrays al carrusel, que sigue siendo cliente.
4. Igual en películas, series y en la mitad de lectura de la ficha. `ReviewEditor` no se convierte a servidor: recibe el ítem por props.
5. Borrar las variables `cached*` de módulo. Con caché de fetch ya no aportan y esconden datos viejos dentro de la pestaña.
6. `apiFetch` manda `next: { revalidate }` desde el browser. Esa opción no cachea el fetch del cliente. Cuando una pantalla siga en cliente (búsqueda al tipear), no depender de ese parámetro: la caché tiene que estar en la respuesta HTTP del proxy.

**Archivos.** `app/page.tsx`, `app/movies/page.tsx`, `app/tv/page.tsx`, `app/movie/[id]/page.tsx`, `app/tv/[id]/page.tsx`, `lib/tmdb/movies.ts`, `lib/tmdb/tv.ts`, `lib/tmdb/client.ts`, `components/home/TrendingCarousel.tsx`.

**Hecho cuando.** Recargar inicio no dispara 9 idas a `/api/tmdb` desde el browser. El carrusel sigue deslizándose. Escribir una reseña en la ficha sigue funcionando sin recargar el título.

**No hacer.** No convertir `ReviewEditor` ni la navbar a Server Components. No cachear la búsqueda con la misma ventana de una hora: la query es arbitraria.

## 2. Paginar la comunidad

**Estado.** `fetchCommunityReviews` en `lib/review/storage.ts` hace `select('*, profiles(...)')` ordenado por `created_at` descendente, sin `limit`. Si PostgREST responde `PGRST200` (no hay FK a `profiles`), cae a un segundo query de todas las reseñas más un `.in('id', userIds)`. `app/reviews/page.tsx` solo llama a esto si hay sesión. La policy de `app/sql/schema.sql` permite `select` a cualquiera.

**Objetivo.** La primera pintura del feed trae 20 reseñas. El resto entra al pedir más. "Mis reseñas" no recorre la tabla completa en el cliente.

**Proceso.**

1. Migración nueva, por ejemplo `app/sql/2026-reviews-pagination.sql`:

   ```sql
   create index if not exists reviews_created_at_idx
     on public.reviews (created_at desc);

   create index if not exists reviews_user_id_idx
     on public.reviews (user_id);
   ```

   No editar `schema.sql` para "agregar" índices como si la base se recreara de cero. Ese archivo ya describe una tabla que puede estar aplicada.

2. Cambiar la firma a `fetchCommunityReviews({ limit, before })`. `before` es el `created_at` del último ítem visible. Query: `.order('created_at', { ascending: false }).limit(limit)` y, si hay cursor, `.lt('created_at', before)`.

3. Query aparte para el usuario: `.eq('user_id', userId)` con el mismo límite. No bajar el feed entero para filtrar.

4. Resolver el join de perfiles de una vez. Si la FK a `profiles` sigue comentada al final de `schema.sql`, aplicar esa migración (está escrita ahí) y borrar el fallback `PGRST200` cuando el join responda. Hasta entonces, el fallback también tiene que estar limitado a los `user_id` de esa página, no de toda la tabla.

5. En la UI, un control "cargar más" que concatena. No infinite scroll en el primer paso: es más fácil de probar.

6. Sync local, en el mismo cambio de storage porque toca la misma cola:

   - Hoy `syncLocalReviews` hace `localStorage.removeItem` y después `insert`. Si el insert falla, restaura. Si dos pestañas leen la cola a la vez, las dos pueden insertar o una puede borrar lo que la otra iba a subir.
   - Nuevo orden: insertar, y solo entonces quitar del storage las que volvieron sin error. Un flag `isSyncing` en módulo no alcanza entre pestañas. Usar un lock en `localStorage` (`plotter_sync_lock` con timestamp) o sincronizar en un solo lugar (el layout, no también la página de reseñas). Hoy `handlePostAuthSync` se llama desde `getSession` y desde `onAuthStateChange`, así que el login dispara la sync dos veces. El flag mitiga eso en una pestaña; el lock lo cierra.

**Archivos.** `lib/review/storage.ts`, `app/reviews/page.tsx`, `app/sql/schema.sql` (solo como referencia de la FK), migración nueva.

**Hecho cuando.** Con más de 20 reseñas, la primera respuesta trae 20. La segunda pide el cursor y no repite filas. Un usuario ve las suyas sin descargar las ajenas. Cerrar sesión a mitad de un insert local no borra la cola.

**No hacer.** No activar Supabase Realtime para "empujar" el feed. No paginar en memoria después de un `select *`.

## 3. Cache-Control en el proxy de TMDb

**Estado.** `app/api/tmdb/route.ts` lee `request.url` y por eso la route es dinámica. El `fetch` saliente usa `next: { revalidate: 3600 }` en varios casos, así que la Data Cache de Next puede guardar el JSON de TMDb. Cada visita igual ejecuta la función. La respuesta al browser no declara `Cache-Control`.

**Objetivo.** Listados y fichas los absorbe el CDN. La función corre cuando la entrada está vieja.

**Proceso.**

1. Helper `json(data, { swr })` que setee `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` en trending, upcoming, now-playing, on-air, detalles, videos, proveedores y discover.
2. Búsqueda: `s-maxage=60` o `private, max-age=30`. No cachear una query vacía ni un 400.
3. Errores 5xx: `Cache-Control: no-store`, para no congelar un fallo una hora.
4. Medir en local con dos recargas: la segunda debería ser hit de caché del `fetch` saliente. En Vercel, el header `s-maxage` es el que evita volver a invocar la función.

**Archivos.** `app/api/tmdb/route.ts`.

**Hecho cuando.** La respuesta de `action=trending` trae `Cache-Control` público. Una búsqueda no queda cacheada una hora. Un 500 no queda cacheado.

**No hacer.** No poner `immutable` en JSON de catálogo: TMDb lo actualiza durante el día. Una hora de `s-maxage` más un día de stale-while-revalidate alcanza.

## 4. Una página de TMDb, no tres

**Estado.** Los `case` `trending`, `upcoming`, `now-playing` y `on-air` hacen `Promise.all` de las páginas 1, 2 y 3 y concatenan. Inicio pide trending de películas, trending de series y upcoming: 9 llamadas. Películas pide otras tres listas: otras 9. El carrusel muestra un puñado de tarjetas.

**Objetivo.** La primera carga pide la página 1 (20 ítems). La siguiente página se pide si el carrusel llega al final o si un grid lo necesita.

**Proceso.**

1. Cada acción de lista acepta `page` (default `1`) y devuelve `{ results, page, total_pages }` en lugar de un array pelado. El cambio de forma hay que hacerlo junto con los callers de `lib/tmdb/movies.ts` y `lib/tmdb/tv.ts`, que hoy tipan `Movie[]`.
2. Si se quiere evitar un breaking change interno, mantener el array en el helper y agregar `getTrendingMoviesPage(page)`. Lo importante es que el default deje de ser tres páginas.
3. En el carrusel, al acercarse al último ítem, pedir `page + 1` una sola vez (un ref de "ya pedí esta página").
4. El home no necesita la página 2 para pintar.

**Archivos.** `app/api/tmdb/route.ts`, `lib/tmdb/movies.ts`, `lib/tmdb/tv.ts`, `lib/tmdb/client.ts`, `app/page.tsx`, `app/movies/page.tsx`, `app/tv/page.tsx`, `components/media/MediaCarousel.tsx`.

**Hecho cuando.** El network del home muestra 3 requests a `/api/tmdb` en la primera pintura, cada una con `page=1`. Seguir deslizando pide la página 2 una vez.

**No hacer.** No precargar las 3 páginas "por si acaso" en el servidor cuando se haga la fase 6. El servidor también paga cupo.

## 5. `tmdb_id` en cada reseña

**Estado.** `reviews` guarda `title`, `year`, `review_text`, `poster_path` y `reviewer_name`. No hay id de TMDb ni tipo. No se puede listar "reseñas de esta película" sin leer todo y comparar títulos. Tampoco se puede impedir dos reseñas del mismo usuario sobre el mismo título.

**Objetivo.** Cada reseña nueva apunta a un título. El feed viejo sigue leyéndose.

**Proceso.**

1. Migración:

   ```sql
   alter table public.reviews
     add column if not exists tmdb_id integer,
     add column if not exists media_type text;

   alter table public.reviews
     drop constraint if exists reviews_media_type_check;

   alter table public.reviews
     add constraint reviews_media_type_check
     check (media_type is null or media_type in ('movie', 'tv'));

   create index if not exists reviews_title_feed_idx
     on public.reviews (tmdb_id, media_type, created_at desc);
   ```

2. Unicidad parcial, después de mirar si ya hay duplicados:

   ```sql
   create unique index if not exists reviews_one_per_user_title_idx
     on public.reviews (user_id, tmdb_id, media_type)
     where user_id is not null and tmdb_id is not null;
   ```

   Si el `create unique index` falla, hay duplicados. Listarlos y decidir si se quedan (índice sin unique) o se archivan. No borrar reseñas de usuarios para "limpiar".

3. Extender `Review` y `saveReview` con `tmdb_id` y `media_type`. El editor ya recibe `MovieDetails | TVDetails`: el id y el tipo están ahí. Las reseñas solo-locales también los guardan, para que la sync no los pierda.

4. Query de ficha: `.eq('tmdb_id', id).eq('media_type', type).order('created_at', { ascending: false }).limit(10)`.

5. Las filas anteriores quedan con null. En el feed se muestran igual. No hay backfill automático: el título guardado como texto no identifica un id de forma segura (hay homónimos).

**Archivos.** `lib/review/storage.ts`, `components/review/ReviewEditor.tsx`, migración nueva, después `app/movie/[id]/page.tsx` y `app/tv/[id]/page.tsx` (la tira de reseñas está en el doc de UX).

**Hecho cuando.** Una reseña nueva de una ficha se puede recuperar filtrando por ese id. Una reseña vieja sin id sigue en el feed. Dos reseñas del mismo usuario sobre el mismo título no se insertan: la segunda actualiza o la UI avisa. Elegir una de las dos y dejarla escrita en el editor. Actualizar es mejor: el usuario corrige su nota en lugar de chocar con un error de unique.

**No hacer.** No hacer `title` único. No exigir `tmdb_id` not null en la misma migración: rompe filas existentes y la cola local vieja.

## 6. Imágenes por el CDN de TMDb

**Estado.** Las tarjetas arman la URL `https://image.tmdb.org/t/p/...` en `getPosterUrl` / `getBackdropUrl`. Además existe `app/api/image-proxy/route.ts`, que descarga el archivo entero a la función y lo devuelve, limitado a ese host, con caché de 24 h. Hace falta para el canvas: el browser no puede leer píxeles de TMDb por CORS. `next.config.mjs` ya permite `images.domains: ['image.tmdb.org']`, pero `domains` está deprecado a favor de `remotePatterns`. Varias pantallas usan `<img>` directo. La destacada de películas pide `w780`.

**Objetivo.** La UI pide el tamaño que muestra. El proxy solo corre cuando el canvas exporta.

**Proceso.**

1. Confirmar con un grep que `image-proxy` solo lo usa `lib/review/canvas.ts` (o el editor). Si alguna grilla lo usa para mostrar pósters, sacarlo de ahí.
2. En grillas y carruseles, `next/image` con `w342` para póster y `w780` para backdrop. No `original`.
3. En `next.config.mjs`, reemplazar `images.domains` por:

   ```js
   images: {
     remotePatterns: [
       { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
     ],
   },
   ```

4. Dejar el proxy como está para el export, con el allowlist de host. No ampliarlo a otras URLs.

**Archivos.** `next.config.mjs`, `components/media/MediaCard.tsx`, `components/media/MediaCarousel.tsx`, `app/movies/page.tsx`, `lib/review/canvas.ts`, `app/api/image-proxy/route.ts`.

**Hecho cuando.** El network de una grilla pide `w342` (o el tamaño acordado) a `image.tmdb.org` o a `/_next/image`, y `/api/image-proxy` solo aparece al generar la tarjeta.

**No hacer.** No proxeear todos los pósters "para unificar". Duplica ancho de banda en la función.

## 7. Una sola ficha, y OMDb por HTTPS

**Estado.** La ficha de película pide detalles y proveedores por separado (`getMovieDetails`, `getMovieWatchProviders`). Videos tienen otro `case`. `app/api/omdb/route.ts` llama a `http://www.omdbapi.com`. Si no viene `imdbId`, vuelve a pedir TMDb para traducirlo, aunque la ficha de serie ya pide `append_to_response=external_ids` y la de película no.

**Objetivo.** Abrir una ficha cuesta un request a TMDb. OMDb, si se muestra, usa el `imdb_id` de esa respuesta y HTTPS.

**Proceso.**

1. `movie-details` pasa a `/movie/{id}?language=es-ES&append_to_response=videos,external_ids,watch/providers`. El `case` de TV, que ya pide `external_ids`, suma `videos` y `watch/providers`.
2. Los helpers devuelven un objeto con detalles, trailers y proveedores. Las pages dejan de hacer `Promise.all` de tres viajes.
3. Se pueden dejar los `case` viejos (`videos`, `watch-providers`) un tiempo, sin usarlos desde la ficha, y borrarlos cuando no haya callers.
4. OMDb: `https://www.omdbapi.com/`. Cache de un día, que ya está con `revalidate: 86400`. Si falta API key, responder 204 o un JSON vacío cacheable corto, no un 500.
5. Proveedores: el recorte AR y después US se queda en el servidor, pero la respuesta incluye `region` (`"AR"` o `"US"`) para que la UI lo diga. El cambio de copy está en el doc de UX.

**Archivos.** `app/api/tmdb/route.ts`, `app/api/omdb/route.ts`, `lib/tmdb/movies.ts`, `lib/tmdb/tv.ts`, `app/movie/[id]/page.tsx`, `app/tv/[id]/page.tsx`.

**Hecho cuando.** Abrir `/movie/[id]` produce una ida a `/api/tmdb` para el título (más OMDb solo si se pintan los porcentajes). La URL de OMDb es `https`. La UI puede leer `region`.

**No hacer.** No bloquear la ficha si OMDb falla. Los porcentajes son secundarios; el título y la reseña no.

## 8. Tope al proxy y sesión en cookie

**Estado.** Cualquiera puede llamar `/api/tmdb?action=search&query=...` y gastar el bearer. La sesión es `supabase-js` en el browser (`lib/supabase.ts`), con `getSession()` en el cliente. No está `@supabase/ssr`. RLS ya restringe insert, update y delete al `auth.uid()`.

**Objetivo.** La búsqueda no se puede martillar desde afuera. Cuando el perfil y "mis reseñas" se lean en el servidor, la cookie viaja con el request. Hasta entonces, no hace falta migrar el cliente de auth.

**Proceso.**

1. Tope primero, auth después. El tope no depende de la fase 6.
2. Límite simple por IP en `action=search`: por ejemplo 30 requests por minuto. En Vercel puede ser una regla del firewall, o un contador en memoria de la instancia si se acepta que el límite es por instancia y no global. Documentar cuál se eligió. No hace falta Upstash para la primera versión si el tráfico es bajo: un `Map` por instancia ya frena un bucle local. Si el abuso es real, pasar a un store compartido.
3. Respuesta `429` con `Retry-After`. No cachear ese 429.
4. Auth en cookie solo al renderizar en servidor algo que dependa del usuario (perfil, mis reseñas). Instalar `@supabase/ssr`, leer la sesión en el Server Component y seguir usando el cliente browser para el editor. No duplicar la lógica de login en los dos sitios: un módulo `lib/supabase/client.ts` y otro `lib/supabase/server.ts`.
5. El placeholder `https://placeholder.supabase.co` de `lib/supabase.ts` evita un crash si faltan env, y también esconde la mala config. Si faltan `NEXT_PUBLIC_SUPABASE_URL` o la anon key, fallar al construir el cliente en desarrollo con un mensaje claro.

**Archivos.** `app/api/tmdb/route.ts`, `lib/supabase.ts`, más adelante `app/reviews/page.tsx` y `components/profile/ProfileSettings.tsx`.

**Hecho cuando.** La búsqueda número 31 en un minuto recibe 429. Insertar una reseña de otro `user_id` sigue rechazado por RLS. Con las env vacías, el dev server lo dice en vez de pegarle a `placeholder.supabase.co`.

**No hacer.** No mover el bearer de TMDb al cliente. No saltear RLS "porque el servidor ya filtró".

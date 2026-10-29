# Plan de mejoras de Plotter

Documentos para retomar la revisión de octubre 2026. No cambian el producto todavía: describen el estado del código, el orden de trabajo y el criterio de hecho de cada punto.

Plotter es Next.js 14 (App Router), catálogo de TMDb detrás de `app/api/tmdb/route.ts`, y reseñas en Supabase con copia local en `localStorage`. La identidad visual (tarjeta para compartir, dónde ver, temas) se mantiene. Lo que hay que cambiar es cómo se piden los datos y cómo está armado el recorrido de reseñar.

## Documentos

| Documento | Qué cubre |
| --- | --- |
| [01-escalabilidad.md](./01-escalabilidad.md) | Caché, cuota de TMDb, paginación de reseñas, modelo, imágenes, OMDb, auth y límite del proxy |
| [02-ux-ui.md](./02-ux-ui.md) | Búsqueda, géneros, editor, comunidad, inicio, ficha, marco y controles que hoy no dicen lo que hacen |
| [03-deuda-tecnica.md](./03-deuda-tecnica.md) | Código viejo sin montar, dependencias sin uso y movimiento en móvil |

## Orden de trabajo

La revisión original proponía empezar por pasar el catálogo a Server Components. Ese paso es el más grande y el carrusel 3D, el editor y la navbar viven en cliente. Conviene no mezclarlo con el recorte de cuota.

El orden de abajo separa lo que se puede hacer sin reescribir pantallas de lo que depende de un dato nuevo.

### Fase 1. Menos llamadas, mismo contrato

Objetivo: bajar el cupo de TMDb y cachear la respuesta HTTP sin tocar el render.

1. Pedir una página de TMDb en trending, upcoming, now-playing y on-air. Hoy son tres páginas en paralelo (60 ítems) para un carrusel.
2. Agregar `page` al proxy para que el cliente pida la siguiente cuando haga falta.
3. Devolver error real (`502`) cuando TMDb falla. Hoy `tmdb()` traga el error y responde `{ results: [] }`, y la UI lo muestra como lista vacía.
4. `Cache-Control` público de una hora en listados y fichas. La búsqueda queda con TTL corto.

Hecho cuando una carga de inicio hace 3 llamadas a TMDb (películas trending, series trending, próximos), no 9, y un fallo de red no se ve como "no hay títulos".

### Fase 2. Reseñas que no leen la tabla entera

Independiente de la fase 1. Se puede hacer en paralelo.

1. `fetchCommunityReviews` pasa a pedir 20 filas con cursor por `created_at`.
2. Índices en `created_at desc` y `user_id`. Migración nueva en `app/sql/`, sin reescribir `schema.sql` como si no se hubiera aplicado.
3. "Mis reseñas" filtra en la query por `user_id`.
4. Corregir la sync local: hoy se borra `localStorage` antes del `insert`. Si dos pestañas sincronizan, una puede perder la cola. Insertar primero y borrar solo las filas confirmadas.

### Fase 3. Búsqueda y género, todavía en cliente

No hace falta Server Components para esto.

1. El filtro de género llama a discover. En películas hoy filtra los trending ya cargados por `genre_ids`. `lib/tmdb/tv.ts` ya tiene `discoverTV`; en películas el helper vive solo en el `lib/tmdb.ts` viejo.
2. Estado vacío distinto de error de red.
3. Resultados al tipear en la navbar, sin navegar ni vaciar el campo. `cmdk` ya está en `package.json` y no se usa. La página `/search` sigue existiendo para la query compartible, con páginas siguientes.

### Fase 4. La reseña apunta a un título

Antes de mostrar reseñas en la ficha.

1. Columnas nullable `tmdb_id` y `media_type` en `reviews`.
2. El editor las guarda. Las filas viejas quedan en null y siguen viéndose en el feed.
3. Índice `(tmdb_id, media_type, created_at desc)`.
4. Unicidad opcional `(user_id, tmdb_id, media_type)` solo cuando los tres están presentes, para no chocar con reseñas locales históricas.

### Fase 5. Recorrido de reseñar

1. Editor en dos pasos: nota y texto, después diseño de la tarjeta.
2. El feed de la comunidad se lee sin sesión. Publicar abre el acceso. Perfil en `/perfil`, fuera de `app/reviews/page.tsx`.
3. En la ficha, tira "En Plotter" con las reseñas de ese `tmdb_id`.

### Fase 6. Catálogo en el servidor

Recién acá, cuando el contrato del proxy (página, error, caché) ya está estable.

1. Inicio, listados y la parte de lectura de la ficha pasan a Server Components.
2. El carrusel, el editor y la navbar siguen en cliente y reciben datos por props.
3. Se elimina la caché de módulo (`let cachedTrendingMovies` y equivalentes). No sobrevive un refresh y no se comparte entre usuarios.
4. `append_to_response` junta detalle, videos e `imdb_id` en un viaje. OMDb pasa a `https` y reutiliza ese id.

### Fase 7. Borde y cuenta

1. `next/image` para pósters de la UI (`image.tmdb.org` ya está en `images.domains` de `next.config.mjs`). El proxy de `app/api/image-proxy/route.ts` queda solo para el canvas, por CORS.
2. Límite por IP en `action=search`.
3. Sesión con `@supabase/ssr` cuando "mis reseñas" y el perfil se rendericen en el servidor. RLS sigue siendo la puerta de escritura.

### Fase 8. Marco, inicio y deuda

1. En móvil, la app a sangre. El marco redondeado de `app/layout.tsx` solo en escritorio ancho. Quitar `userScalable: false`.
2. Inicio con una acción arriba del carrusel: reseñar o retomar un borrador.
3. El toggle de idioma se llama "Título original". "Dónde ver" dice la región (hoy AR, y si no hay datos, US).
4. Links de Next en lugar de `window.location.href`.
5. Borrar el código viejo de [03-deuda-tecnica.md](./03-deuda-tecnica.md) y sacar dependencias que ningún archivo importa.

## Qué no hacer en el medio

- No reescribir el editor de canvas y el data fetching en el mismo cambio.
- No exigir login para leer reseñas: la policy de `schema.sql` ya es lectura pública.
- No borrar `localStorage` de reseñas hasta que el insert responda bien.
- No paginar en el cliente trayendo igual todas las filas.
- No activar Realtime de Supabase hasta que el feed esté paginado.

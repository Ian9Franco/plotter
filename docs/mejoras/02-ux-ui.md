# UX y UI

La paleta, el neumorfismo y la tarjeta para compartir se quedan. Estos cambios son de recorrido. Varios dependen de un punto de [01-escalabilidad.md](./01-escalabilidad.md); está marcado en cada uno.

## 1. Buscar sin salir de la barra

**Estado.** `components/layout/Navbar.tsx` abre un input, y al enviar hace `router.push('/search?q=...')`, cierra el panel y borra `query`. `app/search/page.tsx` pide una sola página. Crea un `AbortController` y nunca lo pasa a `fetch`, así que un cambio rápido de filtro no cancela el request anterior. El resultado puede llegar tarde y pisar al nuevo.

**Objetivo.** Mientras se escribe, se ven pocos pósters. La query no desaparece. `/search?q=` sigue siendo la URL para compartir y para ver más.

**Proceso.**

1. En el proxy, `search` acepta `page` (el mismo contrato del punto 4 de escalabilidad).
2. En la navbar, debounce de ~200 ms a partir de 2 caracteres. Pedir `page=1` y mostrar hasta 6 resultados (póster, título, año, tipo). `cmdk` está en `package.json` y no hay ningún import: se puede usar, o un listbox propio si cmdk complica el estilo. No agregar otra librería.
3. Pasar `signal` del `AbortController` a `fetch`. Al cambiar la query, abortar la anterior.
4. Enter o "ver todos" navega a `/search?q=` sin borrar el texto hasta que la ruta cambió. Al volver, el input puede quedar vacío: la query vive en la URL.
5. En `/search`, tabs Todo / Películas / Series como ahora, más "cargar más" con `page`.
6. Cero resultados: "Nada con «query»". Error de red: "No se pudo buscar. Reintentar". Hace falta el 502 del proxy (escalabilidad, punto 3); si el proxy sigue devolviendo `[]` en un fallo, esta distinción no se puede hacer.

**Archivos.** `components/layout/Navbar.tsx`, `app/search/page.tsx`, `lib/tmdb/combined.ts`, `app/api/tmdb/route.ts`.

**Hecho cuando.** Escribir "dune" muestra pósters sin cambiar de ruta. Borrar y escribir otra cosa no deja en pantalla los resultados de la query anterior. `/search?q=dune` abre la grilla y permite una segunda página.

**No hacer.** No buscar en cada tecla sin debounce. No precargar personas: el proxy ya filtra `media_type !== 'person'`.

## 2. El género es un catálogo

**Estado.** En `app/movies/page.tsx`, elegir "Terror" hace `trendingMovies.filter(m => m.genre_ids.includes(27))` sobre lo ya descargado. Puede quedar en cero aunque TMDb tenga estrenos de terror. El `case` `discover-movies` del proxy existe y esta página no lo llama. `lib/tmdb/tv.ts` exporta `discoverTV`. El helper de películas está en `lib/tmdb.ts`, que el App Router no importa.

En series el criterio es mixto (`app/tv/page.tsx`): primero filtra el trending en memoria y solo llama a `discoverTV` si ese filtro tiene menos de 10 ítems. Con 10 o más, el usuario ve un recorte del trending, no el catálogo del género. El efecto depende de `loading`, así que al prender y apagar el spinner puede volver a correr.

Los géneros de la navbar son una lista corta hardcodeada (`MOVIE_GENRES` / `TV_GENRES` en `Navbar.tsx`), en español, sin el id al lado.

**Objetivo.** El filtro pide discover ordenado por popularidad. Vacío significa que esa query no trajo filas, no que el trending de la semana no incluía el género.

**Proceso.**

1. Mapa único de género a id, compartido por navbar y página. Hoy el mapa de películas está dentro de `MoviesPageContent` y los labels están en la navbar. Una fuente, por ejemplo `lib/tmdb/genres.ts`.
2. Agregar `discoverMovies(genreId, page)` en `lib/tmdb/movies.ts`, paralelo a `discoverTV`.
3. Si `genre` en la query no es "Todo", no usar el array de trending. Pedir discover, página 1, y paginar igual que la búsqueda.
4. Vacío: "No hay películas de Terror en este listado" y un botón para volver a Todo. Error: "No se pudieron cargar" y reintentar. No un grid en blanco.
5. "Todo" sigue mostrando los carruseles (tendencias, cines, próximos). El filtro no tiene que apagar esa vista mezclando dos modelos: o carruseles, o grilla de discover. Eso ya está esbozado; el bug es de dónde salen los ítems de la grilla.
6. En series, dejar de usar el umbral de 10 ítems locales. El género siempre llama a `discoverTV`, con página. Sacar `loading` de las dependencias de ese efecto para que no se redispare al terminar la carga.

**Archivos.** `app/movies/page.tsx`, `app/tv/page.tsx`, `components/layout/Navbar.tsx`, `lib/tmdb/movies.ts`, `lib/tmdb/tv.ts`, nuevo `lib/tmdb/genres.ts`.

**Hecho cuando.** "Terror" muestra una grilla que viene de `/api/tmdb?action=discover-movies&genreId=27`, no de un filter sobre trending. Una lista vacía de verdad y un error de red no se ven igual.

**No hacer.** No listar los 19 géneros de TMDb en el primer paso si el menú actual es deliberadamente corto. Sí se puede ampliar después usando el mismo mapa. No traducir el id en el cliente con un includes sobre 60 ítems "además" de discover.

## 3. Reseñar en dos pasos

**Estado.** En la ficha, `ReviewEditor` no se monta hasta "escribir reseña". Cuando aparece, muestra a la vez formato (1:1, 4:5, 9:16), textura, cinco colores de tarjeta, seis de fondo y cuatro tipografías. El archivo tiene cerca de 900 líneas. El default es 9:16, que encaja con una historia.

**Objetivo.** Primero la reseña (nota y texto). Después, quien quiera, diseña y descarga la tarjeta. Las dos cosas siguen existiendo.

**Proceso.**

1. Partir el componente sin cambiar `lib/review/canvas.ts` en el mismo paso. El canvas se queda. Cambia el orden en que se ven los controles.
2. Paso 1, "Tu reseña": estrellas, texto, nombre (precargado del perfil, como ahora), guardar. Guardar llama a `saveReview` con `tmdb_id` y `media_type` cuando el punto 5 de escalabilidad esté. Si todavía no está, guardar como hoy y dejar el campo listo en el tipo para no rehacer el formulario.
3. Paso 2, "Tarjeta": formatos, textura, colores, fuentes, preview y descarga. Se abre con un botón "Diseñar tarjeta" después de tener nota o texto. No hace falta haber guardado en la nube para descargar: hoy la descarga es local y tiene que seguir siéndolo.
4. En móvil, la descarga queda visible sin scrollear todo el panel de colores. Un pie sticky con "Descargar" en el paso 2.
5. Default de formato se queda en 9:16. No cambiar el default en este trabajo.

**Archivos.** `components/review/ReviewEditor.tsx`, `app/movie/[id]/page.tsx`, `app/tv/[id]/page.tsx`.

**Hecho cuando.** Se puede guardar una reseña sin abrir texturas ni paletas. Se puede descargar la tarjeta como ahora. En un ancho de teléfono, "Descargar" se ve al entrar al paso 2.

**No hacer.** No rediseñar las paletas ni las texturas. No obligar a crear cuenta para descargar la imagen.

## 4. La comunidad se lee sin cuenta

**Estado.** `app/reviews/page.tsx` (cerca de 700 líneas) mezcla login, alta, perfil, listado y borrado. `loadReviews` corre solo si `user` está seteado. La policy permite leer sin sesión. Quien no entra no ve reseñas de otros.

**Objetivo.** El feed es público. La cuenta hace falta para publicar, editar el perfil y borrar lo propio. El perfil no vive en la misma pantalla que el login.

**Proceso.**

1. Al montar la página, pedir la página 1 del feed aunque `user` sea null. Depende de la paginación (escalabilidad, punto 2). Si se hace antes, al menos no condicionar el fetch a la sesión: el problema de traer todo sigue, pero el producto deja de esconder el feed.
2. El formulario de email y contraseña pasa a un panel que se abre al publicar o al elegir "entrar". No es la vista por defecto.
3. Extraer el perfil a `app/perfil/page.tsx` usando `components/profile/ProfileSettings.tsx`. La página de reseñas queda en listar y borrar.
4. Borrar solo si `review.user_id === user.id`. Si RLS falla, mostrar el error. No ocultar el botón y además confiar solo en el cliente: RLS ya está y es la barrera real.
5. Separar el archivo cuando se toque. Un componente para el feed y otro para el formulario. No hace falta un rediseño visual.

**Archivos.** `app/reviews/page.tsx`, `components/profile/ProfileSettings.tsx`, nueva `app/perfil/page.tsx`, `lib/review/storage.ts`.

**Hecho cuando.** Sin sesión se ven reseñas. Sin sesión, publicar abre el acceso. Borrar una reseña ajena no aparece como acción y, si se fuerza, RLS la rechaza. El perfil se edita en `/perfil`.

**No hacer.** No pedir cuenta para leer. No dejar el formulario de alta como primer bloque de la página.

## 5. Inicio con una acción

**Estado.** `app/page.tsx` renderiza `TrendingCarousel` y, si hay datos, "Próximos estrenos". No hay forma de retomar una reseña ni un atajo a "reseñar algo".

**Objetivo.** Arriba del carrusel, una sola acción clara. El descubrimiento sigue debajo.

**Proceso.**

1. Una franja corta, no un segundo hero. Texto del estilo "Reseñá lo último que viste" y un campo que usa la misma búsqueda de la navbar (punto 1 de este doc), o un link a `/search` si la búsqueda inline todavía no está.
2. Si hay reseñas locales sin sincronizar, la franja dice cuántas y ofrece entrar para subirlas. Lee `getLocalReviews()`. No inventar un sistema de borradores nuevo: la cola local ya es el borrador.
3. No duplicar los carruseles de `/movies` en el home. Hoy el home ya es más corto que películas. Mantenerlo así. La acción es lo que se agrega.

**Archivos.** `app/page.tsx`, `lib/review/storage.ts`, `components/home/TrendingCarousel.tsx` solo si hay que correrlo hacia abajo.

**Hecho cuando.** En inicio, antes del carrusel, se puede ir a buscar un título para reseñar. Si hay reseñas solo en este navegador, se ven contadas.

**No hacer.** No convertir el home en la página de películas. No autoabrir el editor.

## 6. Reseñas en la ficha del título

**Depende de.** `tmdb_id` (escalabilidad, punto 5) y el feed paginado.

**Estado.** La ficha deja escribir y no muestra lo que otros escribieron de ese título.

**Objetivo.** Bajo el hero y los proveedores, una tira "En Plotter" con hasta 10 reseñas de ese id. Si no hay, no se muestra un bloque vacío: se muestra la invitación a escribir, que ya existe.

**Proceso.**

1. Query del punto 5 de escalabilidad, límite 10.
2. Cada ítem: nombre, nota, un recorte del texto, fecha. Link al feed del autor solo si más adelante hay ruta de perfil público. En el primer paso, no.
3. La reseña del usuario, si existe, va primera y el botón pasa a "Editar tu reseña" (alineado con la decisión de actualizar en vez de insertar otra).

**Archivos.** `app/movie/[id]/page.tsx`, `app/tv/[id]/page.tsx`, `lib/review/storage.ts`, un componente chico en `components/review/`.

**Hecho cuando.** Dos cuentas reseñan la misma película y ambas ven las dos en esa ficha. Otra película no las muestra.

**No hacer.** No mezclar en esa tira reseñas sin `tmdb_id`. No cargar el feed global para filtrarlo en el cliente.

## 7. El marco no se come la pantalla

**Estado.** `app/layout.tsx` pone `overflow-hidden` en `html` y `body`, y mete la app en una tarjeta `max-w-[1440px]` con borde, radio 24/36 px y padding `p-3 md:p-5`. El scroll vive adentro. La navbar es `fixed` respecto del viewport (`components/layout/Navbar.tsx`), no de esa tarjeta, así que en escritorio puede no coincidir con el marco. `viewport` tiene `maximumScale: 1` y `userScalable: false`, que impide el zoom.

**Objetivo.** En el teléfono, el contenido usa el ancho. El marco es un tratamiento de escritorio. Se puede hacer zoom.

**Proceso.**

1. Quitar `userScalable: false` y `maximumScale: 1`. Dejar `width: device-width` e `initialScale: 1`.
2. Por debajo de `md`, sacar padding exterior, radio y borde. El fondo de la página y el de la app son el mismo, así no queda un segundo rectángulo.
3. De `md` para arriba, se puede conservar el marco si es parte de la marca. La navbar tiene que ser sticky dentro del contenedor que scrollea, no `fixed` al viewport. Si el scroll sigue en un div interno, la navbar va dentro de ese div.
4. Probar inicio, ficha y reseñas en un ancho ~390 px y en uno ancho. El carrusel no puede quedar con dos scrolls (el de la página y el del carrusel horizontal está bien; dos verticales no).

**Archivos.** `app/layout.tsx`, `components/layout/Navbar.tsx`, `app/globals.css` si el scroll está forzado en una clase `page-content`.

**Hecho cuando.** En 390 px no hay margen gris alrededor de la app. Se puede pellizcar para zoom. La navbar no queda flotando fuera del marco en escritorio.

**No hacer.** No quitar el tema ni el radio en escritorio si eso es la marca. No cambiar `overflow` sin mirar el carrusel: un `overflow: visible` en el padre rompe el recorte de las tarjetas 3D.

## 8. Que cada control diga lo que hace

Tres ajustes chicos. Pueden ir en cualquier fase, juntos.

**Idioma.** `hooks/useLanguage.ts` solo alterna título original y título localizado (`plotter_use_original_titles`). La interfaz queda en español. El control de `components/layout/LanguageToggle.tsx` no debería llamarse como un cambio de idioma de la app. Label: "Título original" / "Título en español", según el estado. No implementar i18n de toda la UI en este plan.

**Dónde ver.** El proxy usa resultados de Argentina y, si no hay, de Estados Unidos, sin decirlo. Cuando la respuesta incluya `region` (escalabilidad, punto 7), `components/detail/WatchProviders.tsx` muestra "Argentina" o "Estados Unidos". Hay otro `components/ui/WatchProviders.tsx`: confirmar cuál está montado y no editar el muerto.

**Navegación de la destacada.** En `app/movies/page.tsx` la tarjeta destacada hace `window.location.href = /movie/${id}`. Eso recarga el documento y tira la memoria de la pestaña. Cambiar a `Link` de `next/link`. Buscar el mismo patrón en series.

**Hecho cuando.** El toggle no promete traducir la interfaz. "Dónde ver" nombra el país. Abrir la destacada no recarga la app entera.

**No hacer.** No agregar inglés de interfaz "porque el README lo menciona". El README habla de ES/EN; el código solo cambia el título. Corregir el README en una línea cuando se renombre el control, para que no vuelva a prometer i18n.

# Deuda técnica

Nada de esto bloquea las fases 1 a 5. Conviene hacerlo cuando se toque el área, o en la fase 8, para no mezclar un borrado masivo con un cambio de datos.

## Código que el App Router no monta

Estos archivos se importan entre sí. Ningún archivo de `app/` los importa.

| Archivo | Notas |
| --- | --- |
| `components/Navbar.tsx` | Reemplazado por `components/layout/Navbar.tsx` |
| `components/Footer.tsx` | Reemplazado por `components/layout/Footer.tsx` |
| `components/Hero.tsx` | |
| `components/Hero copy.tsx` | Copia con espacio en el nombre |
| `components/SearchBar.tsx` | Hay `components/home/SearchBar.tsx` |
| `components/MovieCard.tsx` | La grilla viva usa `components/media/MediaCard.tsx` |
| `components/PopularMovies.tsx` | |
| `components/DynamicContent.tsx` | Único caller de `discoverMoviesByGenre` |
| `components/ContentGrid.tsx` | La grilla viva es `components/media/MediaGrid.tsx` |
| `lib/tmdb.ts` | El cliente vivo está en `lib/tmdb/` |
| `types/movie.ts` | Los tipos vivos están en `lib/tmdb/types.ts` |

`components/ui/WatchProviders.tsx` convive con `components/detail/WatchProviders.tsx`. Antes de borrar, grep de imports. Lo mismo con cualquier fila de la tabla: el grep de esta revisión no encontró imports desde `app/`, y hay que repetirlo el día del borrado por si algo nuevo los usa.

**Proceso.**

1. Grep del nombre del archivo en `*.ts` y `*.tsx`.
2. Si el único caller es otro archivo de esta lista, se borran juntos.
3. `discoverMovies` hay que portarlo a `lib/tmdb/movies.ts` antes de borrar `lib/tmdb.ts`. Si no, el plan de géneros pierde la referencia. `lib/tmdb/tv.ts` ya tiene `discoverTV`.
4. No mover estos archivos a una carpeta `legacy/`. Si no se montan, se borran.

**Hecho cuando.** `npm run build` pasa y no queda `Hero copy.tsx`.

## Dependencias que ningún archivo importa

En `package.json` están y un grep de imports no las encontró en `.ts` / `.tsx`:

- `cmdk`. Excepción: el plan de búsqueda puede usarla. No desinstalarla hasta decidir el listbox de la navbar. Si el listbox se hace a mano, ahí sí se saca.
- `recharts`
- `html2canvas`
- `html-to-image`

El export de la tarjeta usa canvas nativo en `lib/review/canvas.ts`. Las dos librerías de captura de DOM no participan.

El kit de Radix (`@radix-ui/react-*` en bloque) entró con el preset de shadcn. Solo vale la pena sacarlo cuando se confirme, componente por componente, que `components/ui/*` no lo importa. No borrar el bloque entero a ciegas: un botón o un dialog puede estar usando uno.

**Proceso.** Por cada dependencia candidata: grep del nombre del paquete. Si no hay import, quitarla de `package.json` y regenerar el lock con `npm install`. Un paquete por commit si se hace junto con otra cosa, o uno solo si es solo limpieza. Build después.

**Hecho cuando.** `package.json` no lista `recharts`, `html2canvas` ni `html-to-image`, y el build sigue en verde. `cmdk` está o usada en la navbar o fuera del package.

## Movimiento

`components/layout/PageTransition.tsx` envuelve cada página con Framer Motion. El carrusel de inicio usa perspectiva 3D. En un teléfono bajo eso se siente antes que el costo de red.

**Proceso.**

1. Si `window.matchMedia('(prefers-reduced-motion: reduce)')` coincide, el carrusel muestra una fila horizontal sin la rotación en perspectiva, y la transición de página es un corte, no un spring.
2. No sacar Framer de una vez. Primero respetar la preferencia del sistema.
3. Medir después de la fase 1. Si el problema era el fan-out de imágenes, el motion puede no ser el cuello.

**Archivos.** `components/home/TrendingCarousel.tsx`, `components/layout/PageTransition.tsx`.

**Hecho cuando.** Con "reducir movimiento" activado en el sistema, cambiar de ruta no anima y el carrusel se desplaza en plano.

## Orden sugerido dentro de la deuda

1. Portar `discoverMovies` (lo pide el doc de UX). Recién después borrar `lib/tmdb.ts` y `DynamicContent.tsx`.
2. Borrar el resto de la tabla de código muerto.
3. Sacar `html2canvas`, `html-to-image` y `recharts`.
4. `prefers-reduced-motion`.
5. Radix, solo con la lista de imports en la mano.

No mezclar el paso 2 con una fase de producto. Un diff de borrado se revisa solo.

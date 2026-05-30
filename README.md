# 🎬 Plotter

Plotter es una plataforma web premium de descubrimiento y crítica cinematográfica diseñada especialmente para cinéfilos. Desarrollada con **Next.js 14** (App Router) y **TypeScript**, combina una experiencia visual inmersiva de alta fidelidad inspirada en el **Neumorfismo Profundo (Deep Neumorphism)** y el **Glassmorphism**, junto con un potente motor de renderizado de imágenes para compartir reseñas en redes sociales.

A diferencia de una base de datos convencional de películas, Plotter está pensada para ser una herramienta de expresión. Su funcionalidad principal incluye un **Generador de Tarjetas de Reseña Cinematográfica**, el cual permite a los usuarios calificar, reseñar y personalizar piezas gráficas espectaculares listas para descargar y compartir directamente en Instagram (Stories/Posts), Twitter o TikTok.

---

## 📸 Capturas e Identidad Visual

Para Plotter, la estética no es un agregado, es el núcleo de la experiencia. Toda la interfaz sigue un esquema de **sombras suaves calculadas con precisión matemática**, bordes redondeados orgánicos, transparencias glassmórficas balanceadas y microanimaciones fluidas que hacen sentir a la aplicación "viva" y responsiva a cada toque.

* **Logotipo oficial (Modo Claro):** `public/plottericon_black.png`
* **Logotipo oficial (Modo Oscuro):** `public/plottericon_white.png`
* **Favicon:** `app/favicon.ico`

---

## ✨ Características Principales en Detalle

### 1. Descubrimiento Cinematográfico de Vanguardia
* **Banner Hero Dinámico**: Un fondo inmersivo de pantalla completa que cambia de forma reactiva según el elemento seleccionado en los carruseles. Incluye un gradiente de atenuación para garantizar la perfecta legibilidad del texto en cualquier pantalla.
* **Carrusel 3D Interactivos (Inicio)**: Diseñado en perspectiva real (`perspective: 1200px`) utilizando **Framer Motion** para crear un efecto de profundidad de cartas tridimensionales flotantes que giran al deslizar.
* **Carrusel Cartoon Neobrutalista (Series)**: Un slider único que mezcla la estética neobrutalista (bordes gruesos negros, sombras duras sólidas de `4px` y `8px`, y colores pastel contrastantes) con el flujo fluido del banner principal.
* **Sección de Proveedores de Streaming (Watch Providers)**: Integración en tiempo real para mostrar dónde ver, alquilar o comprar la producción seleccionada según la región geográfica del usuario, consumiendo la API oficial de JustWatch/TMDb.

### 2. Generador Creativo de Tarjetas de Reseñas (Canvas Engine)
El corazón interactivo de Plotter. Incluye un espacio de diseño interactivo donde el usuario es el creador de contenido:
* **Control del Canvas**: Renderiza dinámicamente un lienzo HTML5 Canvas de alta resolución con soporte anti-aliasing para dispositivos retina.
* **Personalización de Texturas**: Permite aplicar overlays de textura sobre la tarjeta (grano analógico, papel arrugado, ruido digital, lienzo).
* **Tipografías y Estilos**: Selección de tipografías premium desde fuentes serif clásicas hasta modernas sans-serif y cursivas elegantes.
* **Paletas de Colores Dinámicas**: Esquemas de color adaptativos para los textos, estrellas de calificación y cajas contenedor.
* **Descarga Inmediata**: Conversión limpia a imagen PNG optimizada para exportación directa sin pérdida de resolución.

### 3. Sistema de Filtros Inteligente y Carga Perezosa (Lazy Loading)
* **API Proxy Optimizada**: Rutas del lado del servidor de Next.js (`/api/tmdb` y `/api/omdb`) que encapsulan los tokens de seguridad y realizan peticiones concurrentes de hasta 3 páginas a la vez (obteniendo 60 resultados en lugar de los 20 estándar).
* **Lazy Loading Fisiológico**: Toda la interfaz utiliza técnicas de carga diferida nativa de imágenes (`loading="lazy"`) y componentes dinámicos con `Suspense` y skeletons personalizados, lo que previene el parpadeo de pantalla y minimiza el uso de datos.
* **Filtros por Género en Tiempo Real**: Un menú desplegable neumórfico impecable que permite filtrar al instante el contenido. En la sección de Series, el grid se oculta inteligentemente si está seleccionado "Todo" para favorecer la navegación limpia, y se activa al buscar géneros específicos.

### 4. Soporte Multilingüe Integrado
* Gancho de estado global (`useLanguage`) con traducción rápida entre **Español (ES)** e **Inglés (EN)** para títulos, sinopsis y etiquetas clave, persistido dinámicamente.

---

## 🎨 El Sistema de Diseño: Neumorfismo Profundo (Deep Neumorphism)

Plotter se destaca por un uso sumamente pulido del neumorfismo. Para evitar las típicas interfaces neumórficas "sucias" o con bordes demasiado contrastados y brillantes, se refinaron las variables CSS en `app/globals.css` logrando sombras ambientales súper sutiles y bordes biselados integrados cromáticamente con el fondo.

### Variables Neumórficas Clave

#### Modo Claro (Light Mode)
* `---nm-light`: `rgba(255,255,255,0.4)` (Sombras de luz suaves, sin rim fluorescentes).
* `---nm-dark`: `rgba(163,177,198,0.35)` (Sombra de caída orgánica en tonos azulados fríos).
* `---nm-glow-orange`: Glow de marca en color naranja sutil e inmersivo.

#### Modo Oscuro (Dark Mode)
* `---nm-light`: `rgba(255,255,255,0.015)` (Casi imperceptible, evita que los elementos parezcan encendidos en la noche).
* `---nm-dark`: `rgba(0,0,0,0.85)` (Sombra de oclusión ultra profunda para simular extrusión real).

### Utilidades de Profundidad CSS
* `.nm-raised`: Elementos extruidos que sobresalen de la superficie base.
* `.nm-raised-lg`: Grandes tarjetas o modales con sombreado de alta dispersión (blur elevado).
* `.nm-inset`: Cavidades presionadas hacia adentro del fondo (usado para inputs, campos de texto y botones presionados).
* `.nm-pill`: Estructuras tubulares neumórficas perfectas para botones de interacción rápida.

---

## 🚀 Arquitectura y Tecnologías

* **Next.js 14**: Rutas de servidor optimizadas e hibridación de renderizado (Server & Client Components).
* **Tailwind CSS**: Maquetación utilitaria responsiva a nivel milimétrico.
* **Framer Motion**: Control absoluto de transiciones de página dinámicas y animaciones físicas basadas en resortes (`spring` configurations).
* **Lucide React**: Biblioteca de iconos vectoriales consistentes y estilizados.
* **Canvas API**: Renderizado pixel-perfect a medida para exportación gráfica en el cliente.

---

## 🛠️ Instalación y Configuración Local

### Requisitos Previos
* **Node.js** v18.17.0 o superior.
* Gestor de paquetes **npm** (o yarn/pnpm).

### 1. Clonar el repositorio
```bash
git clone https://github.com/Ian9Franco/plotter.git
cd plotter
```

### 2. Instalar las dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto con la siguiente estructura de credenciales:

```env
# Token de acceso de lectura de TMDb (Bearer Token)
TMDB_BEARER_TOKEN=tu_token_bearer_de_tmdb_aqui

# Clave de API de OMDb para clasificaciones adicionales (Metacritic/Rotten Tomatoes)
OMDB_API_KEY=tu_omdb_key_aqui
```

* **¿Cómo obtener las llaves?**
  * Consigue tu token de TMDb en: [The Movie Database Developer Console](https://developer.themoviedb.org/).
  * Consigue tu API Key de OMDb en: [OMDb API Key Request](http://www.omdbapi.com/apikey.aspx).

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible y corriendo localmente en [http://localhost:3000](http://localhost:3000).

### 5. Compilar para producción
Para compilar y verificar la optimización de bundles y el prerenderizado estático de rutas:
```bash
npm run build
npm run start
```

---

## 📝 Licencia y Créditos

* **Diseñado y desarrollado en su totalidad por Ian** (Portafolio: [https://ian-pontorno-portfolio.vercel.app/](https://ian-pontorno-portfolio.vercel.app/)).
* Toda la información de películas, series, pósteres y backdrops es provista de forma gratuita por la API de **TMDb**.
* Los porcentajes detallados de puntuaciones son provistos por la API de **OMDb**.

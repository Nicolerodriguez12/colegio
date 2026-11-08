# Colegio José Francisco Caldas — Supabase

Proyecto fuente para GitHub y Netlify (Vite). Esta versión sustituye la antigua autenticación de demostración por **Supabase Auth**, con un único administrador habilitado mediante `public.perfiles`.

## Archivos para modificar
- `src/portal.js`: interfaz y lógica de acceso, formularios y consultas a Supabase.
- `src/styles.css`: apariencia institucional azul y estilos.
- `src/main.js`: punto de entrada.
- `public/logo_jose.png`: escudo institucional.
- `respaldo_codigo_original/src/`: copia sin ejecutar del código React original.

## Ejecutar
`npm ci` y `npm run dev`; para publicar `npm run build` (genera `dist`). Netlify lee `netlify.toml` y publica `dist` desde GitHub `main`.

## Seguridad y datos
- Solo clave PUBLICABLE en `src/portal.js`, jamás claves privadas.
- Las tablas y políticas RLS deben existir en Supabase (SQL previamente ejecutado).
- Las contraseñas se verifican con Supabase Auth, no se almacenan en código ni en localStorage.
- No se importan datos de la versión anterior.
- Las calificaciones se guardan como 3 notas entre 0 y 5; el promedio 30/30/40 se calcula en PostgreSQL.
- Este sistema solo habilita el acceso de un administrador; no habilita portales de docentes o estudiantes aunque su diseño de datos los contemple.
- Antes de usar datos personales reales de menores, probar permisos y revisar privacidad, copias de seguridad y controles de seguridad.

## Subida a GitHub
Cargar el contenido del proyecto como fuente, no la carpeta `dist` ni el ZIP de despliegue manual. Si se reemplaza el repositorio completo, mantener la rama `main`, `netlify.toml` y la configuración GitHub-Netlify.

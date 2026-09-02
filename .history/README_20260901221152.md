# Portal Escolar

Aplicación web local-first para gestionar usuarios, estudiantes y notas.

## Funcionalidades
- Inicio de sesión y registro de usuarios.
- Roles: administración, docente y estudiante.
- Alta de estudiantes.
- Registro y consulta de notas.
- Persistencia en `localStorage` para pruebas rápidas.

## Credenciales de ejemplo
- Administración: `admin@colegio.test` / `Admin123`
- Docente: `docente@colegio.test` / `Docente123`
- Estudiante: `alumno@colegio.test` / `Alumno123`

## Desarrollo
1. Instala dependencias.
2. Ejecuta `npm run dev`.
3. Abre la URL que muestre Vite.

## Despliegue en Netlify
1. Sube este proyecto a GitHub.
2. En Netlify, crea un sitio nuevo desde GitHub.
3. Usa `npm run build` como comando de build.
4. Usa `dist` como carpeta de publicación.

## Siguiente paso sugerido
Conectar esta base a una API y una base de datos real para manejar usuarios y notas de forma segura.

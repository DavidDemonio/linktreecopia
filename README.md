# LinktreeCopia

Proyecto full-stack inspirado en Linktree con Express + React (Vite) y TailwindCSS. Toda la información se almacena en archivos JSON locales.

## Requisitos

- Node.js 18+
- npm 9+

## Configuración

1. Clona el repositorio y entra al directorio.
2. Copia `.env.example` a `.env` (puedes usar los valores de referencia siguientes).
3. Ejecuta `npm install` para instalar dependencias de frontend y backend.

Variables de entorno:

```
ADMIN_USER=admin
ADMIN_PASS=admin123
SESSION_SECRET=supersecret
PORT=3000
```

Opcional: `HASH_SALT` para personalizar el hash de visitantes únicos.

Los datos persistentes se guardan en `data/` (`links.json`, `categories.json`, `stats.json`, `users.json`).

## Scripts

- `npm run dev`: ejecuta backend en `http://localhost:3000` y frontend (Vite) en `http://localhost:5173` con proxy a la API.
- `npm run build`: compila el frontend y prepara el backend.
- `npm start`: levanta el backend en modo producción sirviendo el frontend estático desde `frontend/dist`.

## Flujo

1. Página pública (`/`): muestra los enlaces activos con filtros por categoría y búsqueda. Cada clic redirige a `/go/:slug`, actualiza los contadores y redirige al destino real.
2. Panel administrativo (`/admin`): requiere login (usuario/contraseña definidos en `.env`). Desde allí puedes crear, editar, eliminar y reordenar enlaces y categorías, además de revisar analíticas básicas por enlace.
3. Los cambios en los archivos JSON se guardan de forma atómica, por lo que no se necesita reiniciar el servidor para ver las modificaciones.

## Producción

1. Configura las variables de entorno.
2. Ejecuta `npm install && npm run build`.
3. Inicia con `npm start`. Express servirá los archivos compilados de Vite y expondrá las rutas API.

## Seguridad

- Sesiones con cookie HTTP-only.
- Protección CSRF en todas las rutas `POST/PUT/PATCH/DELETE` de `/admin/api`.
- Validaciones con Zod para entradas de enlaces y categorías.
- Límite de tasa en `/go/:slug`.
- Helmet + CORS configurado para separar frontend/backend durante desarrollo.

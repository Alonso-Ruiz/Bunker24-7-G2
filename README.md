## Bunker 24/7 — Sistema de Inventario (breve)

> Aplicación SPA para gestionar inventario: productos, categorías, proveedores, movimientos y alertas. Autenticación con Supabase y UI rápida con Vite + React + TypeScript.

Características principales
- Inicio de sesión con Supabase (auth client).
- CRUD de Productos, Categorías y Proveedores.
- Registro/creación de usuarios desde el panel (metadata: nombre/apellido).
- Movimientos de inventario y alertas de stock (triggers/migraciones incluidas).
- Notificaciones y confirmaciones con SweetAlert2 para mejor UX.

Tecnologías
- Frontend: Vite, React 18, TypeScript, Tailwind CSS.
- BaaS/DB: Supabase (Postgres). Migraciones en `supabase/migrations/`.
- Backend: Spring Boot (esqueleto en `backend/`, usa Maven Wrapper).

Estructura relevante
- `src/` — código frontend (componentes, context, lib).
- `src/lib/supabase.ts` — configuración cliente Supabase (usa VITE_* env vars).
- `supabase/migrations/` — archivo SQL con esquema, triggers y políticas RLS.
- `backend/` — proyecto Spring Boot (opcional en dev).

Variables de entorno
- En la raíz hay `.env.example` con ejemplos para el frontend:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
- NO subas ni expongas la `service_role` key en el frontend. Si necesitas crear usuarios/acciones administrativas, hazlo desde un backend seguro.

Cómo correr el proyecto (Windows PowerShell)

1) Frontend (desarrollo)

```powershell
cd C:\Users\Usuario\Desktop\project
npm install
npm run dev
```

- Abre: http://localhost:5173
- Para build de producción:

```powershell
npm run build
npm run preview
```

2) Backend (opcional: Spring Boot)

Requisitos: Java 17+ y el Maven Wrapper incluido.

```powershell
cd C:\Users\Usuario\Desktop\project\backend
.\mvnw.cmd spring-boot:run
# O para construir el JAR y ejecutar:
.\mvnw.cmd clean package
java -jar target\*.jar
```

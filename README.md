# JM Facturación

Sistema de **cotización, facturación y control financiero** para empresas
dominicanas de compra y venta de productos y servicios bajo pedido.

> **Estado:** Tanda 1 — Cimientos. Solo infraestructura. El sistema de
> diseño, la autenticación y los módulos de negocio llegan en tandas
> posteriores.

## Stack

- **Next.js 15** (App Router) + **TypeScript** estricto
- **Tailwind CSS 3**
- **Supabase** (PostgreSQL · Auth · Storage · RLS)
- **Zod** para validación
- Despliegue en **Vercel** desde la rama `main`

## Requisitos

- Node.js `>= 20`

## Puesta en marcha local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno a partir del ejemplo
cp .env.example .env.local
# …y rellenar los valores de Supabase

# 3. Levantar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Copia `.env.example` a `.env.local` y complétalo. **Nunca** subas
`.env.local` al repositorio.

| Variable | Ámbito | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Público | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público | Clave anónima (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** | Clave `service_role`. Jamás exponer al navegador |
| `NEXT_PUBLIC_SITE_URL` | Público | URL pública del sitio |

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos (`tsc --noEmit`) |

## Seguridad — Estándar Fort Knox

La seguridad va horneada desde la primera línea:

- `service_role` **solo** en servidor (`import "server-only"`), nunca con
  prefijo `NEXT_PUBLIC_`.
- Cabeceras de seguridad completas (CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Validación de todo el entorno con Zod.
- Secretos fuera del repo: solo `.env.example` con placeholders vacíos.
- RLS + FORCE en todas las tablas (Tanda 3 en adelante).

## Estructura

```
app/                 Rutas y layout (App Router)
lib/
  env.ts             Validación de variables de entorno (Zod)
  supabase/
    client.ts        Cliente de navegador (anon key)
    server.ts        Cliente de servidor (anon key + cookies)
    admin.ts         Cliente administrativo (service_role, server-only)
middleware.ts        Refresco de sesión de Supabase
next.config.mjs      Cabeceras de seguridad Fort Knox
```

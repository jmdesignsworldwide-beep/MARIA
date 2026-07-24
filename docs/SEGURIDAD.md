# Seguridad — Estándar Fort Knox

Resumen de las medidas de seguridad aplicadas en JM Facturación, horneadas
desde la primera tanda (no como un parche al final).

## Autenticación y acceso
- **Supabase Auth** con sesiones en cookies HTTP-only, refrescadas por
  middleware en cada navegación.
- **Protección de rutas en el servidor**: el layout autenticado llama a
  `requireUser()` antes de renderizar nada; el middleware redirige a `/login`
  a quien no tenga sesión.
- **Vigencia de cuentas validada en el servidor**: las cuentas demo con
  `access_expires_at` vencido o `is_active = false` se bloquean y se les
  cierra la sesión (`/auth/cerrar`) — nunca solo en la UI.
- **Sin auto-escalada de rol**: el usuario solo puede editar su nombre y
  correo (permisos por columna en Postgres); el rol lo cambia el admin.

## Aislamiento de datos (RLS)
- **RLS + FORCE en todas las tablas**; políticas por `owner_id = auth.uid()`.
- El rol `anon` (llave pública) **no tiene acceso** a ninguna tabla de
  negocio.
- **Bitácora inviolable**: para el rol `authenticated`, `UPDATE` y `DELETE`
  están revocados a nivel de Postgres (verificado: responde 403).

## Llaves y secretos
- `service_role` **solo en el servidor** (`import "server-only"`), jamás con
  prefijo `NEXT_PUBLIC_` ni en el repositorio.
- Secretos fuera del código: solo `.env.example` con placeholders.
- Validación de variables de entorno con **Zod** al arranque.

## Funciones y numeración
- Numeración de documentos por **trigger `SECURITY DEFINER`** con bloqueo de
  fila (anti-duplicados por concurrencia), `search_path` fijo y `EXECUTE`
  revocado de `anon`/`authenticated`.
- Utilidad, margen, ITBIS y saldos calculados por la **base de datos**, nunca
  confiando en el frontend.

## Almacenamiento
- Bucket **privado** `recibos`; acceso por **URLs firmadas** de corta
  duración. Políticas acotadas a la carpeta del dueño (`{auth.uid()}/…`).

## Cabeceras y transporte
- CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` suprimido.
- Toda entrada validada y sanitizada con **Zod en el servidor**.

## Dependencias
- `npm audit` sin vulnerabilidades conocidas (`overrides` donde el árbol lo
  requiere).

## Cierre de cada tanda
- **Supabase Security Advisor** como paso de cierre. Único aviso restante:
  *leaked password protection* (HaveIBeenPwned), disponible solo en el plan
  **Pro** de Supabase — decisión de negocio, no un fallo del código.

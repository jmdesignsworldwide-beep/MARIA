import { z } from "zod";

/**
 * Validación de variables de entorno con Zod (Estándar Fort Knox #4).
 * Falla ruidosamente en el arranque si falta configuración crítica,
 * en lugar de romperse silenciosamente en producción.
 *
 * Las variables `NEXT_PUBLIC_*` deben referenciarse por su nombre
 * completo para que Next.js las inserte en el bundle del cliente.
 */

// --- Entorno público (navegador + servidor) ---
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL debe ser una URL válida")
    .default("http://localhost:3000"),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

/**
 * Lee y valida el `service_role` — SOLO debe llamarse desde el servidor.
 * Se evita `import "server-only"` en este archivo porque `publicEnv`
 * también se usa en el cliente; la protección de servidor vive en los
 * módulos que consumen esta función (ver lib/supabase/admin.ts en tandas
 * posteriores).
 */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const parsed = z
    .string()
    .min(1, "Falta SUPABASE_SERVICE_ROLE_KEY (solo servidor)")
    .safeParse(key);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "SUPABASE_SERVICE_ROLE_KEY inválida");
  }
  return parsed.data;
}

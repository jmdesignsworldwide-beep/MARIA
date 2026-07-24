import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/**
 * Cliente de Supabase para el NAVEGADOR (componentes cliente).
 * Usa exclusivamente la clave anónima protegida por RLS.
 * Nunca debe tener acceso al `service_role`.
 */
export function createClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

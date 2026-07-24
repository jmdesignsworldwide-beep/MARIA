import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/**
 * Cliente de Supabase para el SERVIDOR (Server Components, Route
 * Handlers, Server Actions). Usa la clave anónima + la sesión del
 * usuario desde cookies, respetando RLS.
 *
 * `import "server-only"` garantiza que este módulo jamás termine en
 * el bundle del navegador (Estándar Fort Knox #1).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Llamado desde un Server Component: las cookies solo se
            // pueden escribir en Server Actions o Route Handlers. El
            // middleware se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}

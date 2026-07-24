import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv, getServiceRoleKey } from "@/lib/env";

/**
 * Cliente ADMINISTRATIVO de Supabase con `service_role`.
 * Se SALTA RLS — poder total. Uso exclusivo en el servidor para
 * tareas administrativas controladas (jamás con datos del usuario
 * sin verificación previa de permisos en el servidor).
 *
 * `import "server-only"` impide que este módulo llegue al navegador.
 * No persiste sesión: es un cliente sin estado por petición.
 */
export function createAdminClient() {
  return createSupabaseClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    getServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

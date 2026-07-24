import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Obtiene el usuario autenticado desde el servidor (validado contra
 * Supabase Auth). Devuelve `null` si no hay sesión.
 * Toda decisión de acceso se toma en el SERVIDOR (Estándar Fort Knox #3).
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Exige sesión activa. Si no hay usuario, redirige a /login.
 * Úsese en layouts y páginas protegidas del servidor.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

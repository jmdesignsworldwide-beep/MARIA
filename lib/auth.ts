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
 * Exige sesión activa Y acceso vigente (Estándar Fort Knox #3).
 * Si no hay usuario → /login. Si la cuenta está inactiva o vencida
 * (cuentas demo con `access_expires_at`), cierra sesión y redirige.
 * La validación de vencimiento se hace SIEMPRE en el servidor.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: perfil } = await supabase
    .from("profiles")
    .select("is_active, access_expires_at, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil) {
    const vencido =
      perfil.access_expires_at != null &&
      new Date(perfil.access_expires_at).getTime() < Date.now();
    if (!perfil.is_active || vencido) {
      redirect(`/auth/cerrar?motivo=${vencido ? "vencido" : "inactivo"}`);
    }
  }

  return user;
}

/** Devuelve el rol del usuario actual ('admin' | 'usuario' | 'demo' | null). */
export async function getRol(): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  return data?.rol ?? null;
}

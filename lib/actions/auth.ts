"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarSesion } from "@/lib/actions/bitacora";

/** Cierra la sesión del usuario y lo lleva al login. */
export async function cerrarSesion() {
  const supabase = await createClient();
  await registrarSesion("sesion_cierre");
  await supabase.auth.signOut();
  redirect("/login");
}

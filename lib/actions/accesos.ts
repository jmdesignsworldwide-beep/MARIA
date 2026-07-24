"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { accesoDemoSchema } from "@/lib/validations/ajustes";
import type { ActionResult } from "@/lib/actions/types";

/** Verifica en el SERVIDOR que el usuario actual sea admin. */
async function requerirAdmin(): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  return data?.rol === "admin" ? user.id : null;
}

function calcularVencimiento(v: string, custom?: string): string | null {
  if (v === "sin") return null;
  if (v === "custom") return custom ? `${custom}T23:59:59Z` : null;
  const dias = Number(v);
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

export type AccesoDemo = {
  id: string;
  email: string | null;
  nombre_completo: string | null;
  rol: string;
  is_active: boolean;
  access_expires_at: string | null;
  created_at: string;
};

/** Lista las cuentas demo (solo admin; usa service_role bajo verificación). */
export async function listarAccesos(): Promise<AccesoDemo[]> {
  const adminId = await requerirAdmin();
  if (!adminId) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, nombre_completo, rol, is_active, access_expires_at, created_at")
    .eq("rol", "demo")
    .order("created_at", { ascending: false });
  return (data as AccesoDemo[] | null) ?? [];
}

/** Crea una cuenta demo con vencimiento (solo admin). */
export async function crearAccesoDemo(input: unknown): Promise<ActionResult> {
  const adminId = await requerirAdmin();
  if (!adminId) return { ok: false, error: "Solo un administrador puede crear accesos." };

  const parsed = accesoDemoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const expira = calcularVencimiento(parsed.data.vencimiento, parsed.data.fecha_custom);
  const admin = createAdminClient();

  const { data: creado, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { nombre_completo: parsed.data.nombre ?? null },
  });
  if (error || !creado.user) {
    const msg = error?.message?.toLowerCase().includes("already")
      ? "Ya existe un usuario con ese correo."
      : "No se pudo crear la cuenta demo.";
    return { ok: false, error: msg };
  }

  // El trigger creó el perfil como 'usuario'; lo marcamos como demo + vencimiento.
  await admin
    .from("profiles")
    .update({
      rol: "demo",
      access_expires_at: expira,
      nombre_completo: parsed.data.nombre ?? parsed.data.email.split("@")[0],
    })
    .eq("id", creado.user.id);

  revalidatePath("/ajustes");
  return { ok: true, id: creado.user.id };
}

/** Activa o desactiva una cuenta demo (solo admin). */
export async function alternarAccesoDemo(id: string, activar: boolean): Promise<ActionResult> {
  const adminId = await requerirAdmin();
  if (!adminId) return { ok: false, error: "No autorizado." };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_active: activar }).eq("id", id).eq("rol", "demo");
  if (error) return { ok: false, error: "No se pudo actualizar el acceso." };
  revalidatePath("/ajustes");
  return { ok: true };
}

/** Elimina una cuenta demo por completo (solo admin). */
export async function eliminarAccesoDemo(id: string): Promise<ActionResult> {
  const adminId = await requerirAdmin();
  if (!adminId) return { ok: false, error: "No autorizado." };
  const admin = createAdminClient();
  // Verifica que sea una cuenta demo antes de borrar.
  const { data: perfil } = await admin.from("profiles").select("rol").eq("id", id).maybeSingle();
  if (perfil?.rol !== "demo") return { ok: false, error: "Solo se pueden eliminar cuentas demo." };
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: "No se pudo eliminar la cuenta." };
  revalidatePath("/ajustes");
  return { ok: true };
}

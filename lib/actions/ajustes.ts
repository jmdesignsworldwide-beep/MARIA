"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { empresaSchema } from "@/lib/validations/ajustes";
import type { ActionResult } from "@/lib/actions/types";

/** Actualiza la configuración de la empresa (el dueño edita la suya). */
export async function actualizarEmpresa(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = empresaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const cuentas = parsed.data.cuentas_bancarias.filter(
    (c) => c.banco || c.numero || c.titular,
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("empresa_config")
    .update({ ...parsed.data, cuentas_bancarias: cuentas })
    .eq("owner_id", user.id);

  if (error) return { ok: false, error: "No se pudo guardar la configuración." };

  revalidatePath("/ajustes");
  return { ok: true };
}

/** Guarda la ruta del logo o firma tras subirlo al Storage. */
export async function guardarImagenEmpresa(
  campo: "logo_path" | "firma_path",
  path: string | null,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const supabase = await createClient();
  const cambio = campo === "logo_path" ? { logo_path: path } : { firma_path: path };
  const { error } = await supabase
    .from("empresa_config")
    .update(cambio)
    .eq("owner_id", user.id);
  if (error) return { ok: false, error: "No se pudo guardar la imagen." };
  revalidatePath("/ajustes");
  return { ok: true };
}

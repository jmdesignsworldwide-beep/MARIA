"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { suplidorSchema } from "@/lib/validations/suplidor";
import type { ActionResult } from "@/lib/actions/types";

export async function crearSuplidor(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const parsed = suplidorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suplidores")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo guardar el suplidor." };
  revalidatePath("/compras");
  return { ok: true, id: data.id };
}

export async function actualizarSuplidor(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const parsed = suplidorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("suplidores").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el suplidor." };
  revalidatePath("/compras");
  return { ok: true, id };
}

export async function eliminarSuplidor(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const supabase = await createClient();
  const { error } = await supabase.from("suplidores").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Este suplidor tiene compras o líneas asociadas. Desactívalo en su lugar.",
      };
    }
    return { ok: false, error: "No se pudo eliminar el suplidor." };
  }
  revalidatePath("/compras");
  return { ok: true };
}

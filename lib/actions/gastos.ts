"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { gastoSchema, categoriaSchema } from "@/lib/validations/gasto";
import type { ActionResult } from "@/lib/actions/types";

const BUCKET = "recibos";

export async function crearGasto(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const parsed = gastoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gastos")
    .insert({
      ...parsed.data,
      categoria_id: parsed.data.categoria_id ?? null,
      owner_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo registrar el gasto." };
  revalidatePath("/gastos");
  return { ok: true, id: data.id };
}

export async function eliminarGasto(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const supabase = await createClient();

  const { data: gasto } = await supabase
    .from("gastos")
    .select("comprobante_path")
    .eq("id", id)
    .maybeSingle();
  if (gasto?.comprobante_path) {
    await supabase.storage.from(BUCKET).remove([gasto.comprobante_path]);
  }

  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el gasto." };
  revalidatePath("/gastos");
  return { ok: true };
}

/** Duplica un gasto con la fecha de hoy (útil para recurrentes). */
export async function duplicarGasto(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const supabase = await createClient();
  const { data: g } = await supabase
    .from("gastos")
    .select("categoria_id, descripcion, monto, metodo_pago, es_recurrente")
    .eq("id", id)
    .maybeSingle();
  if (!g) return { ok: false, error: "Gasto no encontrado." };

  const { error } = await supabase.from("gastos").insert({
    owner_id: user.id,
    categoria_id: g.categoria_id,
    descripcion: g.descripcion,
    monto: g.monto,
    metodo_pago: g.metodo_pago,
    es_recurrente: g.es_recurrente,
    fecha: new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, error: "No se pudo duplicar el gasto." };
  revalidatePath("/gastos");
  return { ok: true };
}

export async function urlFirmadaComprobante(path: string): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export async function crearCategoria(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_gasto")
    .insert({ nombre: parsed.data.nombre, owner_id: user.id })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya existe una categoría con ese nombre." };
    return { ok: false, error: "No se pudo crear la categoría." };
  }
  revalidatePath("/gastos");
  return { ok: true, id: data.id };
}

export async function eliminarCategoria(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const supabase = await createClient();
  const { error } = await supabase.from("categorias_gasto").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la categoría." };
  revalidatePath("/gastos");
  return { ok: true };
}

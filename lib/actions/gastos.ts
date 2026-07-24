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

export async function actualizarGasto(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const parsed = gastoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const supabase = await createClient();

  // Si llega un comprobante nuevo, borra el anterior para no dejar huérfanos.
  if (parsed.data.comprobante_path) {
    const { data: prev } = await supabase
      .from("gastos")
      .select("comprobante_path")
      .eq("id", id)
      .maybeSingle();
    if (prev?.comprobante_path && prev.comprobante_path !== parsed.data.comprobante_path) {
      await supabase.storage.from(BUCKET).remove([prev.comprobante_path]);
    }
  }

  const { error } = await supabase
    .from("gastos")
    .update({
      categoria_id: parsed.data.categoria_id ?? null,
      descripcion: parsed.data.descripcion,
      monto: parsed.data.monto,
      fecha: parsed.data.fecha,
      metodo_pago: parsed.data.metodo_pago,
      es_recurrente: parsed.data.es_recurrente,
      ...(parsed.data.comprobante_path
        ? { comprobante_path: parsed.data.comprobante_path }
        : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el gasto." };
  revalidatePath("/gastos");
  return { ok: true, id };
}

/**
 * Genera, para el mes en curso, una copia de cada gasto recurrente que aún no
 * haya sido registrado este mes (compara por descripción, sin distinguir may/min).
 */
export async function generarRecurrentesDelMes(): Promise<
  ActionResult & { creados?: number }
> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const supabase = await createClient();

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const inicioMesSig = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);

  // Plantillas recurrentes (la más reciente por descripción).
  const { data: recurrentes } = await supabase
    .from("gastos")
    .select("categoria_id, descripcion, monto, metodo_pago, fecha")
    .eq("es_recurrente", true)
    .order("fecha", { ascending: false });

  // Descripciones ya presentes este mes.
  const { data: delMes } = await supabase
    .from("gastos")
    .select("descripcion")
    .gte("fecha", inicioMes)
    .lt("fecha", inicioMesSig);

  const yaPresentes = new Set(
    (delMes ?? []).map((g) => g.descripcion.trim().toLowerCase()),
  );

  const plantillas = new Map<
    string,
    { categoria_id: string | null; descripcion: string; monto: number; metodo_pago: string }
  >();
  for (const g of recurrentes ?? []) {
    const clave = g.descripcion.trim().toLowerCase();
    if (yaPresentes.has(clave) || plantillas.has(clave)) continue;
    plantillas.set(clave, {
      categoria_id: g.categoria_id,
      descripcion: g.descripcion,
      monto: Number(g.monto),
      metodo_pago: g.metodo_pago,
    });
  }

  if (plantillas.size === 0) {
    return { ok: true, creados: 0 };
  }

  const fechaHoy = hoy.toISOString().slice(0, 10);
  const filas = Array.from(plantillas.values()).map((p) => ({
    owner_id: user.id,
    categoria_id: p.categoria_id,
    descripcion: p.descripcion,
    monto: p.monto,
    metodo_pago: p.metodo_pago as never,
    fecha: fechaHoy,
    es_recurrente: true,
  }));

  const { error } = await supabase.from("gastos").insert(filas);
  if (error) return { ok: false, error: "No se pudieron generar los recurrentes." };
  revalidatePath("/gastos");
  return { ok: true, creados: filas.length };
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

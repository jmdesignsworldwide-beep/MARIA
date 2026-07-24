"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { facturaSchema, anulacionSchema } from "@/lib/validations/factura";
import type { ActionResult } from "@/lib/actions/types";

async function insertarLineas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  facturaId: string,
  lineas: {
    catalogo_item_id?: string | null;
    suplidor_id?: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    costo_unitario: number;
    itbis_aplicable: boolean;
  }[],
) {
  return supabase.from("factura_lineas").insert(
    lineas.map((l, i) => ({
      owner_id: ownerId,
      factura_id: facturaId,
      catalogo_item_id: l.catalogo_item_id ?? null,
      suplidor_id: l.suplidor_id ?? null,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      costo_unitario: l.costo_unitario,
      itbis_aplicable: l.itbis_aplicable,
      orden: i + 1,
    })),
  );
}

/** Crea una factura en borrador con sus líneas. */
export async function crearFactura(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = facturaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const { lineas, ...cab } = parsed.data;

  const supabase = await createClient();
  const { data: fac, error } = await supabase
    .from("facturas")
    .insert({ ...cab, owner_id: user.id, estado: "borrador" })
    .select("id")
    .single();
  if (error || !fac) return { ok: false, error: "No se pudo crear la factura." };

  const { error: errLineas } = await insertarLineas(supabase, user.id, fac.id, lineas);
  if (errLineas) {
    await supabase.from("facturas").delete().eq("id", fac.id);
    return { ok: false, error: "No se pudieron guardar las líneas." };
  }

  revalidatePath("/facturas");
  return { ok: true, id: fac.id };
}

/** Actualiza una factura en borrador (una emitida no se edita). */
export async function actualizarFactura(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = facturaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const { lineas, ...cab } = parsed.data;

  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("facturas")
    .select("estado")
    .eq("id", id)
    .maybeSingle();
  if (!actual) return { ok: false, error: "Factura no encontrada." };
  if (actual.estado !== "borrador") {
    return { ok: false, error: "Solo se puede editar una factura en borrador." };
  }

  const { error: errCab } = await supabase.from("facturas").update(cab).eq("id", id);
  if (errCab) return { ok: false, error: "No se pudo actualizar la factura." };

  await supabase.from("factura_lineas").delete().eq("factura_id", id);
  const { error: errLineas } = await insertarLineas(supabase, user.id, id, lineas);
  if (errLineas) return { ok: false, error: "No se pudieron guardar las líneas." };

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
  return { ok: true, id };
}

/** Emite una factura (borrador → emitida). */
export async function emitirFactura(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("facturas")
    .update({ estado: "emitida" })
    .eq("id", id)
    .eq("estado", "borrador");
  if (error) return { ok: false, error: "No se pudo emitir la factura." };

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
  return { ok: true, id };
}

/** Anula una factura con motivo obligatorio (queda en bitácora). */
export async function anularFactura(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = anulacionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Motivo no válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("facturas")
    .update({ estado: "anulada", motivo_anulacion: parsed.data.motivo })
    .eq("id", id)
    .neq("estado", "anulada");
  if (error) return { ok: false, error: "No se pudo anular la factura." };

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
  return { ok: true, id };
}

/** Elimina una factura en borrador (una emitida solo se anula). */
export async function eliminarFactura(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("facturas")
    .select("estado")
    .eq("id", id)
    .maybeSingle();
  if (actual && actual.estado !== "borrador") {
    return { ok: false, error: "Una factura emitida no se elimina, solo se anula." };
  }

  const { error } = await supabase.from("facturas").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la factura." };

  revalidatePath("/facturas");
  return { ok: true };
}

/** Marca "vencida" las facturas emitidas con saldo cuyo vencimiento pasó. */
export async function vencerFacturasVencidas(): Promise<void> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  await supabase
    .from("facturas")
    .update({ estado: "vencida" })
    .lt("fecha_vencimiento", hoy)
    .gt("saldo", 0)
    .in("estado", ["emitida", "cobrada_parcial"]);
}

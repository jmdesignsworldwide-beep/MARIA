"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { cotizacionSchema } from "@/lib/validations/cotizacion";
import type { ActionResult } from "@/lib/actions/types";
import type {
  EstadoCotizacion,
  Cotizacion,
  CotizacionLinea,
} from "@/lib/database.types";

type CotizacionConLineas = Cotizacion & {
  cotizacion_lineas: CotizacionLinea[];
};

/** Crea una cotización con sus líneas. Los totales los calcula la BD. */
export async function crearCotizacion(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = cotizacionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const { lineas, ...cab } = parsed.data;

  const supabase = await createClient();
  const { data: cot, error } = await supabase
    .from("cotizaciones")
    .insert({ ...cab, owner_id: user.id, estado: "borrador" })
    .select("id")
    .single();

  if (error || !cot) return { ok: false, error: "No se pudo crear la cotización." };

  const { error: errLineas } = await supabase.from("cotizacion_lineas").insert(
    lineas.map((l, i) => ({
      owner_id: user.id,
      cotizacion_id: cot.id,
      catalogo_item_id: l.catalogo_item_id ?? null,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      itbis_aplicable: l.itbis_aplicable,
      orden: i + 1,
    })),
  );

  if (errLineas) {
    await supabase.from("cotizaciones").delete().eq("id", cot.id);
    return { ok: false, error: "No se pudieron guardar las líneas." };
  }

  revalidatePath("/cotizaciones");
  return { ok: true, id: cot.id };
}

/** Actualiza una cotización: reemplaza cabecera y líneas. */
export async function actualizarCotizacion(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = cotizacionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const { lineas, ...cab } = parsed.data;

  const supabase = await createClient();

  const { data: actual } = await supabase
    .from("cotizaciones")
    .select("estado")
    .eq("id", id)
    .maybeSingle();
  if (actual?.estado === "convertida") {
    return { ok: false, error: "Una cotización convertida no se puede editar." };
  }

  const { error: errCab } = await supabase
    .from("cotizaciones")
    .update(cab)
    .eq("id", id);
  if (errCab) return { ok: false, error: "No se pudo actualizar la cotización." };

  // Reemplaza las líneas.
  await supabase.from("cotizacion_lineas").delete().eq("cotizacion_id", id);
  const { error: errLineas } = await supabase.from("cotizacion_lineas").insert(
    lineas.map((l, i) => ({
      owner_id: user.id,
      cotizacion_id: id,
      catalogo_item_id: l.catalogo_item_id ?? null,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      itbis_aplicable: l.itbis_aplicable,
      orden: i + 1,
    })),
  );
  if (errLineas) return { ok: false, error: "No se pudieron guardar las líneas." };

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${id}`);
  return { ok: true, id };
}

const ESTADOS_VALIDOS: EstadoCotizacion[] = [
  "borrador",
  "enviada",
  "aprobada",
  "rechazada",
  "vencida",
];

/** Cambia el estado de una cotización (no permite fijar "convertida" a mano). */
export async function cambiarEstadoCotizacion(
  id: string,
  estado: EstadoCotizacion,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return { ok: false, error: "Estado no válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cotizaciones")
    .update({ estado })
    .eq("id", id)
    .neq("estado", "convertida");

  if (error) return { ok: false, error: "No se pudo cambiar el estado." };

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${id}`);
  return { ok: true, id };
}

/** Elimina una cotización (y sus líneas por cascada). */
export async function eliminarCotizacion(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la cotización." };

  revalidatePath("/cotizaciones");
  return { ok: true };
}

/** Duplica una cotización como nuevo borrador. */
export async function duplicarCotizacion(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { data: origData } = await supabase
    .from("cotizaciones")
    .select("*, cotizacion_lineas(*)")
    .eq("id", id)
    .maybeSingle();
  const orig = origData as unknown as CotizacionConLineas | null;
  if (!orig) return { ok: false, error: "Cotización no encontrada." };

  const { data: nueva, error } = await supabase
    .from("cotizaciones")
    .insert({
      owner_id: user.id,
      cliente_id: orig.cliente_id,
      fecha: new Date().toISOString().slice(0, 10),
      validez_dias: orig.validez_dias,
      itbis_activo: orig.itbis_activo,
      itbis_tasa: orig.itbis_tasa,
      estado: "borrador",
      notas: orig.notas,
      condiciones: orig.condiciones,
    })
    .select("id")
    .single();
  if (error || !nueva) return { ok: false, error: "No se pudo duplicar." };

  const lineas = (orig.cotizacion_lineas ?? []) as {
    catalogo_item_id: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    itbis_aplicable: boolean;
    orden: number;
  }[];
  if (lineas.length > 0) {
    await supabase.from("cotizacion_lineas").insert(
      lineas.map((l) => ({
        owner_id: user.id,
        cotizacion_id: nueva.id,
        catalogo_item_id: l.catalogo_item_id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        itbis_aplicable: l.itbis_aplicable,
        orden: l.orden,
      })),
    );
  }

  revalidatePath("/cotizaciones");
  return { ok: true, id: nueva.id };
}

/** Convierte una cotización en factura (borrador), enlazando ambas. */
export async function convertirAFactura(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { data: cotData } = await supabase
    .from("cotizaciones")
    .select("*, cotizacion_lineas(*)")
    .eq("id", id)
    .maybeSingle();
  const cot = cotData as unknown as CotizacionConLineas | null;
  if (!cot) return { ok: false, error: "Cotización no encontrada." };
  if (cot.estado === "convertida" || cot.factura_id) {
    return { ok: false, error: "Esta cotización ya fue convertida." };
  }

  const hoy = new Date();
  const venc = new Date(hoy);
  venc.setDate(venc.getDate() + 30);

  const { data: fac, error } = await supabase
    .from("facturas")
    .insert({
      owner_id: user.id,
      cliente_id: cot.cliente_id,
      cotizacion_id: cot.id,
      fecha: hoy.toISOString().slice(0, 10),
      fecha_vencimiento: venc.toISOString().slice(0, 10),
      estado: "borrador",
      itbis_activo: cot.itbis_activo,
      itbis_tasa: cot.itbis_tasa,
      notas: cot.notas,
    })
    .select("id")
    .single();
  if (error || !fac) return { ok: false, error: "No se pudo crear la factura." };

  const lineas = (cot.cotizacion_lineas ?? []) as {
    catalogo_item_id: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    itbis_aplicable: boolean;
    orden: number;
  }[];
  if (lineas.length > 0) {
    await supabase.from("factura_lineas").insert(
      lineas.map((l) => ({
        owner_id: user.id,
        factura_id: fac.id,
        catalogo_item_id: l.catalogo_item_id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        costo_unitario: 0,
        itbis_aplicable: l.itbis_aplicable,
        orden: l.orden,
      })),
    );
  }

  await supabase
    .from("cotizaciones")
    .update({ estado: "convertida", factura_id: fac.id })
    .eq("id", id);

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/facturas");
  return { ok: true, id: fac.id };
}

/** Marca como "vencida" las cotizaciones cuya validez ya pasó. */
export async function vencerCotizacionesVencidas(): Promise<void> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  await supabase
    .from("cotizaciones")
    .update({ estado: "vencida" })
    .lt("fecha_validez", hoy)
    .in("estado", ["borrador", "enviada"]);
}

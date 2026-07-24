"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { pagoSchema } from "@/lib/validations/pago";
import type { ActionResult } from "@/lib/actions/types";

/** Registra un cobro (abono). La BD recalcula saldo y estado por trigger. */
export async function registrarPago(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = pagoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const supabase = await createClient();

  // No se cobra sobre borrador ni anulada.
  const { data: factura } = await supabase
    .from("facturas")
    .select("estado")
    .eq("id", parsed.data.factura_id)
    .maybeSingle();
  if (!factura) return { ok: false, error: "Factura no encontrada." };
  if (factura.estado === "borrador" || factura.estado === "anulada") {
    return {
      ok: false,
      error: "Solo se pueden registrar cobros en facturas emitidas.",
    };
  }

  const { data, error } = await supabase
    .from("pagos")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo registrar el cobro." };

  revalidatePath("/cobros");
  revalidatePath(`/facturas/${parsed.data.factura_id}`);
  revalidatePath("/facturas");
  return { ok: true, id: data.id };
}

/** Elimina un cobro (revierte el saldo por trigger). */
export async function eliminarPago(
  id: string,
  facturaId: string,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { error } = await supabase.from("pagos").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el cobro." };

  revalidatePath("/cobros");
  revalidatePath(`/facturas/${facturaId}`);
  revalidatePath("/facturas");
  return { ok: true };
}

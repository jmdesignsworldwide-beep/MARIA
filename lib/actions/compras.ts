"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { compraSchema } from "@/lib/validations/compra";
import type { ActionResult } from "@/lib/actions/types";

const BUCKET = "recibos";

export async function crearCompra(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const parsed = compraSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras")
    .insert({
      ...parsed.data,
      factura_id: parsed.data.factura_id ?? null,
      owner_id: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo registrar la compra." };
  revalidatePath("/compras");
  if (parsed.data.factura_id) revalidatePath(`/facturas/${parsed.data.factura_id}`);
  return { ok: true, id: data.id };
}

export async function eliminarCompra(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  const supabase = await createClient();

  // Borra también el recibo del almacenamiento si existe.
  const { data: compra } = await supabase
    .from("compras")
    .select("recibo_path")
    .eq("id", id)
    .maybeSingle();
  if (compra?.recibo_path) {
    await supabase.storage.from(BUCKET).remove([compra.recibo_path]);
  }

  const { error } = await supabase.from("compras").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la compra." };
  revalidatePath("/compras");
  return { ok: true };
}

/** Genera una URL firmada de corta duración para ver un recibo. */
export async function urlFirmadaRecibo(path: string): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { catalogoSchema } from "@/lib/validations/catalogo";
import type { ActionResult } from "@/lib/actions/types";

/** Crea un item de catálogo (producto o servicio). */
export async function crearItem(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = catalogoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogo_items")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error) return { ok: false, error: "No se pudo guardar el item." };

  revalidatePath("/catalogo");
  return { ok: true, id: data.id };
}

/** Actualiza un item del catálogo. */
export async function actualizarItem(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = catalogoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogo_items")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar el item." };

  revalidatePath("/catalogo");
  return { ok: true, id };
}

/** Elimina un item del catálogo. */
export async function eliminarItem(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { error } = await supabase.from("catalogo_items").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "Este item se usa en documentos. Desactívalo en lugar de eliminarlo.",
      };
    }
    return { ok: false, error: "No se pudo eliminar el item." };
  }

  revalidatePath("/catalogo");
  return { ok: true };
}

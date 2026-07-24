"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { clienteSchema } from "@/lib/validations/cliente";
import type { ActionResult } from "@/lib/actions/types";

/** Crea un cliente para el usuario autenticado. */
export async function crearCliente(input: unknown): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error) return { ok: false, error: "No se pudo guardar el cliente." };

  revalidatePath("/clientes");
  return { ok: true, id: data.id };
}

/** Actualiza un cliente existente (RLS garantiza que sea del dueño). */
export async function actualizarCliente(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar el cliente." };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { ok: true, id };
}

/** Elimina un cliente. Si tiene documentos asociados, sugiere desactivarlo. */
export async function eliminarCliente(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) {
    // 23503 = violación de llave foránea (tiene facturas/cotizaciones).
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "Este cliente tiene documentos asociados. Desactívalo en lugar de eliminarlo.",
      };
    }
    return { ok: false, error: "No se pudo eliminar el cliente." };
  }

  revalidatePath("/clientes");
  return { ok: true };
}

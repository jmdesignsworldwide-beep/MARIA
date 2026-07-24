"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export type ResultadoBusqueda = {
  clientes: { id: string; nombre: string; tipo: string }[];
  facturas: { id: string; numero: string; estado: string }[];
  cotizaciones: { id: string; numero: string; estado: string }[];
  productos: { id: string; descripcion: string; tipo: string }[];
};

const VACIO: ResultadoBusqueda = {
  clientes: [],
  facturas: [],
  cotizaciones: [],
  productos: [],
};

/** Búsqueda global (clientes, facturas, cotizaciones, catálogo). RLS por owner. */
export async function buscarGlobal(query: string): Promise<ResultadoBusqueda> {
  const user = await getUser();
  if (!user) return VACIO;
  const q = query.trim();
  if (q.length < 2) return VACIO;

  const supabase = await createClient();
  const like = `%${q}%`;

  const [clientes, facturas, cotizaciones, productos] = await Promise.all([
    supabase.from("clientes").select("id, nombre, tipo").ilike("nombre", like).limit(5),
    supabase.from("facturas").select("id, numero, estado").ilike("numero", like).limit(5),
    supabase.from("cotizaciones").select("id, numero, estado").ilike("numero", like).limit(5),
    supabase.from("catalogo_items").select("id, descripcion, tipo").ilike("descripcion", like).limit(5),
  ]);

  return {
    clientes: clientes.data ?? [],
    facturas: facturas.data ?? [],
    cotizaciones: cotizaciones.data ?? [],
    productos: productos.data ?? [],
  };
}

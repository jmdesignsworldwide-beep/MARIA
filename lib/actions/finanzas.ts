"use server";

import { getUser } from "@/lib/auth";
import { obtenerLibro, type Periodo } from "@/lib/finanzas/queries";
import type { Movimiento } from "@/lib/finanzas/tipos";

/**
 * Devuelve TODOS los movimientos del periodo/filtro (sin paginar) para
 * exportarlos a Excel o PDF desde el cliente. El cálculo ocurre en el
 * servidor mediante la función SQL fin_libro.
 */
export async function exportarLibro(
  periodo: Periodo,
  opts: { tipo?: string; busqueda?: string } = {},
): Promise<{ ok: boolean; rows: Movimiento[] }> {
  const user = await getUser();
  if (!user) return { ok: false, rows: [] };
  const data = await obtenerLibro(periodo, {
    tipo: opts.tipo,
    busqueda: opts.busqueda,
    limit: 100000,
    offset: 0,
  });
  return { ok: true, rows: data.rows };
}

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  FlujoData,
  LibroData,
  EstadoResultadosData,
  ProyeccionData,
  RentabilidadData,
  Periodo,
} from "@/lib/finanzas/tipos";

export type { Periodo } from "@/lib/finanzas/tipos";
export { etiquetaMes } from "@/lib/finanzas/tipos";

/** Cliente Supabase con .rpc laxo (los tipos generados no incluyen funciones). */
type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
};

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Devuelve el periodo del mes en curso (rango [desde, hasta)). */
export function periodoMesActual(): Periodo {
  const hoy = new Date();
  return {
    desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    hasta: iso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)),
  };
}

/** Periodo de los últimos N meses (incluye el mes actual). */
export function periodoUltimosMeses(n: number): Periodo {
  const hoy = new Date();
  return {
    desde: iso(new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1), 1)),
    hasta: iso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)),
  };
}

export async function obtenerFlujo(p: Periodo): Promise<FlujoData> {
  const supabase = (await createClient()) as unknown as RpcClient;
  const { data } = await supabase.rpc("fin_flujo", {
    p_desde: p.desde,
    p_hasta: p.hasta,
  });
  return (data as FlujoData) ?? vacioFlujo();
}

export async function obtenerLibro(
  p: Periodo,
  opts: { tipo?: string; busqueda?: string; limit?: number; offset?: number } = {},
): Promise<LibroData> {
  const supabase = (await createClient()) as unknown as RpcClient;
  const { data } = await supabase.rpc("fin_libro", {
    p_desde: p.desde,
    p_hasta: p.hasta,
    p_tipo: opts.tipo ?? "todos",
    p_busqueda: opts.busqueda ?? "",
    p_limit: opts.limit ?? 50,
    p_offset: opts.offset ?? 0,
  });
  return (
    (data as LibroData) ?? {
      total_count: 0,
      total_entradas: 0,
      total_salidas: 0,
      saldo_neto: 0,
      rows: [],
    }
  );
}

export async function obtenerEstadoResultados(
  p: Periodo,
): Promise<EstadoResultadosData> {
  const supabase = (await createClient()) as unknown as RpcClient;
  const { data } = await supabase.rpc("fin_estado_resultados", {
    p_desde: p.desde,
    p_hasta: p.hasta,
  });
  return (data as EstadoResultadosData) ?? vacioER();
}

export async function obtenerProyeccion(): Promise<ProyeccionData> {
  const supabase = (await createClient()) as unknown as RpcClient;
  const { data } = await supabase.rpc("fin_proyeccion", {});
  return (
    (data as ProyeccionData) ?? {
      me_deben: 0,
      aging: { por_vencer: 0, d1_30: 0, d31_60: 0, d60_mas: 0 },
      top_deudores: [],
      tengo_que_pagar: 0,
      recurrentes: [],
      veredicto: 0,
    }
  );
}

export async function obtenerRentabilidad(
  p: Periodo,
): Promise<RentabilidadData> {
  const supabase = (await createClient()) as unknown as RpcClient;
  const { data } = await supabase.rpc("fin_rentabilidad", {
    p_desde: p.desde,
    p_hasta: p.hasta,
  });
  return (
    (data as RentabilidadData) ?? {
      clientes: [],
      productos: [],
      sin_costo: [],
      evolucion: [],
    }
  );
}

function vacioFlujo(): FlujoData {
  const cero = {
    entro: 0,
    salio_mercancia: 0,
    salio_gastos: 0,
    salio: 0,
    quedo: 0,
  };
  return { ...cero, facturado: 0, prev: cero };
}

function vacioER(): EstadoResultadosData {
  return {
    facturado: 0,
    cobrado: 0,
    costo_mercancia: 0,
    utilidad_bruta: 0,
    margen_bruto_pct: null,
    gastos: 0,
    utilidad_neta: 0,
    margen_neto_pct: null,
    gastos_categoria: [],
    prev: { facturado: 0, utilidad_neta: 0 },
  };
}

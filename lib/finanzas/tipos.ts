/** Tipos del módulo Finanzas — reflejan el JSON que devuelven las
 *  funciones SQL (0010_finanzas.sql). */

export type Periodo = { desde: string; hasta: string };

const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Etiqueta legible de un mes AAAA-MM → "jul 26". */
export function etiquetaMes(yyyymm: string): string {
  const [a, m] = yyyymm.split("-");
  const idx = Number(m) - 1;
  return `${MESES_CORTOS[idx] ?? m} ${(a ?? "").slice(2)}`;
}

/** Traduce la clave de periodo (?p=) a meses hacia atrás. */
export function mesesDePeriodo(p: string | undefined): number {
  switch (p) {
    case "3m":
      return 3;
    case "6m":
      return 6;
    case "ano":
      return 12;
    default:
      return 1;
  }
}

export type FlujoData = {
  entro: number;
  salio_mercancia: number;
  salio_gastos: number;
  salio: number;
  quedo: number;
  facturado: number;
  prev: {
    entro: number;
    salio_mercancia: number;
    salio_gastos: number;
    salio: number;
    quedo: number;
  };
};

export type MovimientoTipo = "cobro" | "compra" | "gasto";

export type Movimiento = {
  fecha: string;
  tipo: MovimientoTipo;
  referencia: string;
  descripcion: string;
  entrada: number;
  salida: number;
  metodo: string;
  saldo: number;
  doc_id: string | null;
  doc_tipo: string;
};

export type LibroData = {
  total_count: number;
  total_entradas: number;
  total_salidas: number;
  saldo_neto: number;
  rows: Movimiento[];
};

export type EstadoResultadosData = {
  facturado: number;
  cobrado: number;
  costo_mercancia: number;
  utilidad_bruta: number;
  margen_bruto_pct: number | null;
  gastos: number;
  utilidad_neta: number;
  margen_neto_pct: number | null;
  gastos_categoria: { nombre: string; total: number }[];
  prev: { facturado: number; utilidad_neta: number };
};

export type ProyeccionData = {
  me_deben: number;
  aging: { por_vencer: number; d1_30: number; d31_60: number; d60_mas: number };
  top_deudores: { cliente: string; saldo: number; dias: number }[];
  tengo_que_pagar: number;
  recurrentes: { descripcion: string; monto: number }[];
  veredicto: number;
};

export type RentabilidadData = {
  clientes: { cliente: string; facturado: number; utilidad: number }[];
  productos: {
    descripcion: string;
    venta: number;
    utilidad: number;
    margen_pct: number;
  }[];
  sin_costo: { numero: string; total: number; fecha: string }[];
  evolucion: { mes: string; margen_pct: number }[];
};

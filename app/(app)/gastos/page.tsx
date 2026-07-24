import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { CategoriaGasto, MetodoPago } from "@/lib/database.types";
import { GastosVista, type GastoRow } from "@/components/gastos/gastos-vista";

export const metadata: Metadata = { title: "Gastos" };

type GastoQuery = {
  id: string;
  categoria_id: string | null;
  descripcion: string;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago;
  es_recurrente: boolean;
  comprobante_path: string | null;
  categoria: { nombre: string } | null;
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function GastosPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioMesSig = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const inicioMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  // Ventana de 6 meses hacia atrás (incluye el mes actual) para filtros y tendencia.
  const inicioVentana = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);

  const [gastosRes, categoriasRes] = await Promise.all([
    supabase
      .from("gastos")
      .select("id, categoria_id, descripcion, monto, fecha, metodo_pago, es_recurrente, comprobante_path, categoria:categorias_gasto(nombre)")
      .gte("fecha", iso(inicioVentana))
      .lt("fecha", iso(inicioMesSig))
      .order("fecha", { ascending: false }),
    supabase.from("categorias_gasto").select("*").order("nombre"),
  ]);

  const gq = (gastosRes.data as unknown as GastoQuery[] | null) ?? [];
  const gastos: GastoRow[] = gq.map((g) => ({
    id: g.id,
    categoria_id: g.categoria_id,
    descripcion: g.descripcion,
    categoria_nombre: g.categoria?.nombre ?? null,
    monto: Number(g.monto),
    fecha: g.fecha,
    metodo_pago: g.metodo_pago,
    es_recurrente: g.es_recurrente,
    comprobante_path: g.comprobante_path,
  }));

  const enRango = (g: GastoRow, desde: Date, hasta: Date) =>
    g.fecha >= iso(desde) && g.fecha < iso(hasta);

  const gastosMes = gastos.filter((g) => enRango(g, inicioMes, inicioMesSig));
  const totalMes = gastosMes.reduce((a, g) => a + g.monto, 0);
  const totalMesAnterior = gastos
    .filter((g) => enRango(g, inicioMesAnt, inicioMes))
    .reduce((a, g) => a + g.monto, 0);

  // Tendencia de 6 meses (acumulado por mes).
  const tendencia: { mes: string; total: number }[] = [];
  for (let k = 5; k >= 0; k--) {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - k, 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() - k + 1, 1);
    const total = gastos
      .filter((g) => enRango(g, desde, hasta))
      .reduce((a, g) => a + g.monto, 0);
    tendencia.push({ mes: MESES_CORTOS[desde.getMonth()] ?? "", total });
  }

  return (
    <GastosVista
      ownerId={user.id}
      categorias={(categoriasRes.data as CategoriaGasto[] | null) ?? []}
      gastos={gastos}
      totalMes={totalMes}
      totalMesAnterior={totalMesAnterior}
      tendencia={tendencia}
      nombreMes={MESES[hoy.getMonth()] ?? ""}
      inicioMesIso={iso(inicioMes)}
      finMesIso={iso(inicioMesSig)}
    />
  );
}

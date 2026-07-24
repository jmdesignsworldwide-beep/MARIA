import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { CategoriaGasto, MetodoPago } from "@/lib/database.types";
import { GastosVista, type GastoRow } from "@/components/gastos/gastos-vista";

export const metadata: Metadata = { title: "Gastos" };

type GastoQuery = {
  id: string;
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

  const [gastosRes, anteriorRes, categoriasRes] = await Promise.all([
    supabase
      .from("gastos")
      .select("id, descripcion, monto, fecha, metodo_pago, es_recurrente, comprobante_path, categoria:categorias_gasto(nombre)")
      .gte("fecha", iso(inicioMes))
      .lt("fecha", iso(inicioMesSig))
      .order("fecha", { ascending: false }),
    supabase
      .from("gastos")
      .select("monto")
      .gte("fecha", iso(inicioMesAnt))
      .lt("fecha", iso(inicioMes)),
    supabase.from("categorias_gasto").select("*").order("nombre"),
  ]);

  const gq = (gastosRes.data as unknown as GastoQuery[] | null) ?? [];
  const gastos: GastoRow[] = gq.map((g) => ({
    id: g.id,
    descripcion: g.descripcion,
    categoria_nombre: g.categoria?.nombre ?? null,
    monto: Number(g.monto),
    fecha: g.fecha,
    metodo_pago: g.metodo_pago,
    es_recurrente: g.es_recurrente,
    comprobante_path: g.comprobante_path,
  }));

  const totalMes = gastos.reduce((a, g) => a + g.monto, 0);
  const totalMesAnterior = ((anteriorRes.data as { monto: number }[] | null) ?? []).reduce(
    (a, g) => a + Number(g.monto),
    0,
  );

  const mapaCat = new Map<string, number>();
  gastos.forEach((g) => {
    const k = g.categoria_nombre ?? "Sin categoría";
    mapaCat.set(k, (mapaCat.get(k) ?? 0) + g.monto);
  });
  const porCategoria = Array.from(mapaCat.entries())
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <GastosVista
      ownerId={user.id}
      categorias={(categoriasRes.data as CategoriaGasto[] | null) ?? []}
      gastos={gastos}
      totalMes={totalMes}
      totalMesAnterior={totalMesAnterior}
      porCategoria={porCategoria}
      nombreMes={MESES[hoy.getMonth()] ?? ""}
    />
  );
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { mapEmpresaPDF } from "@/lib/pdf/helpers";
import { ReportesVista, type Periodo } from "@/components/reportes/reportes-vista";
import type { EstadoResultados, Movimiento } from "@/components/reportes/reporte-doc";

export const metadata: Metadata = { title: "Reportes" };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const periodo: Periodo = periodoParam === "anio" ? "anio" : "mes";
  const supabase = await createClient();
  const hoy = new Date();

  let inicio: Date, fin: Date, inicioAnt: Date, finAnt: Date, label: string;
  if (periodo === "anio") {
    inicio = new Date(hoy.getFullYear(), 0, 1);
    fin = new Date(hoy.getFullYear() + 1, 0, 1);
    inicioAnt = new Date(hoy.getFullYear() - 1, 0, 1);
    finAnt = inicio;
    label = `Año ${hoy.getFullYear()}`;
  } else {
    inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    inicioAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    finAnt = inicio;
    label = `${MESES[hoy.getMonth()] ?? ""} ${hoy.getFullYear()}`;
  }

  async function estadoDe(desde: Date, hasta: Date): Promise<EstadoResultados> {
    const [fac, gas] = await Promise.all([
      supabase.from("facturas").select("total, costo_total").neq("estado", "anulada").gte("fecha", iso(desde)).lt("fecha", iso(hasta)),
      supabase.from("gastos").select("monto").gte("fecha", iso(desde)).lt("fecha", iso(hasta)),
    ]);
    const ingresos = (fac.data ?? []).reduce((a, f) => a + Number(f.total ?? 0), 0);
    const costos = (fac.data ?? []).reduce((a, f) => a + Number(f.costo_total ?? 0), 0);
    const gastos = (gas.data ?? []).reduce((a, g) => a + Number(g.monto ?? 0), 0);
    const utilidadBruta = ingresos - costos;
    return { ingresos, costos, utilidadBruta, gastos, utilidadNeta: utilidadBruta - gastos };
  }

  const [estado, estadoAnterior, pagosRes, comprasRes, gastosRes, empresaRes] = await Promise.all([
    estadoDe(inicio, fin),
    estadoDe(inicioAnt, finAnt),
    supabase.from("pagos").select("monto, fecha, factura:facturas(numero)").gte("fecha", iso(inicio)).lt("fecha", iso(fin)),
    supabase.from("compras").select("monto, fecha, suplidor:suplidores(nombre)").gte("fecha", iso(inicio)).lt("fecha", iso(fin)),
    supabase.from("gastos").select("monto, fecha, descripcion").gte("fecha", iso(inicio)).lt("fecha", iso(fin)),
    supabase.from("empresa_config").select("nombre, rnc, direccion, telefono, email, cuentas_bancarias").maybeSingle(),
  ]);

  const pagos = (pagosRes.data as unknown as { monto: number; fecha: string; factura: { numero: string } | null }[] | null) ?? [];
  const compras = (comprasRes.data as unknown as { monto: number; fecha: string; suplidor: { nombre: string } | null }[] | null) ?? [];
  const gastos = (gastosRes.data as unknown as { monto: number; fecha: string; descripcion: string }[] | null) ?? [];

  const movimientos: Movimiento[] = [
    ...pagos.map((p) => ({
      fecha: p.fecha,
      tipo: "entrada" as const,
      concepto: `Cobro${p.factura?.numero ? ` factura ${p.factura.numero}` : ""}`,
      monto: Number(p.monto),
    })),
    ...compras.map((c) => ({
      fecha: c.fecha,
      tipo: "salida" as const,
      concepto: `Compra${c.suplidor?.nombre ? ` a ${c.suplidor.nombre}` : ""}`,
      monto: Number(c.monto),
    })),
    ...gastos.map((g) => ({
      fecha: g.fecha,
      tipo: "salida" as const,
      concepto: `Gasto: ${g.descripcion}`,
      monto: Number(g.monto),
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <ReportesVista
      empresa={mapEmpresaPDF(empresaRes.data ?? null)}
      periodoKey={periodo}
      periodoLabel={label}
      estado={estado}
      estadoAnterior={estadoAnterior}
      movimientos={movimientos}
    />
  );
}

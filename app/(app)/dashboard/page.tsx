import type { Metadata } from "next";
import Link from "next/link";
import {
  ReceiptText,
  HandCoins,
  TrendingUp,
  Clock,
  FileText,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatearRD, formatearFecha } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AreaIngresos, BarrasClientes, DonutGastos } from "@/components/dashboard/graficos";
import { RangoSelector, type Rango } from "@/components/dashboard/rango-selector";

export const metadata: Metadata = { title: "Panel" };

const MESES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

function rangoFechas(rango: Rango): { desde: string; etiqueta: string } {
  const hoy = new Date();
  if (rango === "hoy") return { desde: iso(hoy), etiqueta: "hoy" };
  if (rango === "semana") {
    const d = new Date(hoy);
    d.setDate(d.getDate() - 6);
    return { desde: iso(d), etiqueta: "esta semana" };
  }
  if (rango === "anio") return { desde: iso(new Date(hoy.getFullYear(), 0, 1)), etiqueta: "este año" };
  return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), etiqueta: "este mes" };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const { rango: rangoParam } = await searchParams;
  const rango: Rango = (["hoy", "semana", "mes", "anio"] as const).includes(rangoParam as Rango)
    ? (rangoParam as Rango)
    : "mes";
  const { desde, etiqueta } = rangoFechas(rango);

  const user = await requireUser();
  const nombre = user.email?.split("@")[0] ?? "";
  const supabase = await createClient();
  const hoy = new Date();
  const hace6 = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);

  const [
    facturasRango,
    pagosRango,
    porCobrarRes,
    facturas6m,
    facturasCliente,
    gastosRango,
    actFacturas,
    actPagos,
    actGastos,
  ] = await Promise.all([
    supabase.from("facturas").select("total, utilidad").neq("estado", "anulada").gte("fecha", desde),
    supabase.from("pagos").select("monto").gte("fecha", desde),
    supabase.from("facturas").select("saldo").gt("saldo", 0).in("estado", ["emitida", "cobrada_parcial", "vencida"]),
    supabase.from("facturas").select("fecha, total, costo_total, utilidad").neq("estado", "anulada").gte("fecha", iso(hace6)),
    supabase.from("facturas").select("total, cliente:clientes(nombre)").neq("estado", "anulada"),
    supabase.from("gastos").select("monto, categoria:categorias_gasto(nombre)").gte("fecha", desde),
    supabase.from("facturas").select("id, numero, total, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("pagos").select("id, monto, factura_id, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("gastos").select("id, descripcion, monto, created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  const num = (v: unknown) => Number(v ?? 0);
  const facturado = (facturasRango.data ?? []).reduce((a, f) => a + num(f.total), 0);
  const utilidad = (facturasRango.data ?? []).reduce((a, f) => a + num(f.utilidad), 0);
  const cobrado = (pagosRango.data ?? []).reduce((a, p) => a + num(p.monto), 0);
  const porCobrar = (porCobrarRes.data ?? []).reduce((a, f) => a + num(f.saldo), 0);

  // Área 6 meses
  const meses: { clave: string; mes: string; Ingresos: number; Costos: number; Utilidad: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1);
    meses.push({ clave: `${d.getFullYear()}-${d.getMonth()}`, mes: MESES_CORTO[d.getMonth()] ?? "", Ingresos: 0, Costos: 0, Utilidad: 0 });
  }
  (facturas6m.data ?? []).forEach((f) => {
    const d = new Date((f.fecha as string) + "T00:00:00");
    const clave = `${d.getFullYear()}-${d.getMonth()}`;
    const m = meses.find((x) => x.clave === clave);
    if (m) {
      m.Ingresos += num(f.total);
      m.Costos += num(f.costo_total);
      m.Utilidad += num(f.utilidad);
    }
  });

  // Top 5 clientes
  const mapaCli = new Map<string, number>();
  ((facturasCliente.data as unknown as { total: number; cliente: { nombre: string } | null }[] | null) ?? []).forEach((f) => {
    const n = f.cliente?.nombre ?? "Sin cliente";
    mapaCli.set(n, (mapaCli.get(n) ?? 0) + num(f.total));
  });
  const topClientes = Array.from(mapaCli.entries())
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Donut gastos
  const mapaGasto = new Map<string, number>();
  ((gastosRango.data as unknown as { monto: number; categoria: { nombre: string } | null }[] | null) ?? []).forEach((g) => {
    const n = g.categoria?.nombre ?? "Sin categoría";
    mapaGasto.set(n, (mapaGasto.get(n) ?? 0) + num(g.monto));
  });
  const donutGastos = Array.from(mapaGasto.entries()).map(([nombre, total]) => ({ nombre, total }));

  // Actividad reciente
  type Act = { id: string; tipo: string; icono: "fac" | "pago" | "gasto"; texto: string; monto: number; fecha: string; href: string };
  const actividad: Act[] = [
    ...(actFacturas.data ?? []).map((f) => ({
      id: `f${f.id}`, tipo: "Factura", icono: "fac" as const, texto: f.numero as string,
      monto: num(f.total), fecha: f.created_at as string, href: `/facturas/${f.id}`,
    })),
    ...(actPagos.data ?? []).map((p) => ({
      id: `p${p.id}`, tipo: "Cobro", icono: "pago" as const, texto: "Cobro recibido",
      monto: num(p.monto), fecha: p.created_at as string, href: p.factura_id ? `/facturas/${p.factura_id}` : "/cobros",
    })),
    ...(actGastos.data ?? []).map((g) => ({
      id: `g${g.id}`, tipo: "Gasto", icono: "gasto" as const, texto: g.descripcion as string,
      monto: num(g.monto), fecha: g.created_at as string, href: "/gastos",
    })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 8);

  const iconAct = { fac: FileText, pago: HandCoins, gasto: Wallet };

  return (
    <>
      <PageHeader
        title={`Hola${nombre ? `, ${nombre}` : ""}`}
        description={`Resumen de tu negocio · ${etiqueta}`}
        action={<RangoSelector rango={rango} />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={`Facturado ${etiqueta}`} valor={facturado} icon={ReceiptText} />
        <KpiCard label={`Cobrado ${etiqueta}`} valor={cobrado} icon={HandCoins} tono="text-success" />
        <KpiCard label={`Utilidad real ${etiqueta}`} valor={utilidad} icon={TrendingUp} tono="text-accent" />
        <KpiCard label="Por cobrar" valor={porCobrar} icon={Clock} tono="text-warning" sub="Total pendiente" />
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Ingresos, costos y utilidad · 6 meses
          </h2>
          <AreaIngresos data={meses} />
        </div>
        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Gastos por categoría
          </h2>
          {donutGastos.length > 0 ? (
            <DonutGastos data={donutGastos} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">Sin gastos en el período.</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top clientes */}
        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Top clientes por facturación
          </h2>
          {topClientes.length > 0 ? (
            <BarrasClientes data={topClientes} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">Aún no hay facturas.</p>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="rounded-card border border-line bg-surface">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="text-sm font-semibold">Actividad reciente</h2>
          </div>
          {actividad.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">Sin movimientos todavía.</p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {actividad.map((a) => {
                const Icon = iconAct[a.icono];
                return (
                  <li key={a.id}>
                    <Link href={a.href} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-elevated/50">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-field bg-elevated ring-1 ring-line">
                        <Icon className="h-4 w-4 text-muted" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.texto}</p>
                        <p className="text-xs text-muted">{a.tipo} · {formatearFecha(a.fecha)}</p>
                      </div>
                      <span className="text-sm tabular-nums">{formatearRD(a.monto)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

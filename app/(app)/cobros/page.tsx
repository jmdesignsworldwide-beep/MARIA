import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { EstadoFactura } from "@/lib/database.types";
import {
  CobrosVista,
  type CuentaPorCobrar,
  type Aging,
} from "@/components/cobros/cobros-vista";

export const metadata: Metadata = { title: "Cobros" };

type QueryRow = {
  id: string;
  numero: string;
  total: number;
  saldo: number;
  fecha_vencimiento: string | null;
  estado: EstadoFactura;
  cliente: { nombre: string; telefono: string | null } | null;
};

function diasEntre(desdeISO: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(desdeISO + "T00:00:00");
  return Math.floor((hoy.getTime() - venc.getTime()) / 86400000);
}

function waRecordatorio(
  telefono: string | null,
  cliente: string,
  numero: string,
  saldo: number,
  empresa: string | null,
  venc: string | null,
): string {
  const msg =
    `Hola ${cliente}, le recuerdo amablemente la factura ${numero}` +
    (empresa ? ` de ${empresa}` : "") +
    ` con un saldo pendiente de RD$ ${saldo.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` +
    (venc ? `, con vencimiento ${venc.split("-").reverse().join("/")}` : "") +
    `. Agradezco su pago. ¡Gracias!`;
  const texto = encodeURIComponent(msg);
  if (!telefono) return `https://wa.me/?text=${texto}`;
  let d = telefono.replace(/\D/g, "");
  if (d.length === 10) d = `1${d}`;
  return `https://wa.me/${d}?text=${texto}`;
}

export default async function CobrosPage() {
  const supabase = await createClient();

  const [{ data }, { data: empresa }] = await Promise.all([
    supabase
      .from("facturas")
      .select("id, numero, total, saldo, fecha_vencimiento, estado, cliente:clientes(nombre, telefono)")
      .gt("saldo", 0)
      .in("estado", ["emitida", "cobrada_parcial", "vencida"])
      .order("fecha_vencimiento", { ascending: true }),
    supabase.from("empresa_config").select("nombre").maybeSingle(),
  ]);

  const rows = (data as unknown as QueryRow[] | null) ?? [];
  const empresaNombre = empresa?.nombre ?? null;

  const aging: Aging = { alDia: 0, d1_15: 0, d16_30: 0, mas30: 0 };
  let totalPorCobrar = 0;
  let totalVencido = 0;

  const cuentas: CuentaPorCobrar[] = rows.map((r) => {
    const saldo = Number(r.saldo);
    const dias = r.fecha_vencimiento ? diasEntre(r.fecha_vencimiento) : -1;
    totalPorCobrar += saldo;
    if (dias > 0) totalVencido += saldo;

    if (dias <= 0) aging.alDia += saldo;
    else if (dias <= 15) aging.d1_15 += saldo;
    else if (dias <= 30) aging.d16_30 += saldo;
    else aging.mas30 += saldo;

    const nombre = r.cliente?.nombre ?? "Sin cliente";
    return {
      factura_id: r.id,
      numero: r.numero,
      cliente_nombre: nombre,
      total: Number(r.total),
      saldo,
      fecha_vencimiento: r.fecha_vencimiento,
      diasVencido: dias > 0 ? dias : 0,
      waHref: waRecordatorio(
        r.cliente?.telefono ?? null,
        nombre,
        r.numero,
        saldo,
        empresaNombre,
        r.fecha_vencimiento,
      ),
    };
  });

  return (
    <CobrosVista
      cuentas={cuentas}
      aging={aging}
      totalPorCobrar={totalPorCobrar}
      totalVencido={totalVencido}
    />
  );
}

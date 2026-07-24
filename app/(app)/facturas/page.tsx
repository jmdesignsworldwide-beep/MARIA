import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { vencerFacturasVencidas } from "@/lib/actions/facturas";
import type { EstadoFactura } from "@/lib/database.types";
import { FacturasVista, type FacturaRow } from "@/components/facturas/facturas-vista";

export const metadata: Metadata = { title: "Facturas" };

type QueryRow = {
  id: string;
  numero: string;
  fecha: string;
  total: number;
  saldo: number;
  estado: EstadoFactura;
  cliente: { nombre: string } | null;
};

export default async function FacturasPage() {
  await vencerFacturasVencidas();

  const supabase = await createClient();
  const { data } = await supabase
    .from("facturas")
    .select("id, numero, fecha, total, saldo, estado, cliente:clientes(nombre)")
    .order("fecha", { ascending: false })
    .order("numero", { ascending: false });

  const rows = (data as unknown as QueryRow[] | null) ?? [];
  const facturas: FacturaRow[] = rows.map((f) => ({
    id: f.id,
    numero: f.numero,
    fecha: f.fecha,
    total: Number(f.total),
    saldo: Number(f.saldo),
    estado: f.estado,
    cliente_nombre: f.cliente?.nombre ?? "Sin cliente",
  }));

  return <FacturasVista facturas={facturas} />;
}

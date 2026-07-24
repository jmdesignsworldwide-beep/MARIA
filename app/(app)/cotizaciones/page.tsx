import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { vencerCotizacionesVencidas } from "@/lib/actions/cotizaciones";
import type { EstadoCotizacion } from "@/lib/database.types";
import {
  CotizacionesVista,
  type CotizacionRow,
} from "@/components/cotizaciones/cotizaciones-vista";

export const metadata: Metadata = { title: "Cotizaciones" };

type QueryRow = {
  id: string;
  numero: string;
  fecha: string;
  total: number;
  estado: EstadoCotizacion;
  cliente: { nombre: string } | null;
};

export default async function CotizacionesPage() {
  // Vencimiento automático al cargar el listado.
  await vencerCotizacionesVencidas();

  const supabase = await createClient();
  const { data } = await supabase
    .from("cotizaciones")
    .select("id, numero, fecha, total, estado, cliente:clientes(nombre)")
    .order("fecha", { ascending: false })
    .order("numero", { ascending: false });

  const rows = (data as unknown as QueryRow[] | null) ?? [];
  const cotizaciones: CotizacionRow[] = rows.map((c) => ({
    id: c.id,
    numero: c.numero,
    fecha: c.fecha,
    total: Number(c.total),
    estado: c.estado,
    cliente_nombre: c.cliente?.nombre ?? "Sin cliente",
  }));

  return <CotizacionesVista cotizaciones={cotizaciones} />;
}

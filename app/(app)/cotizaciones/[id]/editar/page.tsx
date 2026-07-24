import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Cotizacion, CotizacionLinea } from "@/lib/database.types";
import { CotizacionForm } from "@/components/cotizaciones/cotizacion-form";

export const metadata: Metadata = { title: "Editar cotización" };

type CotizacionConLineas = Cotizacion & { cotizacion_lineas: CotizacionLinea[] };

export default async function EditarCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cotData }, { data: clientes }, { data: catalogo }] =
    await Promise.all([
      supabase
        .from("cotizaciones")
        .select("*, cotizacion_lineas(*)")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("catalogo_items").select("*").eq("activo", true).order("descripcion"),
    ]);

  const cotizacion = cotData as unknown as CotizacionConLineas | null;
  if (!cotizacion) notFound();
  if (cotizacion.estado === "convertida") notFound();

  const lineas = (cotizacion.cotizacion_lineas ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((l) => ({
      catalogo_item_id: l.catalogo_item_id,
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      itbis_aplicable: l.itbis_aplicable,
    }));

  return (
    <CotizacionForm
      clientes={clientes ?? []}
      catalogo={catalogo ?? []}
      cotizacion={{
        id: cotizacion.id,
        cliente_id: cotizacion.cliente_id,
        fecha: cotizacion.fecha,
        validez_dias: cotizacion.validez_dias,
        itbis_activo: cotizacion.itbis_activo,
        itbis_tasa: Number(cotizacion.itbis_tasa),
        notas: cotizacion.notas,
        condiciones: cotizacion.condiciones,
        lineas,
      }}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Factura, FacturaLinea } from "@/lib/database.types";
import { FacturaForm } from "@/components/facturas/factura-form";

export const metadata: Metadata = { title: "Editar factura" };

type FacturaConLineas = Factura & { factura_lineas: FacturaLinea[] };

export default async function EditarFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: facData }, { data: clientes }, { data: catalogo }, { data: suplidores }] =
    await Promise.all([
      supabase.from("facturas").select("*, factura_lineas(*)").eq("id", id).maybeSingle(),
      supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("catalogo_items").select("*").eq("activo", true).order("descripcion"),
      supabase.from("suplidores").select("id, nombre").eq("activo", true).order("nombre"),
    ]);

  const factura = facData as unknown as FacturaConLineas | null;
  if (!factura) notFound();
  if (factura.estado !== "borrador") notFound();

  const lineas = (factura.factura_lineas ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((l) => ({
      catalogo_item_id: l.catalogo_item_id,
      suplidor_id: l.suplidor_id,
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      costo_unitario: Number(l.costo_unitario),
      itbis_aplicable: l.itbis_aplicable,
    }));

  return (
    <FacturaForm
      clientes={clientes ?? []}
      catalogo={catalogo ?? []}
      suplidores={suplidores ?? []}
      factura={{
        id: factura.id,
        cliente_id: factura.cliente_id,
        fecha: factura.fecha,
        fecha_vencimiento: factura.fecha_vencimiento,
        itbis_activo: factura.itbis_activo,
        itbis_tasa: Number(factura.itbis_tasa),
        descuento: Number(factura.descuento),
        notas: factura.notas,
        lineas,
      }}
    />
  );
}

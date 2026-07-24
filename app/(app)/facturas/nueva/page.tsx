import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FacturaForm } from "@/components/facturas/factura-form";

export const metadata: Metadata = { title: "Nueva factura" };

export default async function NuevaFacturaPage() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: catalogo }, { data: suplidores }] =
    await Promise.all([
      supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("catalogo_items").select("*").eq("activo", true).order("descripcion"),
      supabase.from("suplidores").select("id, nombre").eq("activo", true).order("nombre"),
    ]);

  return (
    <FacturaForm
      clientes={clientes ?? []}
      catalogo={catalogo ?? []}
      suplidores={suplidores ?? []}
    />
  );
}

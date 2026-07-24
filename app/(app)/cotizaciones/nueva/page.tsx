import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CotizacionForm } from "@/components/cotizaciones/cotizacion-form";

export const metadata: Metadata = { title: "Nueva cotización" };

export default async function NuevaCotizacionPage() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: catalogo }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("catalogo_items")
      .select("*")
      .eq("activo", true)
      .order("descripcion"),
  ]);

  return (
    <CotizacionForm clientes={clientes ?? []} catalogo={catalogo ?? []} />
  );
}

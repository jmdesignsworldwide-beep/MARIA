import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CatalogoVista } from "@/components/catalogo/catalogo-vista";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogoPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("catalogo_items")
    .select("*")
    .order("descripcion", { ascending: true });

  return <CatalogoVista items={items ?? []} />;
}

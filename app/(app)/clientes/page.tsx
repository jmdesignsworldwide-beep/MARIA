import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClientesVista } from "@/components/clientes/clientes-vista";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre", { ascending: true });

  return <ClientesVista clientes={clientes ?? []} />;
}

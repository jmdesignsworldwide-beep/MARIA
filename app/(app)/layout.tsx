import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { CommandPalette } from "@/components/app/command-palette";
import { Bienvenida } from "@/components/app/bienvenida";

/**
 * Layout del área autenticada. Exige sesión en el SERVIDOR antes de
 * renderizar nada (Estándar Fort Knox #3). Compone barra lateral +
 * barra superior + contenido.
 */
export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: empresa } = await supabase
    .from("empresa_config")
    .select("nombre")
    .eq("owner_id", user.id)
    .maybeSingle();
  const nombreEmpresa = empresa?.nombre?.trim() || "Mi empresa";
  const nombre = user.email?.split("@")[0] ?? "";

  return (
    <div className="min-h-screen">
      <Bienvenida nombre={nombre} />
      <CommandPalette />
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar email={user.email ?? "usuario"} nombreEmpresa={nombreEmpresa} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

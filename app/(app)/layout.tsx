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
  const [{ data: empresa }, { data: perfil }] = await Promise.all([
    supabase.from("empresa_config").select("nombre").eq("owner_id", user.id).maybeSingle(),
    supabase.from("profiles").select("rol, access_expires_at").eq("id", user.id).maybeSingle(),
  ]);
  const nombreEmpresa = empresa?.nombre?.trim() || "Mi empresa";
  const nombre = user.email?.split("@")[0] ?? "";
  const esAdmin = perfil?.rol === "admin";

  // Aviso sutil al cliente cuando su acceso está por vencer (≤ 3 días).
  let diasRestantes: number | null = null;
  if (!esAdmin && perfil?.access_expires_at) {
    const d = Math.ceil((new Date(perfil.access_expires_at).getTime() - Date.now()) / 86400000);
    if (d >= 0 && d <= 3) diasRestantes = d;
  }

  return (
    <div className="min-h-screen">
      <Bienvenida nombre={nombre} />
      <CommandPalette />
      <Sidebar esAdmin={esAdmin} />
      <div className="lg:pl-64">
        <Topbar email={user.email ?? "usuario"} nombreEmpresa={nombreEmpresa} esAdmin={esAdmin} />
        {diasRestantes !== null && (
          <div className="border-b border-warning/30 bg-warning-soft/50 px-4 py-2 text-center text-xs text-warning lg:px-8">
            Tu acceso vence {diasRestantes === 0 ? "hoy" : `en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}`}.
            Contacta a JM Nexus Designs para renovarlo.
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

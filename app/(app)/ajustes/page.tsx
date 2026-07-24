import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getRol } from "@/lib/auth";
import { listarAccesos } from "@/lib/actions/accesos";
import type { EmpresaConfig } from "@/lib/database.types";
import { PageHeader } from "@/components/app/page-header";
import { EmpresaForm } from "@/components/ajustes/empresa-form";
import { AccesosDemo } from "@/components/ajustes/accesos-demo";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: empresa } = await supabase
    .from("empresa_config")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  const rol = await getRol();
  const esAdmin = rol === "admin";

  let logoUrl: string | null = null;
  if (empresa?.logo_path) {
    const { data } = await supabase.storage.from("recibos").createSignedUrl(empresa.logo_path, 3600);
    logoUrl = data?.signedUrl ?? null;
  }

  const accesos = esAdmin ? await listarAccesos() : [];

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Configura tu empresa, la numeración, el ITBIS y los accesos."
      />

      {empresa ? (
        <div className="space-y-6">
          <EmpresaForm ownerId={user.id} empresa={empresa as EmpresaConfig} logoUrl={logoUrl} />
          {esAdmin && <AccesosDemo accesos={accesos} />}
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface p-8 text-center text-sm text-muted">
          No se encontró la configuración de la empresa.
        </div>
      )}
    </>
  );
}

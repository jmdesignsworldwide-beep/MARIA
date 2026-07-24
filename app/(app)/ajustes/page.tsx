import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { EmpresaConfig } from "@/lib/database.types";
import { PageHeader } from "@/components/app/page-header";
import { EmpresaForm } from "@/components/ajustes/empresa-form";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: empresa } = await supabase
    .from("empresa_config")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  let logoUrl: string | null = null;
  if (empresa?.logo_path) {
    const { data } = await supabase.storage.from("recibos").createSignedUrl(empresa.logo_path, 3600);
    logoUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Configura tu empresa, la numeración y el ITBIS."
      />

      {empresa ? (
        <div className="space-y-6">
          <EmpresaForm ownerId={user.id} empresa={empresa as EmpresaConfig} logoUrl={logoUrl} />
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface p-8 text-center text-sm text-muted">
          No se encontró la configuración de la empresa.
        </div>
      )}
    </>
  );
}

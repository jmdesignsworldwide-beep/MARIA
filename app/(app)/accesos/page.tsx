import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listarCuentas } from "@/lib/actions/accesos";
import { PortalAccesos } from "@/components/accesos/portal-accesos";

export const metadata: Metadata = { title: "Accesos" };

export default async function AccesosPage() {
  // Control en el SERVIDOR: un cliente que fuerce esta URL es redirigido.
  await requireAdmin();
  const cuentas = await listarCuentas();
  return <PortalAccesos cuentas={cuentas} />;
}

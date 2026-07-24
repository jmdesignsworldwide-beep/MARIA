import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { obtenerProyeccion } from "@/lib/finanzas/queries";
import { ProyeccionVista } from "@/components/finanzas/proyeccion-vista";

export const metadata: Metadata = { title: "Finanzas · Proyección de caja" };

export default async function ProyeccionPage() {
  await requireUser();
  const data = await obtenerProyeccion();
  return <ProyeccionVista data={data} />;
}

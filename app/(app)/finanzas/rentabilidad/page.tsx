import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import {
  obtenerRentabilidad,
  periodoMesActual,
  periodoUltimosMeses,
} from "@/lib/finanzas/queries";
import { mesesDePeriodo } from "@/lib/finanzas/tipos";
import { RentabilidadVista } from "@/components/finanzas/rentabilidad-vista";

export const metadata: Metadata = { title: "Finanzas · Rentabilidad" };

export default async function RentabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  await requireUser();
  const { p } = await searchParams;
  const periodo = p ?? "6m";
  const meses = mesesDePeriodo(periodo);
  const rango = meses === 1 ? periodoMesActual() : periodoUltimosMeses(meses);
  const data = await obtenerRentabilidad(rango);

  return <RentabilidadVista data={data} periodo={periodo} />;
}

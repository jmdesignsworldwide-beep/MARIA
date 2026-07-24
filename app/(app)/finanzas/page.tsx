import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import {
  obtenerFlujo,
  periodoMesActual,
  periodoUltimosMeses,
} from "@/lib/finanzas/queries";
import { mesesDePeriodo } from "@/lib/finanzas/tipos";
import { FlujoVista } from "@/components/finanzas/flujo-vista";

export const metadata: Metadata = { title: "Finanzas · Flujo del mes" };

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function FinanzasFlujoPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  await requireUser();
  const { p } = await searchParams;
  const periodo = p ?? "mes";
  const meses = mesesDePeriodo(periodo);
  const rango = meses === 1 ? periodoMesActual() : periodoUltimosMeses(meses);
  const data = await obtenerFlujo(rango);

  const etiqueta =
    meses === 1 ? MESES[new Date().getMonth()] ?? "Este mes" : `${meses} meses`;

  return <FlujoVista data={data} periodo={periodo} etiquetaPeriodo={etiqueta} />;
}

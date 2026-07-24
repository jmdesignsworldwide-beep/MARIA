import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import {
  obtenerEstadoResultados,
  periodoMesActual,
  periodoUltimosMeses,
} from "@/lib/finanzas/queries";
import { mesesDePeriodo } from "@/lib/finanzas/tipos";
import { ResultadosVista } from "@/components/finanzas/resultados-vista";

export const metadata: Metadata = { title: "Finanzas · Estado de resultados" };

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  await requireUser();
  const { p } = await searchParams;
  const periodo = p ?? "mes";
  const meses = mesesDePeriodo(periodo);
  const rango = meses === 1 ? periodoMesActual() : periodoUltimosMeses(meses);
  const data = await obtenerEstadoResultados(rango);
  const etiqueta =
    meses === 1 ? MESES[new Date().getMonth()] ?? "Este mes" : `Últimos ${meses} meses`;

  return <ResultadosVista data={data} periodo={periodo} etiquetaPeriodo={etiqueta} />;
}

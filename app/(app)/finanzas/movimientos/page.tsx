import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import {
  obtenerLibro,
  periodoMesActual,
  periodoUltimosMeses,
} from "@/lib/finanzas/queries";
import { mesesDePeriodo } from "@/lib/finanzas/tipos";
import { LibroVista } from "@/components/finanzas/libro-vista";

export const metadata: Metadata = { title: "Finanzas · Movimientos" };

const PAGE_SIZE = 50;

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; tipo?: string; q?: string; pag?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const periodo = sp.p ?? "mes";
  const tipo = sp.tipo ?? "todos";
  const busqueda = sp.q ?? "";
  const page = Math.max(1, Number(sp.pag) || 1);

  const meses = mesesDePeriodo(periodo);
  const rango = meses === 1 ? periodoMesActual() : periodoUltimosMeses(meses);

  const data = await obtenerLibro(rango, {
    tipo,
    busqueda,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return (
    <LibroVista
      data={data}
      periodo={periodo}
      tipo={tipo}
      busqueda={busqueda}
      page={page}
      periodoRango={rango}
    />
  );
}

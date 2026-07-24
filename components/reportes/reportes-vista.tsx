"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { formatearRD, formatearFecha } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import type { EmpresaPDF } from "@/lib/pdf/tipos";
import type { EstadoResultados, Movimiento } from "@/components/reportes/reporte-doc";

const ReporteDescargar = dynamic(() => import("@/components/reportes/reporte-descargar"), {
  ssr: false,
  loading: () => (
    <Button size="sm" variant="secondary" disabled>
      <Loader2 className="h-4 w-4 animate-spin" /> PDF…
    </Button>
  ),
});

export type Periodo = "mes" | "anio";

export function ReportesVista({
  empresa,
  periodoKey,
  periodoLabel,
  estado,
  estadoAnterior,
  movimientos,
}: {
  empresa: EmpresaPDF;
  periodoKey: Periodo;
  periodoLabel: string;
  estado: EstadoResultados;
  estadoAnterior: EstadoResultados;
  movimientos: Movimiento[];
}) {
  const router = useRouter();

  function exportarCSV() {
    const filas = [
      ["Fecha", "Concepto", "Tipo", "Monto"],
      ...movimientos.map((m) => [
        formatearFecha(m.fecha),
        `"${m.concepto.replace(/"/g, '""')}"`,
        m.tipo === "entrada" ? "Entrada" : "Salida",
        (m.tipo === "entrada" ? m.monto : -m.monto).toFixed(2),
      ]),
    ];
    const csv = "﻿" + filas.map((f) => f.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LibroMovimientos_${periodoLabel.replace(/\s+/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const deltaNeta =
    estadoAnterior.utilidadNeta !== 0
      ? ((estado.utilidadNeta - estadoAnterior.utilidadNeta) / Math.abs(estadoAnterior.utilidadNeta)) * 100
      : null;

  const filas: { label: string; valor: number; signo?: string; tono?: string; fuerte?: boolean }[] = [
    { label: "Ingresos (facturado)", valor: estado.ingresos },
    { label: "Costos de venta", valor: estado.costos, signo: "-" },
    { label: "Utilidad bruta", valor: estado.utilidadBruta, tono: "text-success" },
    { label: "Gastos operativos", valor: estado.gastos, signo: "-" },
    { label: "Utilidad neta", valor: estado.utilidadNeta, tono: estado.utilidadNeta >= 0 ? "text-success" : "text-danger", fuerte: true },
  ];

  return (
    <>
      <PageHeader
        title="Reportes y contabilidad"
        description="El registro del dinero de tu negocio."
        action={
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-field border border-line bg-elevated p-0.5">
              {(["mes", "anio"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => router.push(`/reportes?periodo=${p}`)}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    periodoKey === p ? "bg-accent text-accent-contrast" : "text-muted hover:text-fg"
                  }`}
                >
                  {p === "mes" ? "Este mes" : "Este año"}
                </button>
              ))}
            </div>
            <Button size="sm" variant="secondary" onClick={exportarCSV}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel (CSV)
            </Button>
            <ReporteDescargar
              empresa={empresa}
              periodo={periodoLabel}
              estado={estado}
              movimientos={movimientos}
              fileName={`Reporte_${periodoLabel.replace(/\s+/g, "")}.pdf`}
            />
          </div>
        }
      />

      {/* Estado de resultados */}
      <div className="mb-6 rounded-card border border-line bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Estado de resultados · {periodoLabel}
          </h2>
          {deltaNeta !== null && (
            <span className={`flex items-center gap-1 text-xs ${deltaNeta >= 0 ? "text-success" : "text-danger"}`}>
              {deltaNeta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(deltaNeta).toFixed(1)}% vs. período anterior
            </span>
          )}
        </div>
        <dl className="mx-auto max-w-xl">
          {filas.map((f) => (
            <div
              key={f.label}
              className={`flex justify-between py-2.5 ${
                f.fuerte ? "mt-2 border-t border-line pt-3" : "border-b border-line-soft"
              }`}
            >
              <dt className={f.fuerte ? "text-base font-semibold" : "text-sm text-muted"}>{f.label}</dt>
              <dd className={`tabular-nums ${f.fuerte ? "text-base font-semibold" : "text-sm"} ${f.tono ?? ""}`}>
                {f.signo ? `${f.signo} ` : ""}{formatearRD(f.valor)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Libro de movimientos */}
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold">Libro de movimientos · {periodoLabel}</h2>
        </div>
        {movimientos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Sin movimientos en el período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Concepto</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i} className="border-b border-line-soft last:border-0">
                    <td className="px-5 py-2.5 tabular-nums text-muted">{formatearFecha(m.fecha)}</td>
                    <td className="px-4 py-2.5">{m.concepto}</td>
                    <td className="px-4 py-2.5">
                      <span className={m.tipo === "entrada" ? "text-success" : "text-danger"}>
                        {m.tipo === "entrada" ? "Entrada" : "Salida"}
                      </span>
                    </td>
                    <td className={`px-5 py-2.5 text-right tabular-nums ${m.tipo === "entrada" ? "text-success" : "text-danger"}`}>
                      {m.tipo === "entrada" ? "" : "- "}{formatearRD(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

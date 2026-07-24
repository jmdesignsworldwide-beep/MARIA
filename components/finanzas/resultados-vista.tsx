"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Info, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import type { EstadoResultadosData } from "@/lib/finanzas/tipos";
import { formatearRD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PeriodoSelector } from "@/components/finanzas/periodo-selector";

function pct(v: number | null): string {
  return v === null || !Number.isFinite(v) ? "—" : `${v.toFixed(1)}%`;
}

export function ResultadosVista({
  data,
  periodo,
  etiquetaPeriodo,
}: {
  data: EstadoResultadosData;
  periodo: string;
  etiquetaPeriodo: string;
}) {
  const [abierto, setAbierto] = useState(false);

  const deltaUtilidad =
    data.prev.utilidad_neta !== 0
      ? ((data.utilidad_neta - data.prev.utilidad_neta) / Math.abs(data.prev.utilidad_neta)) * 100
      : null;
  const netaPositiva = data.utilidad_neta >= 0;

  function exportarPDF() {
    const html = construirPDF(data, etiquetaPeriodo);
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Permite las ventanas emergentes para exportar a PDF.");
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Ganancia real: lo que facturaste menos lo que costó.</p>
        <div className="flex items-center gap-2">
          <PeriodoSelector actual={periodo} />
          <Button variant="secondary" size="sm" onClick={exportarPDF}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Nota facturado vs cobrado */}
      <div className="flex items-start gap-2 rounded-card border border-accent/30 bg-accent-soft/30 px-4 py-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 flex-none text-accent" />
        <p className="text-muted">
          Este estado usa lo <strong className="text-fg">facturado</strong> (
          {formatearRD(data.facturado)}). De eso, has{" "}
          <strong className="text-fg">cobrado {formatearRD(data.cobrado)}</strong>. La diferencia
          sigue pendiente de cobro.
        </p>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <Linea label="Ventas facturadas" valor={data.facturado} fuerte />
        <Linea label="− Costo de mercancía" valor={-data.costo_mercancia} />
        <Linea
          label="= Utilidad bruta"
          valor={data.utilidad_bruta}
          sufijo={`margen ${pct(data.margen_bruto_pct)}`}
          destacado
        />

        {/* Gastos con drill-down */}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="flex w-full items-center justify-between border-t border-line px-5 py-3.5 text-left transition-colors hover:bg-elevated/50"
        >
          <span className="flex items-center gap-1.5 text-sm">
            {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            − Gastos operativos
          </span>
          <span className="tabular-nums text-danger">{formatearRD(-data.gastos)}</span>
        </button>
        {abierto && (
          <div className="border-t border-line-soft bg-elevated/30 px-5 py-2">
            {data.gastos_categoria.length === 0 ? (
              <p className="py-2 text-xs text-muted">Sin gastos en el periodo.</p>
            ) : (
              data.gastos_categoria.map((c) => (
                <div key={c.nombre} className="flex justify-between py-1.5 text-sm">
                  <span className="text-muted">{c.nombre}</span>
                  <span className="tabular-nums">{formatearRD(c.total)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Utilidad neta */}
        <div
          className={`flex items-center justify-between border-t-2 px-5 py-4 ${
            netaPositiva ? "border-accent/40 bg-accent-soft/30" : "border-danger/40 bg-danger-soft/40"
          }`}
        >
          <div>
            <p className="text-sm font-semibold text-fg">= Utilidad neta</p>
            <p className="text-xs text-muted">Margen neto {pct(data.margen_neto_pct)}</p>
          </div>
          <div className="text-right">
            <p
              className={`text-2xl font-semibold tabular-nums ${
                netaPositiva ? "text-fg" : "text-danger"
              }`}
            >
              {formatearRD(data.utilidad_neta)}
            </p>
            {deltaUtilidad !== null && (
              <p
                className={`flex items-center justify-end gap-1 text-xs font-medium ${
                  deltaUtilidad >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {deltaUtilidad >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(deltaUtilidad).toFixed(1)}% vs. periodo anterior
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Linea({
  label,
  valor,
  sufijo,
  fuerte,
  destacado,
}: {
  label: string;
  valor: number;
  sufijo?: string;
  fuerte?: boolean;
  destacado?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-t border-line px-5 py-3.5 first:border-t-0 ${
        destacado ? "bg-elevated/40" : ""
      }`}
    >
      <span className={`text-sm ${fuerte || destacado ? "font-medium text-fg" : "text-muted"}`}>
        {label}
      </span>
      <span className="flex items-baseline gap-3">
        {sufijo && <span className="text-xs text-muted">{sufijo}</span>}
        <span
          className={`tabular-nums ${
            valor < 0 ? "text-danger" : destacado ? "font-semibold text-fg" : "text-fg"
          }`}
        >
          {formatearRD(valor)}
        </span>
      </span>
    </div>
  );
}

function construirPDF(data: EstadoResultadosData, periodo: string): string {
  const fila = (l: string, v: number, b = false) =>
    `<tr${b ? ' style="font-weight:600"' : ""}><td>${l}</td><td class="num">${formatearRD(v)}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Estado de resultados</title>
    <style>
      body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;background:#fff;padding:32px}
      h1{font-size:20px;margin:0 0 2px;color:#111}
      .sub{color:#555;font-size:12px;margin:0 0 20px}
      table{width:100%;max-width:520px;border-collapse:collapse;font-size:13px}
      td{padding:8px 4px;border-bottom:1px solid #eee}
      .num{text-align:right;font-variant-numeric:tabular-nums}
      .tot td{border-top:2px solid #B87817;border-bottom:none;padding-top:12px;font-size:15px;font-weight:700}
      .amber{color:#B87817}
    </style></head><body>
    <h1>Estado de resultados</h1>
    <p class="sub">JM Nexus Designs · ${periodo}</p>
    <table>
      ${fila("Ventas facturadas", data.facturado, true)}
      ${fila("Costo de mercancía", -data.costo_mercancia)}
      ${fila("Utilidad bruta (" + pct(data.margen_bruto_pct) + ")", data.utilidad_bruta, true)}
      ${fila("Gastos operativos", -data.gastos)}
      <tr class="tot"><td>Utilidad neta (${pct(data.margen_neto_pct)})</td><td class="num amber">${formatearRD(data.utilidad_neta)}</td></tr>
    </table>
    <p class="sub" style="margin-top:16px">Facturado ${formatearRD(data.facturado)} · Cobrado ${formatearRD(data.cobrado)}</p>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`;
}

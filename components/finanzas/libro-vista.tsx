"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  ShoppingCart,
  Wallet,
  HandCoins,
  FileSpreadsheet,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { LibroData, Movimiento, MovimientoTipo, Periodo } from "@/lib/finanzas/tipos";
import { formatearRD, formatearFecha } from "@/lib/format";
import { exportarLibro } from "@/lib/actions/finanzas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PeriodoSelector } from "@/components/finanzas/periodo-selector";

const PAGE_SIZE = 50;

const TIPOS: { valor: string; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "cobro", etiqueta: "Cobros" },
  { valor: "compra", etiqueta: "Compras" },
  { valor: "gasto", etiqueta: "Gastos" },
];

const iconoTipo: Record<MovimientoTipo, typeof HandCoins> = {
  cobro: HandCoins,
  compra: ShoppingCart,
  gasto: Wallet,
};

const badgeTipo: Record<MovimientoTipo, string> = {
  cobro: "bg-success-soft text-success",
  compra: "bg-accent-soft text-accent",
  gasto: "bg-danger-soft text-danger",
};

function hrefDoc(m: Movimiento): string | null {
  if (!m.doc_id) return null;
  if (m.doc_tipo === "factura") return `/facturas/${m.doc_id}`;
  if (m.doc_tipo === "compra") return `/compras`;
  if (m.doc_tipo === "gasto") return `/gastos`;
  return null;
}

export function LibroVista({
  data,
  periodo,
  tipo,
  busqueda: busquedaInicial,
  page,
  periodoRango,
}: {
  data: LibroData;
  periodo: string;
  tipo: string;
  busqueda: string;
  page: number;
  periodoRango: Periodo;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [pending, startTransition] = useTransition();
  const [exportando, setExportando] = useState(false);

  const totalPaginas = Math.max(1, Math.ceil(data.total_count / PAGE_SIZE));

  function irA(cambios: Record<string, string>) {
    const p = new URLSearchParams();
    p.set("p", periodo);
    p.set("tipo", tipo);
    if (busqueda) p.set("q", busqueda);
    p.set("pag", String(page));
    Object.entries(cambios).forEach(([k, v]) => p.set(k, v));
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    irA({ q: busqueda, pag: "1" });
  }

  async function exportar(formato: "excel" | "pdf") {
    setExportando(true);
    const res = await exportarLibro(periodoRango, { tipo, busqueda });
    setExportando(false);
    if (!res.ok || res.rows.length === 0) {
      toast.info("No hay movimientos para exportar en este filtro.");
      return;
    }
    if (formato === "excel") descargarCSV(res.rows);
    else imprimirPDF(res.rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Todo el dinero que se movió, en una sola lista con saldo acumulado.
        </p>
        <PeriodoSelector actual={periodo} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
        <div className="inline-flex rounded-field border border-line p-0.5">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => irA({ tipo: t.valor, pag: "1" })}
              aria-pressed={tipo === t.valor}
              className={`rounded-[calc(theme(borderRadius.field)-2px)] px-3 py-1.5 text-xs font-medium transition-colors ${
                tipo === t.valor ? "bg-accent text-accent-contrast" : "text-muted hover:text-fg"
              }`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>

        <form onSubmit={buscar} className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar concepto o referencia…"
            className="h-9 pl-9 text-sm"
          />
        </form>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => exportar("excel")} loading={exportando}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportar("pdf")} loading={exportando}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Totales del filtro — siempre visibles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TotalCard label="Entradas" valor={data.total_entradas} tono="text-success" icon={ArrowDownRight} />
        <TotalCard label="Salidas" valor={data.total_salidas} tono="text-danger" icon={ArrowUpRight} />
        <TotalCard
          label="Saldo neto"
          valor={data.saldo_neto}
          tono={data.saldo_neto >= 0 ? "text-fg" : "text-danger"}
          icon={Wallet}
        />
      </div>

      {/* Tabla */}
      {data.rows.length === 0 ? (
        <div className="rounded-card border border-line bg-surface px-4 py-12 text-center text-sm text-muted">
          No hay movimientos en este periodo con los filtros actuales.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 text-right font-medium">Entrada</th>
                <th className="px-4 py-3 text-right font-medium">Salida</th>
                <th className="px-4 py-3 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((m, i) => {
                const Icono = iconoTipo[m.tipo];
                const href = hrefDoc(m);
                return (
                  <tr
                    key={`${m.doc_id}-${i}`}
                    onClick={() => href && router.push(href)}
                    className={`border-b border-line-soft last:border-0 ${
                      href ? "cursor-pointer hover:bg-elevated/60" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">
                      {formatearFecha(m.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeTipo[m.tipo]}`}
                      >
                        <Icono className="h-3 w-3" />
                        <span className="capitalize">{m.tipo}</span>
                      </span>
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-3">{m.descripcion}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-success">
                      {m.entrada > 0 ? formatearRD(m.entrada) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-danger">
                      {m.salida > 0 ? formatearRD(m.salida) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium tabular-nums ${
                        m.saldo >= 0 ? "text-fg" : "text-danger"
                      }`}
                    >
                      {formatearRD(m.saldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {data.total_count > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Mostrando {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, data.total_count)} de {data.total_count}
          </p>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || pending}
              onClick={() => irA({ pag: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPaginas || pending}
              onClick={() => irA({ pag: String(page + 1) })}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TotalCard({
  label,
  valor,
  tono,
  icon: Icon,
}: {
  label: string;
  valor: number;
  tono: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tono}`}>{formatearRD(valor)}</p>
    </div>
  );
}

function descargarCSV(rows: Movimiento[]) {
  const encabezado = ["Fecha", "Tipo", "Referencia", "Concepto", "Entrada", "Salida", "Saldo", "Método"];
  const lineas = rows.map((m) =>
    [
      m.fecha,
      m.tipo,
      m.referencia,
      m.descripcion,
      m.entrada.toFixed(2),
      m.salida.toFixed(2),
      m.saldo.toFixed(2),
      m.metodo,
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = "﻿" + [encabezado.join(","), ...lineas].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "libro-de-movimientos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function imprimirPDF(rows: Movimiento[]) {
  const filas = rows
    .map(
      (m) => `<tr>
        <td>${formatearFecha(m.fecha)}</td>
        <td style="text-transform:capitalize">${m.tipo}</td>
        <td>${escapeHtml(m.descripcion)}</td>
        <td class="num">${m.entrada > 0 ? formatearRD(m.entrada) : ""}</td>
        <td class="num">${m.salida > 0 ? formatearRD(m.salida) : ""}</td>
        <td class="num">${formatearRD(m.saldo)}</td>
      </tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Libro de movimientos</title>
    <style>
      body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;padding:24px;background:#fff}
      h1{font-size:18px;margin:0 0 4px}
      p{color:#555;font-size:12px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:left}
      th{color:#666;text-transform:uppercase;font-size:10px}
      .num{text-align:right;font-variant-numeric:tabular-nums}
    </style></head><body>
    <h1>Libro de movimientos</h1>
    <p>JM Nexus Designs · ${rows.length} movimiento(s)</p>
    <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th class="num">Entrada</th><th class="num">Salida</th><th class="num">Saldo</th></tr></thead>
    <tbody>${filas}</tbody></table>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`;
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Permite las ventanas emergentes para exportar a PDF.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

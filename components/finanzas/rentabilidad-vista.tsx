"use client";

import { Trophy, Package, AlertTriangle, TrendingUp } from "lucide-react";
import type { RentabilidadData } from "@/lib/finanzas/tipos";
import { formatearRD, formatearFecha } from "@/lib/format";
import { etiquetaMes } from "@/lib/finanzas/tipos";
import { LineaMargen } from "@/components/dashboard/graficos";
import { PeriodoSelector } from "@/components/finanzas/periodo-selector";

export function RentabilidadVista({
  data,
  periodo,
}: {
  data: RentabilidadData;
  periodo: string;
}) {
  const maxUtil = Math.max(1, ...data.clientes.map((c) => Math.abs(c.utilidad)));
  const evolucion = data.evolucion.map((e) => ({
    mes: etiquetaMes(e.mes),
    margen: e.margen_pct,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Quién y qué te deja ganancia de verdad.</p>
        <PeriodoSelector actual={periodo} />
      </div>

      {/* Alerta facturas sin costo */}
      {data.sin_costo.length > 0 && (
        <div className="rounded-card border border-warning/40 bg-warning-soft/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <h2 className="text-sm font-semibold">
              {data.sin_costo.length} factura(s) sin costo registrado
            </h2>
          </div>
          <p className="mb-2 text-xs text-muted">
            Sin costo, la utilidad de estas facturas aparece inflada. Regístrales el costo por línea.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.sin_costo.slice(0, 12).map((f) => (
              <span
                key={f.numero}
                className="rounded-full bg-surface px-2.5 py-1 text-xs tabular-nums text-muted"
                title={`${formatearRD(f.total)} · ${formatearFecha(f.fecha)}`}
              >
                {f.numero}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ranking de clientes por utilidad */}
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Clientes por utilidad
            </h2>
          </div>
          {data.clientes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Sin datos en el periodo.</p>
          ) : (
            <ul className="space-y-3">
              {data.clientes.map((c) => {
                const neg = c.utilidad < 0;
                return (
                  <li key={c.cliente}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate">{c.cliente}</span>
                      <span className={`tabular-nums font-medium ${neg ? "text-danger" : "text-fg"}`}>
                        {formatearRD(c.utilidad)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                      <div
                        className={`h-full rounded-full ${neg ? "bg-danger" : "bg-accent"}`}
                        style={{ width: `${(Math.abs(c.utilidad) / maxUtil) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Ranking de productos por margen */}
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Productos por margen
            </h2>
          </div>
          {data.productos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Sin datos en el periodo.</p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {data.productos.map((p) => (
                <li key={p.descripcion} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{p.descripcion}</p>
                    <p className="text-xs text-muted tabular-nums">Venta {formatearRD(p.venta)}</p>
                  </div>
                  <span
                    className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${
                      p.margen_pct >= 30
                        ? "bg-success-soft text-success"
                        : p.margen_pct >= 15
                          ? "bg-warning-soft text-warning"
                          : "bg-danger-soft text-danger"
                    }`}
                  >
                    {p.margen_pct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Evolución del margen 6 meses */}
      <div className="rounded-card border border-line bg-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Evolución del margen (6 meses)
          </h2>
        </div>
        {evolucion.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aún no hay historial suficiente.</p>
        ) : (
          <LineaMargen data={evolucion} />
        )}
      </div>
    </div>
  );
}

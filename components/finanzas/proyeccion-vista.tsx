"use client";

import { ArrowDownRight, ArrowUpRight, Scale, AlertTriangle } from "lucide-react";
import type { ProyeccionData } from "@/lib/finanzas/tipos";
import { formatearRD } from "@/lib/format";

function badgeDias(dias: number): { txt: string; clase: string } {
  if (dias <= 0) return { txt: "Al día", clase: "bg-success-soft text-success" };
  if (dias <= 30) return { txt: `${dias} d`, clase: "bg-warning-soft text-warning" };
  return { txt: `${dias} d`, clase: "bg-danger-soft text-danger" };
}

export function ProyeccionVista({ data }: { data: ProyeccionData }) {
  const veredictoPositivo = data.veredicto >= 0;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Si cobras lo que te deben y pagas lo fijo del mes, ¿cómo quedas?
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LO QUE ME DEBEN */}
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2 text-success">
            <ArrowDownRight className="h-5 w-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Lo que me deben</h2>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-fg">{formatearRD(data.me_deben)}</p>

          <div className="mt-4 space-y-2">
            <Aging label="Por vencer" valor={data.aging.por_vencer} tono="text-success" />
            <Aging label="1 – 30 días" valor={data.aging.d1_30} tono="text-warning" />
            <Aging label="31 – 60 días" valor={data.aging.d31_60} tono="text-warning" />
            <Aging label="Más de 60 días" valor={data.aging.d60_mas} tono="text-danger" />
          </div>

          {data.top_deudores.length > 0 && (
            <div className="mt-4 border-t border-line-soft pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Principales deudores
              </p>
              <ul className="space-y-1.5">
                {data.top_deudores.map((d) => {
                  const b = badgeDias(d.dias);
                  return (
                    <li key={d.cliente} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{d.cliente}</span>
                      <span className="flex flex-none items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.clase}`}>
                          {b.txt}
                        </span>
                        <span className="tabular-nums">{formatearRD(d.saldo)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* LO QUE TENGO QUE PAGAR */}
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2 text-danger">
            <ArrowUpRight className="h-5 w-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Lo que tengo que pagar</h2>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-fg">
            {formatearRD(data.tengo_que_pagar)}
          </p>
          <p className="mt-1 text-xs text-muted">Gastos fijos recurrentes estimados del mes.</p>

          <div className="mt-4 space-y-1.5">
            {data.recurrentes.length === 0 ? (
              <p className="rounded-field border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                Marca tus gastos como “recurrentes” para verlos aquí.
              </p>
            ) : (
              data.recurrentes.map((r) => (
                <div
                  key={r.descripcion}
                  className="flex items-center justify-between rounded-field bg-elevated/50 px-3 py-2 text-sm"
                >
                  <span className="truncate">{r.descripcion}</span>
                  <span className="tabular-nums">{formatearRD(r.monto)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* EL VEREDICTO */}
      <div
        className={`rounded-card border-2 p-6 text-center ${
          veredictoPositivo
            ? "border-accent/40 bg-accent-soft/30"
            : "border-danger/50 bg-danger-soft/40"
        }`}
      >
        <div className="mb-1 flex items-center justify-center gap-2">
          {veredictoPositivo ? (
            <Scale className="h-5 w-5 text-accent" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-danger" />
          )}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">El veredicto</h2>
        </div>
        <p
          className={`text-4xl font-semibold tabular-nums ${
            veredictoPositivo ? "text-fg" : "text-danger"
          }`}
        >
          {formatearRD(data.veredicto)}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {veredictoPositivo
            ? "Si cobras lo pendiente, cubres tus gastos fijos y te sobra dinero."
            : "Cuidado: aunque cobres todo lo pendiente, no alcanza para tus gastos fijos del mes."}
        </p>
      </div>
    </div>
  );
}

function Aging({ label, valor, tono }: { label: string; valor: number; tono: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={`tabular-nums font-medium ${tono}`}>{formatearRD(valor)}</span>
    </div>
  );
}

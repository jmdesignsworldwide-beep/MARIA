"use client";

import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { FlujoData } from "@/lib/finanzas/tipos";
import { formatearRD } from "@/lib/format";
import { ContadorRD } from "@/components/finanzas/contador";
import { PeriodoSelector } from "@/components/finanzas/periodo-selector";

const ejeStyle = { fontSize: 11, fill: "var(--text-muted)" };

function TooltipMoneda({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-field border border-line bg-elevated px-3 py-2 text-xs shadow-elevated">
      {label && <p className="mb-1 font-medium text-fg">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 tabular-nums text-muted">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="text-fg">{formatearRD(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Comparativo({ actual, previo }: { actual: number; previo: number }) {
  if (previo === 0) {
    return <span className="text-xs text-muted">Sin mes anterior para comparar</span>;
  }
  const delta = ((actual - previo) / Math.abs(previo)) * 100;
  const sube = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        sube ? "text-success" : "text-danger"
      }`}
    >
      {sube ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {Math.abs(delta).toFixed(1)}% vs. anterior
    </span>
  );
}

export function FlujoVista({
  data,
  periodo,
  etiquetaPeriodo,
}: {
  data: FlujoData;
  periodo: string;
  etiquetaPeriodo: string;
}) {
  const quedoPositivo = data.quedo >= 0;
  const sinDatos = data.entro === 0 && data.salio === 0;

  const chartData = [
    {
      etapa: etiquetaPeriodo,
      Mercancía: data.salio_mercancia,
      Gastos: data.salio_gastos,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Facturaste{" "}
          <span className="font-semibold text-fg tabular-nums">{formatearRD(data.facturado)}</span>,
          pero lo que <strong>entró de verdad</strong> fue lo cobrado.
        </p>
        <PeriodoSelector actual={periodo} />
      </div>

      {sinDatos ? (
        <div className="rounded-card border border-line bg-surface px-6 py-16 text-center">
          <Wallet className="mx-auto mb-3 h-10 w-10 text-muted" />
          <p className="text-sm text-muted">
            No hay movimientos de dinero en este periodo todavía.
          </p>
        </div>
      ) : (
        <>
          {/* ENTRÓ → SALIÓ → QUEDÓ */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-card border border-success/30 bg-success-soft/40 p-5">
              <div className="flex items-center gap-2 text-success">
                <ArrowDownRight className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Entró</span>
              </div>
              <ContadorRD valor={data.entro} className="mt-2 block text-3xl font-semibold text-fg" />
              <div className="mt-1.5">
                <Comparativo actual={data.entro} previo={data.prev.entro} />
              </div>
              <p className="mt-1 text-xs text-muted">Cobros recibidos (dinero real).</p>
            </div>

            <div className="rounded-card border border-danger/30 bg-danger-soft/40 p-5">
              <div className="flex items-center gap-2 text-danger">
                <ArrowUpRight className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Salió</span>
              </div>
              <ContadorRD valor={data.salio} className="mt-2 block text-3xl font-semibold text-fg" />
              <div className="mt-1.5">
                <Comparativo actual={data.salio} previo={data.prev.salio} />
              </div>
              <p className="mt-1 text-xs text-muted">Mercancía + gastos del periodo.</p>
            </div>

            <div
              className={`rounded-card border p-5 ${
                quedoPositivo
                  ? "border-accent/40 bg-accent-soft/40"
                  : "border-danger/40 bg-danger-soft/50"
              }`}
            >
              <div className={`flex items-center gap-2 ${quedoPositivo ? "text-accent" : "text-danger"}`}>
                <Wallet className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Quedó</span>
              </div>
              <ContadorRD
                valor={data.quedo}
                className={`mt-2 block text-3xl font-semibold ${
                  quedoPositivo ? "text-fg" : "text-danger"
                }`}
              />
              <div className="mt-1.5">
                <Comparativo actual={data.quedo} previo={data.prev.quedo} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {quedoPositivo ? "Te sobró dinero este periodo." : "Salió más de lo que entró."}
              </p>
            </div>
          </div>

          {/* Barra apilada: en qué se fue el dinero */}
          <div className="rounded-card border border-line bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              ¿En qué se fue el dinero?
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={ejeStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="etapa" tick={ejeStyle} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<TooltipMoneda />} cursor={{ fill: "var(--bg-elevated)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Mercancía" stackId="s" fill="var(--accent)" radius={[6, 0, 0, 6]} />
                <Bar dataKey="Gastos" stackId="s" fill="#F87171" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mini-cards de comparación */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniCard titulo="Mercancía" valor={data.salio_mercancia} previo={data.prev.salio_mercancia} />
            <MiniCard titulo="Gastos operativos" valor={data.salio_gastos} previo={data.prev.salio_gastos} />
            <MiniCard titulo="Facturado (no cobrado)" valor={data.facturado} previo={null} />
          </div>
        </>
      )}
    </div>
  );
}

function MiniCard({
  titulo,
  valor,
  previo,
}: {
  titulo: string;
  valor: number;
  previo: number | null;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-xs text-muted">{titulo}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-fg">{formatearRD(valor)}</p>
      {previo !== null && (
        <p className="mt-0.5 text-xs text-muted tabular-nums">Antes: {formatearRD(previo)}</p>
      )}
    </div>
  );
}

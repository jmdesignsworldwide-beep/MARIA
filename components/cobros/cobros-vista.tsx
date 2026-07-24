"use client";

import Link from "next/link";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { formatearRD, formatearFecha } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegistrarCobroBoton } from "@/components/cobros/registrar-cobro-boton";

export type CuentaPorCobrar = {
  factura_id: string;
  numero: string;
  cliente_nombre: string;
  total: number;
  saldo: number;
  fecha_vencimiento: string | null;
  diasVencido: number; // >0 vencido, <=0 al día
  waHref: string;
};

export type Aging = {
  alDia: number;
  d1_15: number;
  d16_30: number;
  mas30: number;
};

export function CobrosVista({
  cuentas,
  aging,
  totalPorCobrar,
  totalVencido,
}: {
  cuentas: CuentaPorCobrar[];
  aging: Aging;
  totalPorCobrar: number;
  totalVencido: number;
}) {
  const buckets = [
    { label: "Al día", valor: aging.alDia, color: "var(--success)", tono: "text-success" },
    { label: "1–15 días", valor: aging.d1_15, color: "var(--warning)", tono: "text-warning" },
    { label: "16–30 días", valor: aging.d16_30, color: "#F59E0B", tono: "text-warning" },
    { label: "+30 días", valor: aging.mas30, color: "var(--danger)", tono: "text-danger" },
  ];
  const maxBucket = Math.max(1, ...buckets.map((b) => b.valor));

  return (
    <>
      <PageHeader
        title="Cobros y cuentas por cobrar"
        description="Da seguimiento a lo que te deben y cobra sin discusiones."
      />

      {cuentas.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="¡Todo cobrado!"
          description="No tienes facturas con saldo pendiente. Excelente."
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted">Total por cobrar</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-accent">
                {formatearRD(totalPorCobrar)}
              </p>
            </div>
            <div className="rounded-card border border-line bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted">Vencido</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-danger">
                {formatearRD(totalVencido)}
              </p>
            </div>
          </div>

          {/* Semáforo de antigüedad */}
          <div className="mb-6 rounded-card border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
              Antigüedad de saldos
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {buckets.map((b) => (
                <div key={b.label}>
                  <div className="flex h-24 items-end">
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${(b.valor / maxBucket) * 100}%`,
                        minHeight: b.valor > 0 ? 4 : 0,
                        background: b.color,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">{b.label}</p>
                  <p className={`text-sm font-semibold tabular-nums ${b.tono}`}>
                    {formatearRD(b.valor)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de cuentas por cobrar */}
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <ul className="divide-y divide-line-soft">
              {cuentas.map((c) => (
                <li key={c.factura_id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/facturas/${c.factura_id}`}
                        className="font-medium tabular-nums hover:text-accent"
                      >
                        {c.numero}
                      </Link>
                      {c.diasVencido > 0 ? (
                        <Badge variant="danger">{c.diasVencido} días vencido</Badge>
                      ) : (
                        <Badge variant="success">Al día</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {c.cliente_nombre}
                      {c.fecha_vencimiento ? ` · vence ${formatearFecha(c.fecha_vencimiento)}` : ""}
                    </p>
                  </div>
                  <div className="text-right sm:mr-2">
                    <p className="text-xs text-muted">Saldo</p>
                    <p className="font-semibold tabular-nums text-warning">{formatearRD(c.saldo)}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={c.waHref} target="_blank" rel="noopener noreferrer" className="inline-block">
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4" />
                        Recordar
                      </Button>
                    </a>
                    <RegistrarCobroBoton facturaId={c.factura_id} saldo={c.saldo} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, FileText, ChevronRight } from "lucide-react";
import type { EstadoCotizacion } from "@/lib/database.types";
import { formatearRD, formatearFecha } from "@/lib/format";
import { estadoCotizacionMeta } from "@/lib/estados";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type CotizacionRow = {
  id: string;
  numero: string;
  fecha: string;
  total: number;
  estado: EstadoCotizacion;
  cliente_nombre: string;
};

export function CotizacionesVista({ cotizaciones }: { cotizaciones: CotizacionRow[] }) {
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<EstadoCotizacion | "todos">("todos");

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cotizaciones.filter((c) => {
      if (estado !== "todos" && c.estado !== estado) return false;
      if (!q) return true;
      return (
        c.numero.toLowerCase().includes(q) ||
        c.cliente_nombre.toLowerCase().includes(q)
      );
    });
  }, [cotizaciones, query, estado]);

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        description="Crea, envía y da seguimiento a tus cotizaciones."
        action={
          <Link href="/cotizaciones/nueva" className="inline-block">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva cotización
            </Button>
          </Link>
        }
      />

      {cotizaciones.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aún no tienes cotizaciones"
          description="Crea tu primera cotización profesional y conviértela en factura con un clic."
          action={
            <Link href="/cotizaciones/nueva" className="inline-block">
              <Button>
                <Plus className="h-4 w-4" />
                Nueva cotización
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por número o cliente…"
                className="pl-10"
                aria-label="Buscar cotizaciones"
              />
            </div>
            <div className="w-full sm:w-52">
              <Select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoCotizacion | "todos")}
                aria-label="Filtrar por estado"
              >
                <option value="todos">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
                <option value="vencida">Vencida</option>
                <option value="convertida">Convertida</option>
              </Select>
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-surface/50 px-6 py-14 text-center text-sm text-muted">
              No se encontraron cotizaciones con esos criterios.
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              <ul className="divide-y divide-line-soft">
                {filtradas.map((c) => {
                  const meta = estadoCotizacionMeta[c.estado];
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/cotizaciones/${c.id}`}
                        className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-elevated/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium tabular-nums">{c.numero}</span>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </div>
                          <p className="mt-0.5 truncate text-sm text-muted">
                            {c.cliente_nombre} · {formatearFecha(c.fecha)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">{formatearRD(c.total)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 flex-none text-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}

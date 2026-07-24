"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, ReceiptText, ChevronRight } from "lucide-react";
import type { EstadoFactura } from "@/lib/database.types";
import { formatearRD, formatearFecha } from "@/lib/format";
import { estadoFacturaMeta } from "@/lib/estados";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type FacturaRow = {
  id: string;
  numero: string;
  fecha: string;
  total: number;
  saldo: number;
  estado: EstadoFactura;
  cliente_nombre: string;
};

export function FacturasVista({ facturas }: { facturas: FacturaRow[] }) {
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<EstadoFactura | "todos">("todos");

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facturas.filter((f) => {
      if (estado !== "todos" && f.estado !== estado) return false;
      if (!q) return true;
      return f.numero.toLowerCase().includes(q) || f.cliente_nombre.toLowerCase().includes(q);
    });
  }, [facturas, query, estado]);

  return (
    <>
      <PageHeader
        title="Facturas"
        description="Factura con costo por línea y controla tu margen real."
        action={
          <Link href="/facturas/nueva" className="inline-block">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva factura
            </Button>
          </Link>
        }
      />

      {facturas.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Aún no tienes facturas"
          description="Crea tu primera factura registrando el costo de cada línea para ver tu ganancia real."
          action={
            <Link href="/facturas/nueva" className="inline-block">
              <Button>
                <Plus className="h-4 w-4" />
                Nueva factura
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
                aria-label="Buscar facturas"
              />
            </div>
            <div className="w-full sm:w-52">
              <Select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoFactura | "todos")}
                aria-label="Filtrar por estado"
              >
                <option value="todos">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="emitida">Emitida</option>
                <option value="cobrada_parcial">Cobrada parcial</option>
                <option value="cobrada">Cobrada</option>
                <option value="vencida">Vencida</option>
                <option value="anulada">Anulada</option>
              </Select>
            </div>
          </div>

          {filtradas.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-surface/50 px-6 py-14 text-center text-sm text-muted">
              No se encontraron facturas con esos criterios.
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-line bg-surface">
              <ul className="divide-y divide-line-soft">
                {filtradas.map((f) => {
                  const meta = estadoFacturaMeta[f.estado];
                  return (
                    <li key={f.id}>
                      <Link
                        href={`/facturas/${f.id}`}
                        className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-elevated/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium tabular-nums">{f.numero}</span>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </div>
                          <p className="mt-0.5 truncate text-sm text-muted">
                            {f.cliente_nombre} · {formatearFecha(f.fecha)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">{formatearRD(f.total)}</p>
                          {f.saldo > 0 && f.estado !== "anulada" && (
                            <p className="text-xs text-warning tabular-nums">
                              Saldo {formatearRD(f.saldo)}
                            </p>
                          )}
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

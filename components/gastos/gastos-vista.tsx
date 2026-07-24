"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Tag,
  Wallet,
  TrendingUp,
  TrendingDown,
  Paperclip,
  Copy,
  Trash2,
  Repeat,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { CategoriaGasto, MetodoPago } from "@/lib/database.types";
import { formatearRD, formatearFecha } from "@/lib/format";
import { eliminarGasto, duplicarGasto, urlFirmadaComprobante } from "@/lib/actions/gastos";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GastoForm } from "@/components/gastos/gasto-form";
import { CategoriasManager } from "@/components/gastos/categorias-manager";

export type GastoRow = {
  id: string;
  descripcion: string;
  categoria_nombre: string | null;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago;
  es_recurrente: boolean;
  comprobante_path: string | null;
};

export function GastosVista({
  ownerId,
  categorias,
  gastos,
  totalMes,
  totalMesAnterior,
  porCategoria,
  nombreMes,
}: {
  ownerId: string;
  categorias: CategoriaGasto[];
  gastos: GastoRow[];
  totalMes: number;
  totalMesAnterior: number;
  porCategoria: { nombre: string; total: number }[];
  nombreMes: string;
}) {
  const router = useRouter();
  const [gastoOpen, setGastoOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [aEliminar, setAEliminar] = useState<GastoRow | null>(null);

  const delta = totalMesAnterior > 0 ? ((totalMes - totalMesAnterior) / totalMesAnterior) * 100 : null;
  const maxCat = Math.max(1, ...porCategoria.map((c) => c.total));

  async function verComprobante(path: string) {
    const url = await urlFirmadaComprobante(path);
    if (!url) return toast.error("No se pudo abrir el comprobante.");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function duplicar(id: string) {
    const res = await duplicarGasto(id);
    if (!res.ok) return toast.error(res.error ?? "No se pudo duplicar.");
    toast.success("Gasto duplicado a hoy.");
    router.refresh();
  }

  async function eliminar() {
    if (!aEliminar) return;
    const res = await eliminarGasto(aEliminar.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setAEliminar(null);
      return;
    }
    toast.success("Gasto eliminado.");
    setAEliminar(null);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Gastos del negocio"
        description="Registra los gastos operativos y compáralos mes a mes."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCatOpen(true)}>
              <Tag className="h-4 w-4" />
              Categorías
            </Button>
            <Button onClick={() => setGastoOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuevo gasto
            </Button>
          </div>
        }
      />

      {/* KPI del mes + comparativo */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5 lg:col-span-1">
          <p className="text-xs uppercase tracking-wide text-muted">Gastos de {nombreMes}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatearRD(totalMes)}</p>
          {delta !== null && (
            <p
              className={`mt-2 flex items-center gap-1 text-xs ${
                delta > 0 ? "text-danger" : "text-success"
              }`}
            >
              {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(delta).toFixed(1)}% vs. mes anterior ({formatearRD(totalMesAnterior)})
            </p>
          )}
        </div>

        {/* Por categoría */}
        <div className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Por categoría este mes
          </h2>
          {porCategoria.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">Sin gastos este mes.</p>
          ) : (
            <div className="space-y-2">
              {porCategoria.map((c) => (
                <div key={c.nombre}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{c.nombre}</span>
                    <span className="tabular-nums text-muted">{formatearRD(c.total)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(c.total / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista */}
      {gastos.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin gastos este mes"
          description="Registra tus gastos operativos para llevar el control de tu dinero."
          action={
            <Button onClick={() => setGastoOpen(true)}>
              <Plus className="h-4 w-4" />
              Registrar gasto
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line-soft">
            {gastos.map((g) => (
              <li key={g.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{g.descripcion}</span>
                    {g.es_recurrente && (
                      <Badge variant="info">
                        <Repeat className="h-3 w-3" />
                        Recurrente
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {g.categoria_nombre ?? "Sin categoría"} · {formatearFecha(g.fecha)} ·{" "}
                    <span className="capitalize">{g.metodo_pago}</span>
                  </p>
                </div>
                {g.comprobante_path && (
                  <button
                    type="button"
                    onClick={() => verComprobante(g.comprobante_path!)}
                    className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
                <span className="font-semibold tabular-nums">{formatearRD(g.monto)}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => duplicar(g.id)}
                    aria-label="Duplicar a hoy"
                    title="Duplicar a hoy"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-fg"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAEliminar(g)}
                    aria-label="Eliminar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={gastoOpen}
        onClose={() => setGastoOpen(false)}
        title="Nuevo gasto"
        description="Registra un gasto operativo del negocio."
        size="lg"
      >
        <GastoForm
          ownerId={ownerId}
          categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
          onCancel={() => setGastoOpen(false)}
          onDone={() => {
            setGastoOpen(false);
            router.refresh();
          }}
        />
      </Modal>

      <CategoriasManager open={catOpen} onClose={() => setCatOpen(false)} categorias={categorias} />

      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={eliminar}
        title="Eliminar gasto"
        description="Se eliminará el gasto y su comprobante. Esta acción no se puede deshacer."
      />
    </>
  );
}

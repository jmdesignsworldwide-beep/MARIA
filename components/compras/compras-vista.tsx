"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Truck,
  ShoppingCart,
  AlertTriangle,
  Paperclip,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { Suplidor, MetodoPago } from "@/lib/database.types";
import { formatearRD, formatearFecha } from "@/lib/format";
import { eliminarCompra, urlFirmadaRecibo } from "@/lib/actions/compras";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CompraForm } from "@/components/compras/compra-form";
import { SuplidoresManager } from "@/components/suplidores/suplidores-manager";

export type CompraRow = {
  id: string;
  suplidor_nombre: string;
  factura_id: string | null;
  factura_numero: string | null;
  descripcion: string | null;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago;
  numero_comprobante: string | null;
  recibo_path: string | null;
};

export function ComprasVista({
  ownerId,
  compras,
  suplidores,
  facturasOpciones,
  resumenMensual,
  alertas,
}: {
  ownerId: string;
  compras: CompraRow[];
  suplidores: Suplidor[];
  facturasOpciones: { id: string; numero: string }[];
  resumenMensual: { nombre: string; total: number }[];
  alertas: { id: string; numero: string }[];
}) {
  const router = useRouter();
  const [compraOpen, setCompraOpen] = useState(false);
  const [suplidoresOpen, setSuplidoresOpen] = useState(false);
  const [aEliminar, setAEliminar] = useState<CompraRow | null>(null);

  async function verRecibo(path: string) {
    const url = await urlFirmadaRecibo(path);
    if (!url) {
      toast.error("No se pudo abrir el recibo.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function eliminar() {
    if (!aEliminar) return;
    const res = await eliminarCompra(aEliminar.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setAEliminar(null);
      return;
    }
    toast.success("Compra eliminada.");
    setAEliminar(null);
    router.refresh();
  }

  const totalMes = resumenMensual.reduce((a, r) => a + r.total, 0);

  return (
    <>
      <PageHeader
        title="Compras y suplidores"
        description="Registra cuánto te costó cada operación para conocer tu ganancia real."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSuplidoresOpen(true)}>
              <Truck className="h-4 w-4" />
              Suplidores
            </Button>
            <Button onClick={() => setCompraOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva compra
            </Button>
          </div>
        }
      />

      {/* Alerta de facturas sin costo */}
      {alertas.length > 0 && (
        <div className="mb-6 rounded-card border border-warning/40 bg-warning-soft/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-warning" />
            <div>
              <p className="text-sm font-medium text-warning">
                {alertas.length} factura{alertas.length > 1 ? "s" : ""} emitida
                {alertas.length > 1 ? "s" : ""} sin costo registrado
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Sin el costo no se puede saber la ganancia real. Registra la compra o edita la
                factura:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alertas.map((a) => (
                  <Link
                    key={a.id}
                    href={`/facturas/${a.id}`}
                    className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning hover:underline"
                  >
                    {a.numero}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen mensual por suplidor */}
      {resumenMensual.length > 0 && (
        <div className="mb-6 rounded-card border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Le compré este mes
            </h2>
            <span className="text-sm font-semibold tabular-nums text-accent">
              {formatearRD(totalMes)}
            </span>
          </div>
          <div className="space-y-2">
            {resumenMensual.map((r) => {
              const pct = totalMes > 0 ? (r.total / totalMes) * 100 : 0;
              return (
                <div key={r.nombre}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{r.nombre}</span>
                    <span className="tabular-nums text-muted">{formatearRD(r.total)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de compras */}
      {compras.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aún no has registrado compras"
          description="Registra lo que le compras a tus suplidores para cada operación."
          action={
            <Button onClick={() => setCompraOpen(true)}>
              <Plus className="h-4 w-4" />
              Registrar compra
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line-soft">
            {compras.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.suplidor_nombre}</span>
                    {c.factura_numero && c.factura_id && (
                      <Link
                        href={`/facturas/${c.factura_id}`}
                        className="rounded-full bg-elevated px-2 py-0.5 text-xs text-muted hover:text-accent"
                      >
                        {c.factura_numero}
                      </Link>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {formatearFecha(c.fecha)} · <span className="capitalize">{c.metodo_pago}</span>
                    {c.descripcion ? ` · ${c.descripcion}` : ""}
                  </p>
                </div>
                {c.recibo_path && (
                  <button
                    type="button"
                    onClick={() => verRecibo(c.recibo_path!)}
                    className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Recibo
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
                <span className="font-semibold tabular-nums">{formatearRD(c.monto)}</span>
                <button
                  type="button"
                  onClick={() => setAEliminar(c)}
                  aria-label="Eliminar compra"
                  className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={compraOpen}
        onClose={() => setCompraOpen(false)}
        title="Nueva compra"
        description="Registra una compra a un suplidor."
        size="lg"
      >
        <CompraForm
          ownerId={ownerId}
          suplidores={suplidores.filter((s) => s.activo).map((s) => ({ id: s.id, nombre: s.nombre }))}
          facturas={facturasOpciones}
          onCancel={() => setCompraOpen(false)}
          onDone={() => {
            setCompraOpen(false);
            router.refresh();
          }}
        />
      </Modal>

      <SuplidoresManager
        open={suplidoresOpen}
        onClose={() => setSuplidoresOpen(false)}
        suplidores={suplidores}
      />

      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={eliminar}
        title="Eliminar compra"
        description="Se eliminará la compra y su recibo. Esta acción no se puede deshacer."
      />
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, Package, Wrench, Boxes } from "lucide-react";
import { toast } from "sonner";
import type { CatalogoItem } from "@/lib/database.types";
import { formatearRD } from "@/lib/format";
import { eliminarItem } from "@/lib/actions/catalogo";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ItemForm } from "@/components/catalogo/item-form";

type Filtro = "todos" | "producto" | "servicio";

export function CatalogoVista({ items }: { items: CatalogoItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<CatalogoItem | null>(null);
  const [aEliminar, setAEliminar] = useState<CatalogoItem | null>(null);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (filtro !== "todos" && it.tipo !== filtro) return false;
      if (!q) return true;
      return it.descripcion.toLowerCase().includes(q);
    });
  }, [items, query, filtro]);

  function nuevo() {
    setEditando(null);
    setModalOpen(true);
  }
  function editar(it: CatalogoItem) {
    setEditando(it);
    setModalOpen(true);
  }
  function cerrar() {
    setModalOpen(false);
    setEditando(null);
  }
  function trasGuardar() {
    cerrar();
    router.refresh();
  }
  async function confirmarEliminar() {
    if (!aEliminar) return;
    const res = await eliminarItem(aEliminar.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setAEliminar(null);
      return;
    }
    toast.success("Item eliminado.");
    setAEliminar(null);
    router.refresh();
  }

  const filtros: { key: Filtro; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "producto", label: "Productos" },
    { key: "servicio", label: "Servicios" },
  ];

  return (
    <>
      <PageHeader
        title="Catálogo"
        description="Productos y servicios recurrentes con precio y costo."
        action={
          <Button onClick={nuevo}>
            <Plus className="h-4 w-4" />
            Nuevo item
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Tu catálogo está vacío"
          description="Agrega productos y servicios para no reescribirlos en cada cotización o factura."
          action={
            <Button onClick={nuevo}>
              <Plus className="h-4 w-4" />
              Agregar item
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto o servicio…"
                className="pl-10"
                aria-label="Buscar en el catálogo"
              />
            </div>
            <div className="inline-flex rounded-field border border-line bg-elevated p-0.5">
              {filtros.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtro === f.key
                      ? "bg-accent text-accent-contrast"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-surface/50 px-6 py-14 text-center text-sm text-muted">
              No se encontraron items con esos criterios.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtrados.map((it) => {
                const margen = Number(it.precio_sugerido) - Number(it.costo_referencial);
                const margenPct =
                  Number(it.precio_sugerido) > 0
                    ? (margen / Number(it.precio_sugerido)) * 100
                    : 0;
                return (
                  <div
                    key={it.id}
                    className="flex flex-col rounded-card border border-line bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-field bg-elevated ring-1 ring-line">
                          {it.tipo === "producto" ? (
                            <Package className="h-4 w-4 text-muted" />
                          ) : (
                            <Wrench className="h-4 w-4 text-muted" />
                          )}
                        </span>
                        <div>
                          <Badge variant={it.tipo === "producto" ? "info" : "accent"}>
                            {it.tipo === "producto" ? "Producto" : "Servicio"}
                          </Badge>
                        </div>
                      </div>
                      {!it.activo && <Badge variant="neutral">Inactivo</Badge>}
                    </div>

                    <p className="mt-3 line-clamp-2 min-h-[2.5rem] font-medium">
                      {it.descripcion}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line-soft pt-3 text-sm">
                      <div>
                        <p className="text-xs text-muted">Precio</p>
                        <p className="tabular-nums">{formatearRD(it.precio_sugerido)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Costo</p>
                        <p className="tabular-nums text-muted">
                          {formatearRD(it.costo_referencial)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted">
                        Margen{" "}
                        <span
                          className={`font-medium tabular-nums ${
                            margen > 0 ? "text-success" : margen < 0 ? "text-danger" : "text-muted"
                          }`}
                        >
                          {margenPct.toFixed(0)}%
                        </span>
                      </span>
                      <span className="text-xs text-muted">/ {it.unidad}</span>
                    </div>

                    <div className="mt-3 flex justify-end gap-1 border-t border-line-soft pt-3">
                      <button
                        type="button"
                        onClick={() => editar(it)}
                        aria-label="Editar"
                        title="Editar"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-fg"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAEliminar(it)}
                        aria-label="Eliminar"
                        title="Eliminar"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={cerrar}
        title={editando ? "Editar item" : "Nuevo item"}
        description={editando ? undefined : "Agrega un producto o servicio al catálogo."}
        size="lg"
      >
        <ItemForm
          key={editando?.id ?? "nuevo"}
          item={editando ?? undefined}
          onDone={trasGuardar}
          onCancel={cerrar}
        />
      </Modal>

      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar item"
        description={`¿Seguro que deseas eliminar "${aEliminar?.descripcion}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}

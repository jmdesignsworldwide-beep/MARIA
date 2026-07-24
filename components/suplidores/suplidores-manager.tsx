"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import type { Suplidor } from "@/lib/database.types";
import { eliminarSuplidor } from "@/lib/actions/suplidores";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SuplidorForm } from "@/components/suplidores/suplidor-form";

export function SuplidoresManager({
  open,
  onClose,
  suplidores,
}: {
  open: boolean;
  onClose: () => void;
  suplidores: Suplidor[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Suplidor | null>(null);
  const [aEliminar, setAEliminar] = useState<Suplidor | null>(null);

  async function eliminar() {
    if (!aEliminar) return;
    const res = await eliminarSuplidor(aEliminar.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setAEliminar(null);
      return;
    }
    toast.success("Suplidor eliminado.");
    setAEliminar(null);
    router.refresh();
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Suplidores" description="Dónde compras tus productos." size="lg">
        <div className="mb-4 flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditando(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo suplidor
          </Button>
        </div>

        {suplidores.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Truck className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">Aún no tienes suplidores.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {suplidores.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-field border border-line bg-elevated/50 px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{s.nombre}</p>
                    {!s.activo && <Badge variant="neutral">Inactivo</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted">
                    {[s.contacto, s.telefono].filter(Boolean).join(" · ") || "Sin contacto"}
                  </p>
                </div>
                <div className="flex flex-none gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(s);
                      setFormOpen(true);
                    }}
                    aria-label="Editar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-surface hover:text-fg"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAEliminar(s)}
                    aria-label="Eliminar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-surface hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editando ? "Editar suplidor" : "Nuevo suplidor"}
        size="lg"
      >
        <SuplidorForm
          key={editando?.id ?? "nuevo"}
          suplidor={editando ?? undefined}
          onDone={() => {
            setFormOpen(false);
            router.refresh();
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={eliminar}
        title="Eliminar suplidor"
        description={`¿Eliminar a "${aEliminar?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}

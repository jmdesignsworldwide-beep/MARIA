"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import type { CategoriaGasto } from "@/lib/database.types";
import { crearCategoria, eliminarCategoria } from "@/lib/actions/gastos";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function CategoriasManager({
  open,
  onClose,
  categorias,
}: {
  open: boolean;
  onClose: () => void;
  categorias: CategoriaGasto[];
}) {
  const router = useRouter();
  const [nueva, setNueva] = useState("");
  const [creando, setCreando] = useState(false);
  const [aEliminar, setAEliminar] = useState<CategoriaGasto | null>(null);

  async function crear() {
    const nombre = nueva.trim();
    if (nombre.length < 2) return;
    setCreando(true);
    const res = await crearCategoria({ nombre });
    setCreando(false);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo crear.");
      return;
    }
    setNueva("");
    toast.success("Categoría creada.");
    router.refresh();
  }

  async function eliminar() {
    if (!aEliminar) return;
    const res = await eliminarCategoria(aEliminar.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setAEliminar(null);
      return;
    }
    toast.success("Categoría eliminada.");
    setAEliminar(null);
    router.refresh();
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Categorías de gasto">
        <div className="mb-4 flex gap-2">
          <Input
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="Nueva categoría…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                crear();
              }
            }}
          />
          <Button type="button" onClick={crear} loading={creando}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>

        {categorias.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Tag className="h-7 w-7 text-muted" />
            <p className="text-sm text-muted">Aún no tienes categorías.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {categorias.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-field border border-line bg-elevated/50 px-3.5 py-2"
              >
                <span className="text-sm">{c.nombre}</span>
                <button
                  type="button"
                  onClick={() => setAEliminar(c)}
                  aria-label="Eliminar categoría"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-field text-muted transition-colors hover:bg-surface hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={!!aEliminar}
        onClose={() => setAEliminar(null)}
        onConfirm={eliminar}
        title="Eliminar categoría"
        description={`¿Eliminar "${aEliminar?.nombre}"? Los gastos con esta categoría quedarán sin categoría.`}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Cliente } from "@/lib/database.types";
import { eliminarCliente } from "@/lib/actions/clientes";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClienteForm } from "@/components/clientes/cliente-form";

export function ClienteFichaAcciones({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [editar, setEditar] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  async function eliminar() {
    const res = await eliminarCliente(cliente.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setConfirmar(false);
      return;
    }
    toast.success("Cliente eliminado.");
    router.push("/clientes");
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditar(true)}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirmar(true)}>
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </div>

      <Modal
        open={editar}
        onClose={() => setEditar(false)}
        title="Editar cliente"
        size="lg"
      >
        <ClienteForm
          cliente={cliente}
          onDone={() => {
            setEditar(false);
            router.refresh();
          }}
          onCancel={() => setEditar(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={eliminar}
        title="Eliminar cliente"
        description={`¿Seguro que deseas eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Send, Ban, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { EstadoFactura } from "@/lib/database.types";
import { emitirFactura, anularFactura, eliminarFactura } from "@/lib/actions/facturas";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RegistrarCobroBoton } from "@/components/cobros/registrar-cobro-boton";

export function FacturaAcciones({
  id,
  estado,
  saldo,
  waHref,
}: {
  id: string;
  estado: EstadoFactura;
  saldo: number;
  waHref: string;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [confirmarEmitir, setConfirmarEmitir] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoError, setMotivoError] = useState<string | null>(null);

  const esBorrador = estado === "borrador";
  const anulable = ["emitida", "cobrada_parcial", "vencida"].includes(estado);
  const cobrable = anulable && saldo > 0;

  async function emitir() {
    setCargando("emitir");
    const res = await emitirFactura(id);
    setCargando(null);
    setConfirmarEmitir(false);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo emitir.");
      return;
    }
    toast.success("Factura emitida.");
    router.refresh();
  }

  async function anular() {
    if (motivo.trim().length < 5) {
      setMotivoError("Explica el motivo (mínimo 5 caracteres).");
      return;
    }
    setCargando("anular");
    const res = await anularFactura(id, { motivo });
    setCargando(null);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo anular.");
      return;
    }
    setAnularOpen(false);
    toast.success("Factura anulada.");
    router.refresh();
  }

  async function eliminar() {
    const res = await eliminarFactura(id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setConfirmarEliminar(false);
      return;
    }
    toast.success("Factura eliminada.");
    router.push("/facturas");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {esBorrador && (
          <Button size="sm" onClick={() => setConfirmarEmitir(true)} loading={cargando === "emitir"}>
            <Send className="h-4 w-4" />
            Emitir factura
          </Button>
        )}

        {cobrable && <RegistrarCobroBoton facturaId={id} saldo={saldo} />}

        {estado !== "anulada" && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-block">
            <Button size="sm" variant="secondary">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </a>
        )}

        {esBorrador && (
          <Link href={`/facturas/${id}/editar`} className="inline-block">
            <Button size="sm" variant="outline">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        )}

        {anulable && (
          <Button size="sm" variant="outline" onClick={() => setAnularOpen(true)}>
            <Ban className="h-4 w-4" />
            Anular
          </Button>
        )}

        {esBorrador && (
          <Button size="sm" variant="ghost" onClick={() => setConfirmarEliminar(true)}>
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmarEmitir}
        onClose={() => setConfirmarEmitir(false)}
        onConfirm={emitir}
        title="Emitir factura"
        description="Una vez emitida, la factura no se podrá editar (solo anular). ¿Continuar?"
        confirmLabel="Emitir"
      />

      <ConfirmDialog
        open={confirmarEliminar}
        onClose={() => setConfirmarEliminar(false)}
        onConfirm={eliminar}
        title="Eliminar factura"
        description="Esta acción no se puede deshacer."
      />

      <Modal open={anularOpen} onClose={() => setAnularOpen(false)} title="Anular factura">
        <div className="space-y-3">
          <p className="text-sm text-muted">
            La anulación queda registrada en la bitácora con su motivo. Esta acción no se
            puede deshacer.
          </p>
          <div>
            <Label htmlFor="motivo" className="mb-1.5 block">
              Motivo de la anulación
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setMotivoError(null);
              }}
              placeholder="Ej.: El cliente canceló el pedido."
              autoFocus
            />
            {motivoError && <p className="mt-1 text-xs text-danger">{motivoError}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={() => setAnularOpen(false)} disabled={cargando === "anular"}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={anular} loading={cargando === "anular"}>
              Anular factura
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

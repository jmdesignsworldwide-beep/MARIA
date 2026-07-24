"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Copy,
  Send,
  Check,
  X,
  ReceiptText,
  MessageCircle,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { EstadoCotizacion } from "@/lib/database.types";
import {
  cambiarEstadoCotizacion,
  duplicarCotizacion,
  convertirAFactura,
  eliminarCotizacion,
} from "@/lib/actions/cotizaciones";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function CotizacionAcciones({
  id,
  estado,
  waHref,
}: {
  id: string;
  estado: EstadoCotizacion;
  waHref: string;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [confirmarConvertir, setConfirmarConvertir] = useState(false);

  const convertida = estado === "convertida";

  async function cambiar(nuevo: EstadoCotizacion) {
    setCargando(nuevo);
    const res = await cambiarEstadoCotizacion(id, nuevo);
    setCargando(null);
    if (!res.ok) return toast.error(res.error ?? "No se pudo cambiar el estado.");
    toast.success("Estado actualizado.");
    router.refresh();
  }

  async function duplicar() {
    setCargando("dup");
    const res = await duplicarCotizacion(id);
    setCargando(null);
    if (!res.ok || !res.id) return toast.error(res.error ?? "No se pudo duplicar.");
    toast.success("Cotización duplicada.");
    router.push(`/cotizaciones/${res.id}/editar`);
  }

  async function convertir() {
    setCargando("conv");
    const res = await convertirAFactura(id);
    setCargando(null);
    setConfirmarConvertir(false);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo convertir.");
      return;
    }
    toast.success("Cotización convertida a factura (borrador).");
    router.refresh();
  }

  async function eliminar() {
    const res = await eliminarCotizacion(id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar.");
      setConfirmarEliminar(false);
      return;
    }
    toast.success("Cotización eliminada.");
    router.push("/cotizaciones");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Transiciones de estado según el estado actual */}
        {estado === "borrador" && (
          <Button size="sm" onClick={() => cambiar("enviada")} loading={cargando === "enviada"}>
            <Send className="h-4 w-4" />
            Marcar enviada
          </Button>
        )}
        {estado === "enviada" && (
          <>
            <Button size="sm" onClick={() => cambiar("aprobada")} loading={cargando === "aprobada"}>
              <Check className="h-4 w-4" />
              Aprobada
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cambiar("rechazada")}
              loading={cargando === "rechazada"}
            >
              <X className="h-4 w-4" />
              Rechazada
            </Button>
          </>
        )}
        {(estado === "rechazada" || estado === "vencida") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => cambiar("borrador")}
            loading={cargando === "borrador"}
          >
            <RotateCcw className="h-4 w-4" />
            Volver a borrador
          </Button>
        )}

        {!convertida && (estado === "aprobada" || estado === "enviada") && (
          <Button
            size="sm"
            onClick={() => setConfirmarConvertir(true)}
            loading={cargando === "conv"}
          >
            <ReceiptText className="h-4 w-4" />
            Convertir a factura
          </Button>
        )}

        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-block">
          <Button size="sm" variant="secondary">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </a>

        {!convertida && (
          <Link href={`/cotizaciones/${id}/editar`} className="inline-block">
            <Button size="sm" variant="outline">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        )}

        <Button size="sm" variant="ghost" onClick={duplicar} loading={cargando === "dup"}>
          <Copy className="h-4 w-4" />
          Duplicar
        </Button>

        <Button size="sm" variant="ghost" onClick={() => setConfirmarEliminar(true)}>
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmarConvertir}
        onClose={() => setConfirmarConvertir(false)}
        onConfirm={convertir}
        title="Convertir a factura"
        description="Se creará una factura en borrador con estas líneas, enlazada a esta cotización. Luego podrás registrar los costos y emitirla."
        confirmLabel="Convertir"
      />
      <ConfirmDialog
        open={confirmarEliminar}
        onClose={() => setConfirmarEliminar(false)}
        onConfirm={eliminar}
        title="Eliminar cotización"
        description="Esta acción no se puede deshacer."
      />
    </>
  );
}

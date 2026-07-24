"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/** Confirmación de acción destructiva (Regla innegociable #6). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Eliminar",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  const [working, setWorking] = useState(false);
  const busy = working || loading;

  async function handle() {
    setWorking(true);
    try {
      await onConfirm();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title}>
      <div className="flex gap-4">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="h-5 w-5 text-danger" aria-hidden />
        </div>
        <p className="pt-1.5 text-sm text-muted">{description}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handle} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

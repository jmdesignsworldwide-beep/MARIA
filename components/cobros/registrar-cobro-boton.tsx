"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PagoForm } from "@/components/cobros/pago-form";

/** Botón reutilizable para registrar un cobro sobre una factura. */
export function RegistrarCobroBoton({
  facturaId,
  saldo,
  variant = "primary",
  size = "sm",
  label = "Registrar cobro",
}: {
  facturaId: string;
  saldo: number;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md";
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <HandCoins className="h-4 w-4" />
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar cobro">
        <PagoForm
          facturaId={facturaId}
          saldo={saldo}
          onCancel={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}

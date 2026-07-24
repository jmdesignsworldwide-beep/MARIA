"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Límite de error del área autenticada: falla con gracia, no en blanco. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción esto puede enviarse a un servicio de monitoreo.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft">
        <AlertTriangle className="h-7 w-7 text-danger" aria-hidden />
      </div>
      <h2 className="mt-6 font-display text-xl font-semibold">Algo salió mal</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Ocurrió un error inesperado. Puedes intentarlo de nuevo; si persiste,
        recarga la página.
      </p>
      <Button className="mt-6" variant="secondary" onClick={() => reset()}>
        <RotateCcw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}

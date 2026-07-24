"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { PdfProps } from "@/components/pdf/pdf-descargar";

// @react-pdf solo en el navegador (evita SSR).
const PdfDescargar = dynamic(() => import("@/components/pdf/pdf-descargar"), {
  ssr: false,
  loading: () => (
    <Button size="sm" disabled>
      <Loader2 className="h-4 w-4 animate-spin" />
      PDF…
    </Button>
  ),
});
const PdfVisor = dynamic(() => import("@/components/pdf/pdf-visor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[72vh] items-center justify-center text-sm text-muted">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Cargando vista previa…
    </div>
  ),
});

export function PdfAcciones(props: PdfProps & { previewTitle?: string }) {
  const [preview, setPreview] = useState(false);
  const { previewTitle, ...pdf } = props;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPreview(true)}>
          <Eye className="h-4 w-4" />
          Vista previa
        </Button>
        <PdfDescargar {...pdf} />
      </div>

      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title={previewTitle ?? "Vista previa del PDF"}
        size="lg"
      >
        {preview && <PdfVisor {...pdf} />}
      </Modal>
    </>
  );
}

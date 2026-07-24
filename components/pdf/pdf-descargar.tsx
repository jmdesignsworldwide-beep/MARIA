"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import {
  DocumentoComercialDoc,
  EstadoCuentaDoc,
} from "@/components/pdf/documentos-pdf";
import type {
  EmpresaPDF,
  ClientePDF,
  DocumentoComercialPDF,
  EstadoCuentaPDF,
} from "@/lib/pdf/tipos";
import { buttonVariants } from "@/components/ui/button-variants";

export type PdfProps = {
  kind: "comercial" | "estado_cuenta";
  empresa: EmpresaPDF;
  cliente: ClientePDF | null;
  doc?: DocumentoComercialPDF;
  data?: EstadoCuentaPDF;
  fileName: string;
};

export function construirDocumento(p: PdfProps) {
  if (p.kind === "estado_cuenta" && p.data && p.cliente) {
    return <EstadoCuentaDoc empresa={p.empresa} cliente={p.cliente} data={p.data} />;
  }
  return (
    <DocumentoComercialDoc
      empresa={p.empresa}
      cliente={p.cliente}
      doc={p.doc as DocumentoComercialPDF}
    />
  );
}

export default function PdfDescargar(p: PdfProps) {
  return (
    <PDFDownloadLink
      document={construirDocumento(p)}
      fileName={p.fileName}
      className={buttonVariants({ variant: "primary", size: "sm" })}
    >
      {({ loading }) =>
        loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Descargar PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}

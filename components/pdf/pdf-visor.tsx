"use client";

import { PDFViewer } from "@react-pdf/renderer";
import {
  construirDocumento,
  type PdfProps,
} from "@/components/pdf/pdf-descargar";

export default function PdfVisor(p: PdfProps) {
  return (
    <PDFViewer
      showToolbar
      style={{
        width: "100%",
        height: "72vh",
        border: "none",
        borderRadius: 8,
      }}
    >
      {construirDocumento(p)}
    </PDFViewer>
  );
}

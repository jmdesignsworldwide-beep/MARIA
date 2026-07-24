"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileDown, Loader2 } from "lucide-react";
import {
  ReporteDoc,
  type EstadoResultados,
  type Movimiento,
} from "@/components/reportes/reporte-doc";
import type { EmpresaPDF } from "@/lib/pdf/tipos";
import { buttonVariants } from "@/components/ui/button-variants";

export default function ReporteDescargar({
  empresa,
  periodo,
  estado,
  movimientos,
  fileName,
}: {
  empresa: EmpresaPDF;
  periodo: string;
  estado: EstadoResultados;
  movimientos: Movimiento[];
  fileName: string;
}) {
  return (
    <PDFDownloadLink
      document={
        <ReporteDoc empresa={empresa} periodo={periodo} estado={estado} movimientos={movimientos} />
      }
      fileName={fileName}
      className={buttonVariants({ variant: "secondary", size: "sm" })}
    >
      {({ loading }) =>
        loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> PDF…
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" /> Exportar PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}

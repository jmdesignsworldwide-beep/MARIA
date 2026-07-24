"use client";

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatearRD, formatearFecha } from "@/lib/format";
import type { EmpresaPDF } from "@/lib/pdf/tipos";

export type EstadoResultados = {
  ingresos: number;
  costos: number;
  utilidadBruta: number;
  gastos: number;
  utilidadNeta: number;
};

export type Movimiento = {
  fecha: string;
  tipo: "entrada" | "salida";
  concepto: string;
  monto: number;
};

const c = {
  ink: "#101828", muted: "#667085", line: "#E4E7EC", amber: "#B87817",
  success: "#067647", danger: "#B42318", surface: "#FAFAF8",
};

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: c.ink },
  titulo: { fontSize: 18, fontFamily: "Helvetica-Bold", color: c.amber },
  empresa: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 2 },
  meta: { fontSize: 8.5, color: c.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: c.line, marginVertical: 14 },
  seccion: { fontSize: 8, color: c.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  fila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderColor: c.line },
  filaFuerte: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTopWidth: 1, borderColor: c.ink },
  label: { color: c.ink },
  labelFuerte: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  th: { flexDirection: "row", backgroundColor: c.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 6, paddingHorizontal: 6, marginTop: 4 },
  thCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: c.muted, textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: "#F2F4F7" },
  cFecha: { width: 70 }, cConcepto: { flex: 1 }, cTipo: { width: 60 }, cMonto: { width: 90, textAlign: "right" },
});

export function ReporteDoc({
  empresa,
  periodo,
  estado,
  movimientos,
}: {
  empresa: EmpresaPDF;
  periodo: string;
  estado: EstadoResultados;
  movimientos: Movimiento[];
}) {
  return (
    <Document title={`Reporte ${periodo}`} author={empresa.nombre}>
      <Page size="A4" style={s.page}>
        <Text style={s.titulo}>REPORTE FINANCIERO</Text>
        <Text style={s.empresa}>{empresa.nombre}</Text>
        <Text style={s.meta}>Período: {periodo}</Text>

        <View style={s.divider} />

        <Text style={s.seccion}>Estado de resultados</Text>
        <View style={s.fila}><Text style={s.label}>Ingresos (facturado)</Text><Text>{formatearRD(estado.ingresos)}</Text></View>
        <View style={s.fila}><Text style={s.label}>Costos de venta</Text><Text>- {formatearRD(estado.costos)}</Text></View>
        <View style={s.fila}><Text style={{ color: c.muted }}>Utilidad bruta</Text><Text style={{ color: c.success }}>{formatearRD(estado.utilidadBruta)}</Text></View>
        <View style={s.fila}><Text style={s.label}>Gastos operativos</Text><Text>- {formatearRD(estado.gastos)}</Text></View>
        <View style={s.filaFuerte}>
          <Text style={s.labelFuerte}>Utilidad neta</Text>
          <Text style={[s.labelFuerte, { color: estado.utilidadNeta >= 0 ? c.success : c.danger }]}>{formatearRD(estado.utilidadNeta)}</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={s.seccion}>Libro de movimientos</Text>
          <View style={s.th}>
            <Text style={[s.thCell, s.cFecha]}>Fecha</Text>
            <Text style={[s.thCell, s.cConcepto]}>Concepto</Text>
            <Text style={[s.thCell, s.cTipo]}>Tipo</Text>
            <Text style={[s.thCell, s.cMonto]}>Monto</Text>
          </View>
          {movimientos.map((m, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <Text style={s.cFecha}>{formatearFecha(m.fecha)}</Text>
              <Text style={s.cConcepto}>{m.concepto}</Text>
              <Text style={[s.cTipo, { color: m.tipo === "entrada" ? c.success : c.danger }]}>
                {m.tipo === "entrada" ? "Entrada" : "Salida"}
              </Text>
              <Text style={[s.cMonto, { color: m.tipo === "entrada" ? c.success : c.danger }]}>
                {m.tipo === "entrada" ? "" : "- "}{formatearRD(m.monto)}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatearRD, formatearFecha } from "@/lib/format";
import type {
  EmpresaPDF,
  ClientePDF,
  DocumentoComercialPDF,
  EstadoCuentaPDF,
} from "@/lib/pdf/tipos";

const c = {
  ink: "#101828",
  muted: "#667085",
  soft: "#98A2B3",
  line: "#E4E7EC",
  lineSoft: "#F2F4F7",
  amber: "#B87817",
  amberSoft: "#F6ECDA",
  surface: "#FAFAF8",
  white: "#FFFFFF",
  danger: "#B42318",
  success: "#067647",
};

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: c.ink,
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: 300,
    left: 90,
    fontSize: 90,
    fontFamily: "Helvetica-Bold",
    color: c.line,
    opacity: 0.5,
    transform: "rotate(-24deg)",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  empresaNombre: { fontSize: 16, fontFamily: "Helvetica-Bold", color: c.ink },
  empresaLinea: { fontSize: 8.5, color: c.muted, marginTop: 2 },
  docBox: { alignItems: "flex-end" },
  docTitulo: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: c.amber,
    letterSpacing: 1,
  },
  docNumero: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 2 },
  docMeta: { fontSize: 8.5, color: c.muted, marginTop: 3 },
  divider: { height: 1, backgroundColor: c.line, marginVertical: 16 },
  seccionTitulo: {
    fontSize: 8,
    color: c.soft,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  clienteNombre: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  clienteLinea: { fontSize: 9, color: c.muted, marginTop: 2 },
  tHead: {
    flexDirection: "row",
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.line,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  tHeadCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: c.muted, textTransform: "uppercase" },
  tRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: c.lineSoft,
  },
  cDesc: { flex: 1, paddingRight: 8 },
  cNum: { width: 55, textAlign: "right" },
  cPrecio: { width: 80, textAlign: "right" },
  cImporte: { width: 90, textAlign: "right" },
  totalesWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalesBox: { width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { color: c.muted },
  totalGran: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: c.line,
  },
  totalGranLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  totalGranValor: { fontSize: 12, fontFamily: "Helvetica-Bold", color: c.amber },
  bloque: { marginTop: 18 },
  bloqueTexto: { fontSize: 8.5, color: c.muted, lineHeight: 1.5 },
  bancoCard: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 4,
    padding: 8,
  },
  bancoLinea: { fontSize: 8.5, color: c.ink, marginBottom: 1 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7.5,
    color: c.soft,
    borderTopWidth: 1,
    borderColor: c.line,
    paddingTop: 8,
  },
});

function EmpresaHeader({ empresa }: { empresa: EmpresaPDF }) {
  return (
    <View style={{ maxWidth: 260 }}>
      <Text style={s.empresaNombre}>{empresa.nombre}</Text>
      {empresa.rnc && <Text style={s.empresaLinea}>RNC: {empresa.rnc}</Text>}
      {empresa.direccion && <Text style={s.empresaLinea}>{empresa.direccion}</Text>}
      {(empresa.telefono || empresa.email) && (
        <Text style={s.empresaLinea}>
          {[empresa.telefono, empresa.email].filter(Boolean).join("  ·  ")}
        </Text>
      )}
    </View>
  );
}

export function DocumentoComercialDoc({
  empresa,
  cliente,
  doc,
}: {
  empresa: EmpresaPDF;
  cliente: ClientePDF | null;
  doc: DocumentoComercialPDF;
}) {
  const esFactura = doc.tipo === "factura";
  return (
    <Document
      title={`${doc.numero}`}
      author={empresa.nombre}
      subject={esFactura ? "Factura" : "Cotización"}
    >
      <Page size="A4" style={s.page}>
        {doc.marcaAgua && <Text style={s.watermark}>{doc.marcaAgua}</Text>}

        <View style={s.headerRow}>
          <EmpresaHeader empresa={empresa} />
          <View style={s.docBox}>
            <Text style={s.docTitulo}>{esFactura ? "FACTURA" : "COTIZACIÓN"}</Text>
            <Text style={s.docNumero}>{doc.numero}</Text>
            <Text style={s.docMeta}>Fecha: {formatearFecha(doc.fecha)}</Text>
            {doc.fechaSecundaria && (
              <Text style={s.docMeta}>
                {esFactura ? "Vence: " : "Válida hasta: "}
                {formatearFecha(doc.fechaSecundaria)}
              </Text>
            )}
          </View>
        </View>

        <View style={s.divider} />

        <View>
          <Text style={s.seccionTitulo}>{esFactura ? "Facturar a" : "Cliente"}</Text>
          <Text style={s.clienteNombre}>{cliente?.nombre ?? "—"}</Text>
          {cliente?.rnc_cedula && (
            <Text style={s.clienteLinea}>RNC/Cédula: {cliente.rnc_cedula}</Text>
          )}
          {(cliente?.telefono || cliente?.email) && (
            <Text style={s.clienteLinea}>
              {[cliente?.telefono, cliente?.email].filter(Boolean).join("  ·  ")}
            </Text>
          )}
          {cliente?.direccion && <Text style={s.clienteLinea}>{cliente.direccion}</Text>}
        </View>

        <View style={s.tHead}>
          <Text style={[s.tHeadCell, s.cDesc]}>Descripción</Text>
          <Text style={[s.tHeadCell, s.cNum]}>Cant.</Text>
          <Text style={[s.tHeadCell, s.cPrecio]}>Precio</Text>
          <Text style={[s.tHeadCell, s.cImporte]}>Importe</Text>
        </View>
        {doc.lineas.map((l, i) => (
          <View key={i} style={s.tRow} wrap={false}>
            <Text style={s.cDesc}>{l.descripcion}</Text>
            <Text style={s.cNum}>{l.cantidad}</Text>
            <Text style={s.cPrecio}>{formatearRD(l.precio_unitario)}</Text>
            <Text style={s.cImporte}>{formatearRD(l.subtotal)}</Text>
          </View>
        ))}

        <View style={s.totalesWrap}>
          <View style={s.totalesBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text>{formatearRD(doc.subtotal)}</Text>
            </View>
            {doc.descuento > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Descuento</Text>
                <Text>- {formatearRD(doc.descuento)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>ITBIS</Text>
              <Text>{formatearRD(doc.itbis)}</Text>
            </View>
            <View style={s.totalGran}>
              <Text style={s.totalGranLabel}>Total</Text>
              <Text style={s.totalGranValor}>{formatearRD(doc.total)}</Text>
            </View>
          </View>
        </View>

        {doc.condiciones && (
          <View style={s.bloque}>
            <Text style={s.seccionTitulo}>Condiciones</Text>
            <Text style={s.bloqueTexto}>{doc.condiciones}</Text>
          </View>
        )}
        {doc.terminos && (
          <View style={s.bloque}>
            <Text style={s.seccionTitulo}>Términos</Text>
            <Text style={s.bloqueTexto}>{doc.terminos}</Text>
          </View>
        )}
        {doc.notas && (
          <View style={s.bloque}>
            <Text style={s.seccionTitulo}>Notas</Text>
            <Text style={s.bloqueTexto}>{doc.notas}</Text>
          </View>
        )}

        {esFactura && empresa.cuentas_bancarias.length > 0 && (
          <View style={s.bloque}>
            <Text style={s.seccionTitulo}>Datos para el pago</Text>
            {empresa.cuentas_bancarias.map((b, i) => (
              <View key={i} style={s.bancoCard}>
                <Text style={s.bancoLinea}>
                  {[b.banco, b.tipo].filter(Boolean).join(" — ")}
                </Text>
                {b.numero && <Text style={s.bancoLinea}>Cuenta: {b.numero}</Text>}
                {b.titular && <Text style={s.bancoLinea}>Titular: {b.titular}</Text>}
              </View>
            ))}
          </View>
        )}

        <Text style={s.footer} fixed>
          {empresa.nombre} · Documento generado con JM Facturación
        </Text>
      </Page>
    </Document>
  );
}

export function EstadoCuentaDoc({
  empresa,
  cliente,
  data,
}: {
  empresa: EmpresaPDF;
  cliente: ClientePDF;
  data: EstadoCuentaPDF;
}) {
  return (
    <Document title={`Estado de cuenta - ${cliente.nombre}`} author={empresa.nombre}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <EmpresaHeader empresa={empresa} />
          <View style={s.docBox}>
            <Text style={s.docTitulo}>ESTADO DE CUENTA</Text>
            <Text style={s.docMeta}>Generado: {formatearFecha(data.generadoEl)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View>
          <Text style={s.seccionTitulo}>Cliente</Text>
          <Text style={s.clienteNombre}>{cliente.nombre}</Text>
          {cliente.rnc_cedula && (
            <Text style={s.clienteLinea}>RNC/Cédula: {cliente.rnc_cedula}</Text>
          )}
        </View>

        <View style={s.tHead}>
          <Text style={[s.tHeadCell, s.cDesc]}>Factura</Text>
          <Text style={[s.tHeadCell, s.cNum]}>Fecha</Text>
          <Text style={[s.tHeadCell, s.cPrecio]}>Total</Text>
          <Text style={[s.tHeadCell, s.cPrecio]}>Cobrado</Text>
          <Text style={[s.tHeadCell, s.cImporte]}>Saldo</Text>
        </View>
        {data.facturas.map((f, i) => (
          <View key={i} style={s.tRow} wrap={false}>
            <Text style={s.cDesc}>{f.numero}</Text>
            <Text style={s.cNum}>{formatearFecha(f.fecha)}</Text>
            <Text style={s.cPrecio}>{formatearRD(f.total)}</Text>
            <Text style={s.cPrecio}>{formatearRD(f.cobrado)}</Text>
            <Text style={[s.cImporte, { color: f.saldo > 0 ? c.danger : c.success }]}>
              {formatearRD(f.saldo)}
            </Text>
          </View>
        ))}

        <View style={s.totalesWrap}>
          <View style={s.totalesBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total facturado</Text>
              <Text>{formatearRD(data.totalFacturado)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total cobrado</Text>
              <Text>{formatearRD(data.totalCobrado)}</Text>
            </View>
            <View style={s.totalGran}>
              <Text style={s.totalGranLabel}>Saldo pendiente</Text>
              <Text style={s.totalGranValor}>{formatearRD(data.totalPendiente)}</Text>
            </View>
          </View>
        </View>

        <Text style={s.footer} fixed>
          {empresa.nombre} · Estado de cuenta generado con JM Facturación
        </Text>
      </Page>
    </Document>
  );
}

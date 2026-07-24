import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatearRD, formatearFecha } from "@/lib/format";
import { estadoCotizacionMeta } from "@/lib/estados";
import type { Cotizacion, CotizacionLinea } from "@/lib/database.types";
import { mapEmpresaPDF, slugNombre, marcaAguaCotizacion } from "@/lib/pdf/helpers";
import type { DocumentoComercialPDF } from "@/lib/pdf/tipos";
import { Badge } from "@/components/ui/badge";
import { PdfAcciones } from "@/components/pdf/pdf-acciones";
import { CotizacionAcciones } from "@/components/cotizaciones/cotizacion-acciones";

export const metadata: Metadata = { title: "Cotización" };

type CotizacionDetalle = Cotizacion & {
  cotizacion_lineas: CotizacionLinea[];
  cliente: { nombre: string; telefono: string | null; rnc_cedula: string | null } | null;
};

function construirWhatsApp(
  telefono: string | null,
  mensaje: string,
): string {
  const texto = encodeURIComponent(mensaje);
  if (!telefono) return `https://wa.me/?text=${texto}`;
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 10) digitos = `1${digitos}`;
  return `https://wa.me/${digitos}?text=${texto}`;
}

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cotData } = await supabase
    .from("cotizaciones")
    .select("*, cotizacion_lineas(*), cliente:clientes(nombre, telefono, rnc_cedula)")
    .eq("id", id)
    .maybeSingle();

  const cot = cotData as unknown as CotizacionDetalle | null;
  if (!cot) notFound();

  const cliente = cot.cliente;
  const lineas = (cot.cotizacion_lineas ?? []).slice().sort((a, b) => a.orden - b.orden);

  const { data: empresaRow } = await supabase
    .from("empresa_config")
    .select("nombre, rnc, direccion, telefono, email, cuentas_bancarias, terminos_cotizacion")
    .maybeSingle();
  const empresa = empresaRow;

  let facturaNumero: string | null = null;
  if (cot.factura_id) {
    const { data: fac } = await supabase
      .from("facturas")
      .select("numero")
      .eq("id", cot.factura_id)
      .maybeSingle();
    facturaNumero = fac?.numero ?? null;
  }

  const meta = estadoCotizacionMeta[cot.estado];
  const mensaje = `Hola${cliente ? ` ${cliente.nombre}` : ""}, le comparto la cotización ${cot.numero}${
    empresa?.nombre ? ` de ${empresa.nombre}` : ""
  } por un total de ${formatearRD(Number(cot.total))}. Válida hasta el ${formatearFecha(cot.fecha_validez)}. Quedo atento(a) a su respuesta. ¡Gracias!`;
  const waHref = construirWhatsApp(cliente?.telefono ?? null, mensaje);

  const empresaPDF = mapEmpresaPDF(empresaRow ?? null);
  const docPDF: DocumentoComercialPDF = {
    tipo: "cotizacion",
    numero: cot.numero,
    fecha: cot.fecha,
    fechaSecundaria: cot.fecha_validez,
    estado: cot.estado,
    marcaAgua: marcaAguaCotizacion(cot.estado),
    subtotal: Number(cot.subtotal),
    descuento: 0,
    itbis: Number(cot.itbis),
    total: Number(cot.total),
    notas: cot.notas,
    condiciones: cot.condiciones,
    terminos: empresa?.terminos_cotizacion ?? null,
    lineas: lineas.map((l) => ({
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      subtotal: Number(l.subtotal_linea),
    })),
  };
  const nombreArchivo = `${cot.numero}_${slugNombre(cliente?.nombre)}.pdf`;

  return (
    <div className="space-y-6">
      <Link
        href="/cotizaciones"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a cotizaciones
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {cot.numero}
            </h1>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {cliente?.nombre ?? "Sin cliente"} · Emitida {formatearFecha(cot.fecha)}
          </p>
        </div>
        <CotizacionAcciones id={cot.id} estado={cot.estado} waHref={waHref} />
      </div>

      <PdfAcciones
        kind="comercial"
        empresa={empresaPDF}
        cliente={
          cliente
            ? {
                nombre: cliente.nombre,
                rnc_cedula: cliente.rnc_cedula,
                telefono: cliente.telefono,
                email: null,
                direccion: null,
              }
            : null
        }
        doc={docPDF}
        fileName={nombreArchivo}
        previewTitle={`Cotización ${cot.numero}`}
      />

      {cot.factura_id && (
        <Link
          href="/facturas"
          className="flex items-center gap-2 rounded-card border border-accent/40 bg-accent-soft/40 px-4 py-3 text-sm text-accent transition-colors hover:bg-accent-soft"
        >
          <ReceiptText className="h-4 w-4" />
          Convertida a factura{facturaNumero ? ` ${facturaNumero}` : ""}.
        </Link>
      )}

      {/* Documento */}
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="grid grid-cols-1 gap-4 border-b border-line p-6 sm:grid-cols-3">
          <Dato label="Cliente" valor={cliente?.nombre ?? "—"} />
          <Dato label="RNC / Cédula" valor={cliente?.rnc_cedula ?? "—"} />
          <Dato label="Válida hasta" valor={formatearFecha(cot.fecha_validez)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-6 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 text-right font-medium">Cant.</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-6 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={l.id} className="border-b border-line-soft last:border-0">
                  <td className="px-6 py-3">{l.descripcion}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{Number(l.cantidad)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatearRD(Number(l.precio_unitario))}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {formatearRD(Number(l.subtotal_linea))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-2 border-t border-line p-6 text-sm">
          <div className="flex w-full max-w-xs justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="tabular-nums">{formatearRD(Number(cot.subtotal))}</span>
          </div>
          <div className="flex w-full max-w-xs justify-between">
            <span className="text-muted">ITBIS</span>
            <span className="tabular-nums">{formatearRD(Number(cot.itbis))}</span>
          </div>
          <div className="flex w-full max-w-xs items-baseline justify-between border-t border-line pt-2">
            <span className="text-lg font-semibold text-fg">Total</span>
            <span className="text-lg font-semibold tabular-nums text-accent">{formatearRD(Number(cot.total))}</span>
          </div>
        </div>
      </div>

      {(cot.notas || cot.condiciones) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cot.notas && (
            <div className="rounded-card border border-line bg-surface p-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Notas
              </h3>
              <p className="whitespace-pre-wrap text-sm">{cot.notas}</p>
            </div>
          )}
          {cot.condiciones && (
            <div className="rounded-card border border-line bg-surface p-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Condiciones
              </h3>
              <p className="whitespace-pre-wrap text-sm">{cot.condiciones}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{valor}</p>
    </div>
  );
}

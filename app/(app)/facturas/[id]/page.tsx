import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Ban, CircleDot } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatearRD, formatearFecha } from "@/lib/format";
import { estadoFacturaMeta } from "@/lib/estados";
import type { Factura, FacturaLinea, Pago } from "@/lib/database.types";
import { mapEmpresaPDF, slugNombre, marcaAguaFactura } from "@/lib/pdf/helpers";
import type { DocumentoComercialPDF } from "@/lib/pdf/tipos";
import { Badge } from "@/components/ui/badge";
import { PdfAcciones } from "@/components/pdf/pdf-acciones";
import { MargenBarra } from "@/components/facturas/margen-barra";
import { FacturaAcciones } from "@/components/facturas/factura-acciones";

export const metadata: Metadata = { title: "Factura" };

type FacturaDetalle = Factura & {
  factura_lineas: FacturaLinea[];
  pagos: Pago[];
  cliente: { nombre: string; telefono: string | null; rnc_cedula: string | null } | null;
};

function construirWhatsApp(telefono: string | null, mensaje: string): string {
  const texto = encodeURIComponent(mensaje);
  if (!telefono) return `https://wa.me/?text=${texto}`;
  let d = telefono.replace(/\D/g, "");
  if (d.length === 10) d = `1${d}`;
  return `https://wa.me/${d}?text=${texto}`;
}

export default async function FacturaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: facData } = await supabase
    .from("facturas")
    .select("*, factura_lineas(*), pagos(*), cliente:clientes(nombre, telefono, rnc_cedula)")
    .eq("id", id)
    .maybeSingle();

  const fac = facData as unknown as FacturaDetalle | null;
  if (!fac) notFound();

  const cliente = fac.cliente;
  const lineas = (fac.factura_lineas ?? []).slice().sort((a, b) => a.orden - b.orden);
  const pagos = (fac.pagos ?? []).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));

  const { data: empresaRow } = await supabase
    .from("empresa_config")
    .select("nombre, rnc, direccion, telefono, email, cuentas_bancarias, terminos_factura")
    .maybeSingle();
  const empresa = empresaRow;

  const meta = estadoFacturaMeta[fac.estado];
  const total = Number(fac.total);
  const saldo = Number(fac.saldo);
  const cobrado = total - saldo;

  const mensaje = `Hola${cliente ? ` ${cliente.nombre}` : ""}, le comparto la factura ${fac.numero}${
    empresa?.nombre ? ` de ${empresa.nombre}` : ""
  } por un total de ${formatearRD(total)}.${
    saldo > 0 ? ` Saldo pendiente: ${formatearRD(saldo)}.` : " Pagada. ¡Gracias!"
  }`;
  const waHref = construirWhatsApp(cliente?.telefono ?? null, mensaje);

  const empresaPDF = mapEmpresaPDF(empresaRow ?? null);
  const docPDF: DocumentoComercialPDF = {
    tipo: "factura",
    numero: fac.numero,
    fecha: fac.fecha,
    fechaSecundaria: fac.fecha_vencimiento,
    estado: fac.estado,
    marcaAgua: marcaAguaFactura(fac.estado),
    subtotal: Number(fac.subtotal),
    descuento: Number(fac.descuento),
    itbis: Number(fac.itbis),
    total,
    notas: fac.notas,
    condiciones: null,
    terminos: empresa?.terminos_factura ?? null,
    lineas: lineas.map((l) => ({
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      subtotal: Number(l.subtotal_linea),
    })),
  };
  const nombreArchivo = `${fac.numero}_${slugNombre(cliente?.nombre)}.pdf`;

  // Timeline
  const eventos: { titulo: string; fecha: string; activo: boolean }[] = [
    { titulo: "Creada", fecha: formatearFecha(fac.created_at), activo: true },
  ];
  if (fac.estado !== "borrador") {
    eventos.push({ titulo: "Emitida", fecha: formatearFecha(fac.fecha), activo: true });
  }
  pagos.forEach((p) =>
    eventos.push({
      titulo: `Pago ${formatearRD(Number(p.monto))}`,
      fecha: formatearFecha(p.fecha),
      activo: true,
    }),
  );
  if (saldo <= 0 && total > 0 && fac.estado !== "anulada") {
    eventos.push({ titulo: "Saldada", fecha: "", activo: true });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/facturas"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a facturas
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {fac.numero}
            </h1>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {cliente?.nombre ?? "Sin cliente"} · {formatearFecha(fac.fecha)}
          </p>
        </div>
        <FacturaAcciones id={fac.id} estado={fac.estado} waHref={waHref} />
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
        previewTitle={`Factura ${fac.numero}`}
      />

      {fac.estado === "anulada" && fac.motivo_anulacion && (
        <div className="flex items-start gap-2 rounded-card border border-danger/40 bg-danger-soft/50 px-4 py-3 text-sm text-danger">
          <Ban className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            <strong>Factura anulada.</strong> Motivo: {fac.motivo_anulacion}
          </span>
        </div>
      )}

      {fac.cotizacion_id && (
        <Link
          href={`/cotizaciones/${fac.cotizacion_id}`}
          className="flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-3 text-sm text-muted transition-colors hover:text-fg"
        >
          <FileText className="h-4 w-4" />
          Originada desde una cotización — ver cotización.
        </Link>
      )}

      {/* Margen */}
      <MargenBarra
        utilidad={Number(fac.utilidad)}
        margenPct={Number(fac.margen_pct)}
        costoTotal={Number(fac.costo_total)}
      />

      {/* Documento */}
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="grid grid-cols-1 gap-4 border-b border-line p-6 sm:grid-cols-3">
          <Dato label="Cliente" valor={cliente?.nombre ?? "—"} />
          <Dato label="RNC / Cédula" valor={cliente?.rnc_cedula ?? "—"} />
          <Dato label="Vencimiento" valor={formatearFecha(fac.fecha_vencimiento)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-6 py-3 font-medium">Descripción</th>
                <th className="px-3 py-3 text-right font-medium">Cant.</th>
                <th className="px-3 py-3 text-right font-medium">Precio</th>
                <th className="px-3 py-3 text-right font-medium">Costo</th>
                <th className="px-3 py-3 text-right font-medium">Utilidad</th>
                <th className="px-6 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={l.id} className="border-b border-line-soft last:border-0">
                  <td className="px-6 py-3">{l.descripcion}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{Number(l.cantidad)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatearRD(Number(l.precio_unitario))}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{formatearRD(Number(l.costo_unitario))}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-success">{formatearRD(Number(l.utilidad_linea))}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{formatearRD(Number(l.subtotal_linea))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-2 border-t border-line p-6 text-sm">
          <Resumen label="Subtotal" valor={Number(fac.subtotal)} />
          {Number(fac.descuento) > 0 && <Resumen label="Descuento" valor={-Number(fac.descuento)} />}
          <Resumen label="ITBIS" valor={Number(fac.itbis)} />
          <div className="flex w-full max-w-xs justify-between border-t border-line pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums text-accent">{formatearRD(total)}</span>
          </div>
          {cobrado > 0 && <Resumen label="Cobrado" valor={cobrado} />}
          {saldo > 0 && fac.estado !== "anulada" && (
            <div className="flex w-full max-w-xs justify-between font-medium text-warning">
              <span>Saldo pendiente</span>
              <span className="tabular-nums">{formatearRD(saldo)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline + pagos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-line bg-surface p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Línea de tiempo
          </h2>
          <ol className="space-y-4">
            {eventos.map((e, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <CircleDot className="h-4 w-4 text-accent" />
                  {i < eventos.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-line" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-medium">{e.titulo}</p>
                  {e.fecha && <p className="text-xs text-muted">{e.fecha}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-card border border-line bg-surface">
          <div className="border-b border-line px-6 py-3.5">
            <h2 className="text-sm font-semibold">Pagos recibidos</h2>
          </div>
          {pagos.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted">
              Aún no hay pagos registrados.
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {pagos.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium tabular-nums">{formatearRD(Number(p.monto))}</p>
                    <p className="text-xs text-muted capitalize">
                      {p.metodo_pago} · {formatearFecha(p.fecha)}
                    </p>
                  </div>
                  {p.referencia && <span className="text-xs text-muted">{p.referencia}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {fac.notas && (
        <div className="rounded-card border border-line bg-surface p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Notas</h3>
          <p className="whitespace-pre-wrap text-sm">{fac.notas}</p>
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

function Resumen({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="flex w-full max-w-xs justify-between">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{formatearRD(valor)}</span>
    </div>
  );
}

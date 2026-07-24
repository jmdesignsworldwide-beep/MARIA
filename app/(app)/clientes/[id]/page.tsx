import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  ReceiptText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatearRD, formatearFecha } from "@/lib/format";
import { estadoFacturaMeta, estadoCotizacionMeta } from "@/lib/estados";
import { mapEmpresaPDF, slugNombre } from "@/lib/pdf/helpers";
import type { EstadoCuentaPDF } from "@/lib/pdf/tipos";
import { Badge } from "@/components/ui/badge";
import { PdfAcciones } from "@/components/pdf/pdf-acciones";
import { ClienteFichaAcciones } from "@/components/clientes/cliente-ficha-acciones";

export const metadata: Metadata = { title: "Ficha de cliente" };

export default async function ClienteFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) notFound();

  const [{ data: facturas }, { data: cotizaciones }] = await Promise.all([
    supabase
      .from("facturas")
      .select("id, numero, fecha, total, saldo, utilidad, estado")
      .eq("cliente_id", id)
      .order("fecha", { ascending: false }),
    supabase
      .from("cotizaciones")
      .select("id, numero, fecha, total, estado")
      .eq("cliente_id", id)
      .order("fecha", { ascending: false }),
  ]);

  const facturasValidas = (facturas ?? []).filter((f) => f.estado !== "anulada");
  const facturado = facturasValidas.reduce((a, f) => a + Number(f.total), 0);
  const cobrado = facturasValidas.reduce(
    (a, f) => a + (Number(f.total) - Number(f.saldo)),
    0,
  );
  const porCobrar = facturasValidas.reduce((a, f) => a + Number(f.saldo), 0);
  const utilidad = facturasValidas.reduce((a, f) => a + Number(f.utilidad), 0);

  const kpis = [
    { label: "Total facturado", valor: facturado, tono: "text-fg" },
    { label: "Cobrado", valor: cobrado, tono: "text-success" },
    { label: "Por cobrar", valor: porCobrar, tono: "text-warning" },
    { label: "Utilidad generada", valor: utilidad, tono: "text-accent" },
  ];

  const etiquetaDoc = cliente.tipo === "persona" ? "Cédula" : "RNC";
  const datos = [
    { icon: CreditCard, label: etiquetaDoc, valor: cliente.rnc_cedula },
    { icon: User, label: "Persona de contacto", valor: cliente.persona_contacto },
    { icon: Phone, label: "Teléfono", valor: cliente.telefono },
    { icon: Mail, label: "Correo", valor: cliente.email },
    { icon: MapPin, label: "Dirección", valor: cliente.direccion },
  ].filter((d) => d.valor);

  // Estado de cuenta (PDF)
  const { data: empresaRow } = await supabase
    .from("empresa_config")
    .select("nombre, rnc, direccion, telefono, email, cuentas_bancarias")
    .maybeSingle();
  const estadoCuenta: EstadoCuentaPDF = {
    facturas: facturasValidas.map((f) => ({
      numero: f.numero,
      fecha: f.fecha,
      total: Number(f.total),
      cobrado: Number(f.total) - Number(f.saldo),
      saldo: Number(f.saldo),
      estado: f.estado,
    })),
    totalFacturado: facturado,
    totalCobrado: cobrado,
    totalPendiente: porCobrar,
    generadoEl: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 flex-none items-center justify-center rounded-card bg-elevated ring-1 ring-line">
            {cliente.tipo === "empresa" ? (
              <Building2 className="h-6 w-6 text-accent" />
            ) : (
              <User className="h-6 w-6 text-accent" />
            )}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {cliente.nombre}
            </h1>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge variant="neutral">
                {cliente.tipo === "empresa" ? "Empresa" : "Persona"}
              </Badge>
              {cliente.activo ? (
                <Badge variant="success">Activo</Badge>
              ) : (
                <Badge variant="neutral">Inactivo</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <ClienteFichaAcciones cliente={cliente} />
          {estadoCuenta.facturas.length > 0 && (
            <PdfAcciones
              kind="estado_cuenta"
              empresa={mapEmpresaPDF(empresaRow ?? null)}
              cliente={{
                nombre: cliente.nombre,
                tipo: cliente.tipo,
                rnc_cedula: cliente.rnc_cedula,
                telefono: cliente.telefono,
                email: cliente.email,
                direccion: cliente.direccion,
              }}
              data={estadoCuenta}
              fileName={`EstadoCuenta_${slugNombre(cliente.nombre)}.pdf`}
              previewTitle={`Estado de cuenta · ${cliente.nombre}`}
            />
          )}
        </div>
      </div>

      {/* KPIs de rentabilidad */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs text-muted">{k.label}</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${k.tono}`}>
              {formatearRD(k.valor)}
            </p>
          </div>
        ))}
      </div>

      {/* Datos de contacto */}
      {(datos.length > 0 || cliente.notas) && (
        <div className="rounded-card border border-line bg-surface p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Información
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {datos.map((d) => (
              <div key={d.label} className="flex items-start gap-3">
                <d.icon className="mt-0.5 h-4 w-4 flex-none text-muted" />
                <div>
                  <p className="text-xs text-muted">{d.label}</p>
                  <p className="text-sm">{d.valor}</p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-4 w-4 flex-none text-muted" />
              <div>
                <p className="text-xs text-muted">Límite de crédito</p>
                <p className="text-sm tabular-nums">{formatearRD(cliente.limite_credito)}</p>
              </div>
            </div>
          </div>
          {cliente.notas && (
            <div className="mt-4 rounded-field border border-line-soft bg-elevated/50 p-3 text-sm text-muted">
              {cliente.notas}
            </div>
          )}
        </div>
      )}

      {/* Documentos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DocList
          titulo="Facturas"
          icon={ReceiptText}
          vacio="Aún no hay facturas de este cliente."
          items={(facturas ?? []).map((f) => ({
            id: f.id,
            numero: f.numero,
            fecha: f.fecha,
            total: Number(f.total),
            badge: estadoFacturaMeta[f.estado],
          }))}
        />
        <DocList
          titulo="Cotizaciones"
          icon={FileText}
          vacio="Aún no hay cotizaciones de este cliente."
          items={(cotizaciones ?? []).map((c) => ({
            id: c.id,
            numero: c.numero,
            fecha: c.fecha,
            total: Number(c.total),
            badge: estadoCotizacionMeta[c.estado],
          }))}
        />
      </div>
    </div>
  );
}

function DocList({
  titulo,
  icon: Icon,
  vacio,
  items,
}: {
  titulo: string;
  icon: typeof FileText;
  vacio: string;
  items: {
    id: string;
    numero: string;
    fecha: string;
    total: number;
    badge: { label: string; variant: "neutral" | "accent" | "success" | "warning" | "danger" | "info" };
  }[];
}) {
  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <Icon className="h-4 w-4 text-muted" />
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <span className="ml-auto text-xs text-muted">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">{vacio}</p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="font-medium tabular-nums">{it.numero}</p>
                <p className="text-xs text-muted">{formatearFecha(it.fecha)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums">{formatearRD(it.total)}</span>
                <Badge variant={it.badge.variant}>{it.badge.label}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

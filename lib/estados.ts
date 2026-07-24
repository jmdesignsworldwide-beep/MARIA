import type { EstadoCotizacion, EstadoFactura } from "@/lib/database.types";

type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

export const estadoFacturaMeta: Record<
  EstadoFactura,
  { label: string; variant: BadgeVariant }
> = {
  borrador: { label: "Borrador", variant: "neutral" },
  emitida: { label: "Emitida", variant: "info" },
  cobrada_parcial: { label: "Cobrada parcial", variant: "warning" },
  cobrada: { label: "Cobrada", variant: "success" },
  vencida: { label: "Vencida", variant: "danger" },
  anulada: { label: "Anulada", variant: "neutral" },
};

export const estadoCotizacionMeta: Record<
  EstadoCotizacion,
  { label: string; variant: BadgeVariant }
> = {
  borrador: { label: "Borrador", variant: "neutral" },
  enviada: { label: "Enviada", variant: "info" },
  aprobada: { label: "Aprobada", variant: "success" },
  rechazada: { label: "Rechazada", variant: "danger" },
  vencida: { label: "Vencida", variant: "warning" },
  convertida: { label: "Convertida", variant: "accent" },
};

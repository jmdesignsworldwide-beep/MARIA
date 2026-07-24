import type { EmpresaPDF, CuentaBancaria } from "@/lib/pdf/tipos";
import type { EstadoCotizacion, EstadoFactura } from "@/lib/database.types";

type EmpresaRow = {
  nombre: string;
  rnc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  cuentas_bancarias: unknown;
} | null;

/** Mapea la fila de empresa_config al formato del PDF. */
export function mapEmpresaPDF(row: EmpresaRow): EmpresaPDF {
  const cuentas = Array.isArray(row?.cuentas_bancarias)
    ? (row!.cuentas_bancarias as CuentaBancaria[])
    : [];
  return {
    nombre: row?.nombre ?? "Mi Empresa",
    rnc: row?.rnc ?? null,
    direccion: row?.direccion ?? null,
    telefono: row?.telefono ?? null,
    email: row?.email ?? null,
    cuentas_bancarias: cuentas,
  };
}

/** Convierte un nombre en un fragmento seguro para nombre de archivo. */
export function slugNombre(nombre: string | null | undefined): string {
  if (!nombre) return "Cliente";
  return (
    nombre
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
      .replace(/[^a-zA-Z0-9]+/g, "")
      .slice(0, 40) || "Cliente"
  );
}

export function marcaAguaCotizacion(estado: EstadoCotizacion): string | null {
  if (estado === "borrador") return "BORRADOR";
  if (estado === "rechazada") return "RECHAZADA";
  if (estado === "vencida") return "VENCIDA";
  return null;
}

export function marcaAguaFactura(estado: EstadoFactura): string | null {
  if (estado === "borrador") return "BORRADOR";
  if (estado === "anulada") return "ANULADA";
  if (estado === "cobrada") return "PAGADA";
  if (estado === "vencida") return "VENCIDA";
  return null;
}

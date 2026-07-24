import type { Json } from "@/lib/database.types";
import { formatearRD, formatearFecha } from "@/lib/format";

export type BitacoraFiltros = {
  desde?: string; // ISO date inclusivo
  hasta?: string; // ISO date exclusivo
  usuario?: string; // usuario_email
  accion?: string; // crear | editar | eliminar | anular | emitir | pago | sesion
  entidad?: string; // factura | cotización | cliente | gasto | compra | catalogo | ajustes | sesion
  busqueda?: string;
};

export type BitacoraEntrada = {
  id: string;
  usuario_email: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  descripcion: string | null;
  datos_antes: Json | null;
  datos_despues: Json | null;
  ip: string | null;
  created_at: string;
};

/** Grupo de acción para color/icono. */
export type GrupoAccion = "crear" | "editar" | "eliminar" | "sesion";

export function grupoDeAccion(accion: string): GrupoAccion {
  if (accion.startsWith("sesion")) return "sesion";
  if (accion === "crear" || accion === "emitir" || accion === "pago") return "crear";
  if (accion === "eliminar" || accion === "anular") return "eliminar";
  return "editar";
}

/** Verbo legible de la acción (para chips/filtros). */
export function verboAccion(accion: string): string {
  switch (accion) {
    case "crear": return "Creó";
    case "editar": return "Editó";
    case "eliminar": return "Eliminó";
    case "anular": return "Anuló";
    case "emitir": return "Emitió";
    case "pago": return "Registró pago";
    case "sesion_inicio": return "Inició sesión";
    case "sesion_cierre": return "Cerró sesión";
    case "sesion_fallida": return "Acceso fallido";
    default: return accion;
  }
}

/** Enlace al documento original según la entidad, si aplica. */
export function enlaceDocumento(e: BitacoraEntrada): string | null {
  if (!e.entidad_id) return null;
  switch (e.entidad) {
    case "factura": return `/facturas/${e.entidad_id}`;
    case "cotización": return `/cotizaciones/${e.entidad_id}`;
    case "cliente": return `/clientes/${e.entidad_id}`;
    default: return null;
  }
}

const CAMPO_ETIQUETA: Record<string, string> = {
  nombre: "Nombre",
  telefono: "Teléfono",
  email: "Correo",
  direccion: "Dirección",
  limite_credito: "Límite de crédito",
  activo: "Activo",
  estado: "Estado",
  motivo_anulacion: "Motivo de anulación",
  descripcion: "Descripción",
  monto: "Monto",
  total: "Total",
  precio_sugerido: "Precio",
  precio_unitario: "Precio unitario",
  costo_unitario: "Costo unitario",
  cantidad: "Cantidad",
  metodo_pago: "Método de pago",
  itbis_tasa: "Tasa de ITBIS",
  prefijo_factura: "Prefijo de factura",
  tipo: "Tipo",
  rnc_cedula: "RNC / Cédula",
  persona_contacto: "Persona de contacto",
};

const CAMPOS_DINERO = new Set([
  "limite_credito", "monto", "total", "precio_sugerido",
  "precio_unitario", "costo_unitario", "subtotal", "itbis",
]);

export function etiquetaCampo(campo: string): string {
  return CAMPO_ETIQUETA[campo] ?? campo.replace(/_/g, " ");
}

/** Formatea un valor jsonb según el tipo de campo (nunca JSON crudo). */
export function formatearValor(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (CAMPOS_DINERO.has(campo)) return formatearRD(Number(valor));
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (campo === "itbis_tasa") return `${Number(valor).toFixed(2)}%`;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(valor)) && (campo.includes("fecha") || campo === "created_at")) {
    return formatearFecha(String(valor));
  }
  return String(valor);
}

/** Campos internos que no se muestran en el detalle antes/después. */
const OCULTOS = new Set([
  "id", "owner_id", "created_at", "updated_at", "cliente_id", "cotizacion_id",
  "factura_id", "categoria_id", "suplidor_id", "catalogo_item_id", "orden",
]);

export type CambioCampo = { campo: string; antes: string; despues: string };

/** Calcula los campos que cambiaron entre antes y después. */
export function calcularCambios(
  antes: Json | null,
  despues: Json | null,
): CambioCampo[] {
  const a = (antes ?? {}) as Record<string, unknown>;
  const d = (despues ?? {}) as Record<string, unknown>;
  const claves = new Set([...Object.keys(a), ...Object.keys(d)]);
  const cambios: CambioCampo[] = [];
  for (const k of claves) {
    if (OCULTOS.has(k)) continue;
    const va = a[k];
    const vd = d[k];
    if (JSON.stringify(va) === JSON.stringify(vd)) continue;
    cambios.push({
      campo: etiquetaCampo(k),
      antes: formatearValor(k, va),
      despues: formatearValor(k, vd),
    });
  }
  return cambios;
}

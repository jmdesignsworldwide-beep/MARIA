/** Formas de datos (serializables) para el motor de PDFs. */

export type CuentaBancaria = {
  banco?: string;
  tipo?: string;
  numero?: string;
  titular?: string;
};

export type EmpresaPDF = {
  nombre: string;
  rnc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  cuentas_bancarias: CuentaBancaria[];
};

export type ClientePDF = {
  nombre: string;
  rnc_cedula: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
};

export type LineaPDF = {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type DocumentoComercialPDF = {
  tipo: "cotizacion" | "factura";
  numero: string;
  fecha: string;
  fechaSecundaria: string | null; // validez (cotización) o vencimiento (factura)
  estado: string;
  marcaAgua: string | null; // BORRADOR / ANULADA / PAGADA
  subtotal: number;
  descuento: number;
  itbis: number;
  total: number;
  notas: string | null;
  condiciones: string | null;
  terminos: string | null;
  lineas: LineaPDF[];
};

export type FacturaEstadoCuenta = {
  numero: string;
  fecha: string;
  total: number;
  cobrado: number;
  saldo: number;
  estado: string;
};

export type EstadoCuentaPDF = {
  facturas: FacturaEstadoCuenta[];
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  generadoEl: string;
};

/**
 * Formateadores de localización dominicana.
 * Moneda RD$ con separador de miles y dos decimales; fechas DD/MM/AAAA.
 */

const monedaFormatter = new Intl.NumberFormat("es-DO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto como `RD$ 45,500.00`. */
export function formatearRD(monto: number | null | undefined): string {
  const valor = typeof monto === "number" && Number.isFinite(monto) ? monto : 0;
  return `RD$ ${monedaFormatter.format(valor)}`;
}

/** Formatea un número sin símbolo de moneda: `45,500.00`. */
export function formatearNumero(valor: number | null | undefined): string {
  const n = typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
  return monedaFormatter.format(n);
}

/** Formatea una fecha como `DD/MM/AAAA`. */
export function formatearFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) return "—";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

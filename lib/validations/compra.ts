import { z } from "zod";

export const compraSchema = z.object({
  suplidor_id: z.string().uuid("Selecciona un suplidor"),
  factura_id: z.string().uuid().nullable().optional(),
  descripcion: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined)),
  monto: z.coerce
    .number({ invalid_type_error: "Monto no válido" })
    .positive("El monto debe ser mayor que cero")
    .max(100000000),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  metodo_pago: z.enum(["efectivo", "transferencia", "tarjeta", "cheque"]),
  numero_comprobante: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v : undefined)),
  recibo_path: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type CompraFormInput = z.input<typeof compraSchema>;
export type CompraInput = z.output<typeof compraSchema>;

import { z } from "zod";

export const pagoSchema = z.object({
  factura_id: z.string().uuid(),
  monto: z.coerce
    .number({ invalid_type_error: "Monto no válido" })
    .positive("El monto debe ser mayor que cero")
    .max(100000000),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  metodo_pago: z.enum(["efectivo", "transferencia", "tarjeta", "cheque"]),
  referencia: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
  notas: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type PagoFormInput = z.input<typeof pagoSchema>;
export type PagoInput = z.output<typeof pagoSchema>;

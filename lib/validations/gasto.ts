import { z } from "zod";

export const gastoSchema = z.object({
  categoria_id: z.string().uuid().nullable().optional(),
  descripcion: z.string().trim().min(2, "La descripción es obligatoria").max(200),
  monto: z.coerce
    .number({ invalid_type_error: "Monto no válido" })
    .positive("El monto debe ser mayor que cero")
    .max(100000000),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  metodo_pago: z.enum(["efectivo", "transferencia", "tarjeta", "cheque"]),
  es_recurrente: z.boolean().default(false),
  comprobante_path: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type GastoFormInput = z.input<typeof gastoSchema>;
export type GastoInput = z.output<typeof gastoSchema>;

export const categoriaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(60),
});

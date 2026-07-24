import { z } from "zod";

export const facturaLineaSchema = z.object({
  catalogo_item_id: z.string().uuid().nullable().optional(),
  suplidor_id: z.string().uuid().nullable().optional(),
  descripcion: z
    .string()
    .trim()
    .min(1, "Describe la línea")
    .max(200, "Máximo 200 caracteres"),
  cantidad: z.coerce
    .number({ invalid_type_error: "Cantidad no válida" })
    .positive("La cantidad debe ser mayor que cero")
    .max(1000000, "Cantidad demasiado grande"),
  precio_unitario: z.coerce
    .number({ invalid_type_error: "Precio no válido" })
    .min(0, "No puede ser negativo")
    .max(100000000, "Monto demasiado grande"),
  costo_unitario: z.coerce
    .number({ invalid_type_error: "Costo no válido" })
    .min(0, "No puede ser negativo")
    .max(100000000, "Monto demasiado grande")
    .default(0),
  itbis_aplicable: z.boolean().default(true),
});

export const facturaSchema = z.object({
  cliente_id: z.string().uuid("Selecciona un cliente"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  fecha_vencimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  itbis_activo: z.boolean().default(true),
  itbis_tasa: z.coerce.number().min(0).max(100).default(18),
  descuento: z.coerce
    .number({ invalid_type_error: "Descuento no válido" })
    .min(0, "No puede ser negativo")
    .max(100000000)
    .default(0),
  notas: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  lineas: z.array(facturaLineaSchema).min(1, "Agrega al menos una línea"),
});

export type FacturaFormInput = z.input<typeof facturaSchema>;
export type FacturaInput = z.output<typeof facturaSchema>;

export const anulacionSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, "Explica el motivo (mínimo 5 caracteres)")
    .max(500, "Máximo 500 caracteres"),
});

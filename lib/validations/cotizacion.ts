import { z } from "zod";

export const lineaSchema = z.object({
  catalogo_item_id: z.string().uuid().nullable().optional(),
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
  itbis_aplicable: z.boolean().default(true),
});

export const cotizacionSchema = z.object({
  cliente_id: z.string().uuid("Selecciona un cliente"),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  validez_dias: z.coerce
    .number({ invalid_type_error: "Días no válidos" })
    .int()
    .min(0)
    .max(365)
    .default(15),
  itbis_activo: z.boolean().default(true),
  itbis_tasa: z.coerce.number().min(0).max(100).default(18),
  notas: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  condiciones: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  lineas: z.array(lineaSchema).min(1, "Agrega al menos una línea"),
});

export type CotizacionFormInput = z.input<typeof cotizacionSchema>;
export type CotizacionInput = z.output<typeof cotizacionSchema>;
export type LineaInput = z.output<typeof lineaSchema>;

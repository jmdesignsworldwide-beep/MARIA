import { z } from "zod";

export const catalogoSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(2, "La descripción es obligatoria")
    .max(200, "Máximo 200 caracteres"),
  tipo: z.enum(["producto", "servicio"]),
  precio_sugerido: z.coerce
    .number({ invalid_type_error: "Precio no válido" })
    .min(0, "No puede ser negativo")
    .max(100000000, "Monto demasiado grande")
    .default(0),
  costo_referencial: z.coerce
    .number({ invalid_type_error: "Costo no válido" })
    .min(0, "No puede ser negativo")
    .max(100000000, "Monto demasiado grande")
    .default(0),
  unidad: z
    .string()
    .trim()
    .min(1, "Indica la unidad")
    .max(30, "Máximo 30 caracteres")
    .default("unidad"),
  activo: z.boolean().default(true),
});

export type CatalogoFormInput = z.input<typeof catalogoSchema>;
export type CatalogoInput = z.output<typeof catalogoSchema>;

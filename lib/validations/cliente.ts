import { z } from "zod";

const opcional = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const clienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(160, "Máximo 160 caracteres"),
  tipo: z.enum(["persona", "empresa"]),
  rnc_cedula: opcional(30),
  telefono: opcional(30),
  email: z
    .string()
    .trim()
    .email("Correo no válido")
    .max(160)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  direccion: opcional(300),
  limite_credito: z.coerce
    .number({ invalid_type_error: "Monto no válido" })
    .min(0, "No puede ser negativo")
    .max(100000000, "Monto demasiado grande")
    .default(0),
  notas: opcional(1000),
  activo: z.boolean().default(true),
});

/** Tipo de entrada del formulario (antes de aplicar defaults/coerce). */
export type ClienteFormInput = z.input<typeof clienteSchema>;
/** Tipo de salida ya validado/transformado. */
export type ClienteInput = z.output<typeof clienteSchema>;

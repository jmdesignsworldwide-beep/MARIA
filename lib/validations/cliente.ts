import { z } from "zod";

const opcional = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

/** Cuenta solo los dígitos de un documento (ignora guiones/espacios). */
export function soloDigitos(valor: string | undefined | null): string {
  return (valor ?? "").replace(/\D/g, "");
}

export const clienteSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre es obligatorio")
      .max(160, "Máximo 160 caracteres"),
    tipo: z.enum(["persona", "empresa"]),
    rnc_cedula: opcional(30),
    persona_contacto: opcional(160),
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
  })
  .superRefine((val, ctx) => {
    // Validación del documento según el tipo (servidor).
    const digitos = soloDigitos(val.rnc_cedula);
    if (digitos.length > 0) {
      if (val.tipo === "persona" && digitos.length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rnc_cedula"],
          message: "La cédula debe tener 11 dígitos.",
        });
      }
      if (val.tipo === "empresa" && digitos.length !== 9 && digitos.length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rnc_cedula"],
          message: "El RNC debe tener 9 u 11 dígitos.",
        });
      }
    }
    // "Persona de contacto" solo aplica a empresas: se descarta en personas.
    if (val.tipo === "persona") {
      val.persona_contacto = undefined;
    }
  });

/** Tipo de entrada del formulario (antes de aplicar defaults/coerce). */
export type ClienteFormInput = z.input<typeof clienteSchema>;
/** Tipo de salida ya validado/transformado. */
export type ClienteInput = z.output<typeof clienteSchema>;

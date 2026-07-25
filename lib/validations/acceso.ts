import { z } from "zod";

/** Alta de una cuenta de cliente con acceso temporal. */
export const crearCuentaSchema = z.object({
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(40, "Máximo 40 caracteres")
    .regex(/^[a-z0-9._-]+$/, "Solo letras, números, punto, guion y guion bajo"),
  negocio: z
    .string()
    .trim()
    .min(2, "El nombre del negocio es obligatorio")
    .max(160, "Máximo 160 caracteres"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  vencimiento: z.enum(["7", "15", "30", "custom", "sin"]),
  dias_custom: z.coerce
    .number({ invalid_type_error: "Número de días no válido" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 día")
    .max(3650, "Máximo 3650 días")
    .optional(),
}).superRefine((val, ctx) => {
  if (val.vencimiento === "custom" && !val.dias_custom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dias_custom"],
      message: "Escribe el número de días.",
    });
  }
});

export type CrearCuentaFormInput = z.input<typeof crearCuentaSchema>;
export type CrearCuentaInput = z.output<typeof crearCuentaSchema>;

/** Renovar / extender una cuenta con más días. */
export const renovarCuentaSchema = z.object({
  dias: z.coerce
    .number({ invalid_type_error: "Número de días no válido" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 día")
    .max(3650, "Máximo 3650 días"),
});

export type RenovarCuentaInput = z.output<typeof renovarCuentaSchema>;

/** Traduce la opción de vencimiento a número de días (o null = sin vencimiento). */
export function diasDeVencimiento(
  v: CrearCuentaInput["vencimiento"],
  diasCustom?: number,
): number | null {
  if (v === "sin") return null;
  if (v === "custom") return diasCustom ?? null;
  return Number(v);
}

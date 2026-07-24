import { z } from "zod";

const opc = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const suplidorSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(160),
  contacto: opc(120),
  telefono: opc(30),
  notas: opc(600),
  activo: z.boolean().default(true),
});

export type SuplidorFormInput = z.input<typeof suplidorSchema>;
export type SuplidorInput = z.output<typeof suplidorSchema>;

import { z } from "zod";

const opc = (max = 300) =>
  z.string().trim().max(max).optional().transform((v) => (v === "" ? undefined : v));

export const cuentaBancariaSchema = z.object({
  banco: z.string().trim().max(80).optional().transform((v) => v ?? ""),
  tipo: z.string().trim().max(40).optional().transform((v) => v ?? ""),
  numero: z.string().trim().max(60).optional().transform((v) => v ?? ""),
  titular: z.string().trim().max(120).optional().transform((v) => v ?? ""),
});

export const empresaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(160),
  rnc: opc(30),
  direccion: opc(300),
  telefono: opc(40),
  email: z
    .string()
    .trim()
    .email("Correo no válido")
    .max(160)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  prefijo_cotizacion: z.string().trim().min(1, "Falta el prefijo").max(10),
  prefijo_factura: z.string().trim().min(1, "Falta el prefijo").max(10),
  numero_inicial_cotizacion: z.coerce.number().int().min(1).max(999999).default(1),
  numero_inicial_factura: z.coerce.number().int().min(1).max(999999).default(1),
  itbis_tasa: z.coerce.number().min(0).max(100).default(18),
  itbis_activo: z.boolean().default(true),
  terminos_cotizacion: opc(2000),
  terminos_factura: opc(2000),
  cuentas_bancarias: z.array(cuentaBancariaSchema).max(6).default([]),
});

export type EmpresaFormInput = z.input<typeof empresaSchema>;
export type EmpresaInput = z.output<typeof empresaSchema>;

export const accesoDemoSchema = z.object({
  email: z.string().trim().email("Correo no válido").max(160),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  nombre: z.string().trim().max(120).optional().transform((v) => (v ? v : undefined)),
  vencimiento: z.enum(["7", "15", "30", "custom", "sin"]),
  fecha_custom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type AccesoDemoInput = z.output<typeof accesoDemoSchema>;

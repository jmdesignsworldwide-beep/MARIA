"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import {
  crearCuentaSchema,
  renovarCuentaSchema,
  diasDeVencimiento,
} from "@/lib/validations/acceso";
import { usuarioAEmail, emailAUsuario } from "@/lib/accesos/identidad";
import type { ActionResult } from "@/lib/actions/types";

/** Verifica en el SERVIDOR que el usuario actual sea admin. Devuelve su perfil. */
async function requerirAdmin(): Promise<{ id: string; email: string | null } | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("rol").eq("id", user.id).maybeSingle();
  return data?.rol === "admin" ? { id: user.id, email: user.email ?? null } : null;
}

/** Registra una acción del portal en la bitácora (vía service_role, inviolable). */
async function bitacoraPortal(
  svc: ReturnType<typeof createAdminClient>,
  actor: { id: string; email: string | null },
  accion: string,
  entidadId: string | null,
  descripcion: string,
) {
  const nombreActor = emailAUsuario(actor.email);
  await svc.from("bitacora").insert({
    owner_id: actor.id,
    usuario_email: actor.email,
    accion,
    entidad: "acceso",
    entidad_id: entidadId,
    descripcion: `${nombreActor}: ${descripcion}`,
  });
}

function diasRestantes(expira: string | null): number | null {
  if (!expira) return null;
  const ms = new Date(expira).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export type CuentaCliente = {
  id: string;
  usuario: string;
  negocio: string | null;
  is_active: boolean;
  access_expires_at: string | null;
  dias_restantes: number | null;
  estado: "activa" | "por_vencer" | "vencida" | "inactiva" | "sin_vencimiento";
  created_at: string;
};

function estadoDe(
  isActive: boolean,
  expira: string | null,
  dias: number | null,
): CuentaCliente["estado"] {
  if (!isActive) return "inactiva";
  if (expira === null) return "sin_vencimiento";
  if (dias !== null && dias <= 0) return "vencida";
  if (dias !== null && dias < 3) return "por_vencer";
  return "activa";
}

/** Lista las cuentas de cliente (solo admin). */
export async function listarCuentas(): Promise<CuentaCliente[]> {
  const admin = await requerirAdmin();
  if (!admin) return [];
  const svc = createAdminClient();

  const { data: perfiles } = await svc
    .from("profiles")
    .select("id, email, nombre_completo, is_active, access_expires_at, created_at")
    .eq("rol", "demo")
    .order("created_at", { ascending: false });

  const filas =
    (perfiles as
      | {
          id: string;
          email: string | null;
          nombre_completo: string | null;
          is_active: boolean;
          access_expires_at: string | null;
          created_at: string;
        }[]
      | null) ?? [];

  if (filas.length === 0) return [];

  // Nombre del negocio = empresa_config.nombre de cada cuenta.
  const ids = filas.map((f) => f.id);
  const { data: empresas } = await svc
    .from("empresa_config")
    .select("owner_id, nombre")
    .in("owner_id", ids);
  const negocioPorId = new Map<string, string>();
  for (const e of (empresas as { owner_id: string; nombre: string }[] | null) ?? []) {
    negocioPorId.set(e.owner_id, e.nombre);
  }

  return filas.map((f) => {
    const dias = diasRestantes(f.access_expires_at);
    return {
      id: f.id,
      usuario: emailAUsuario(f.email),
      negocio: negocioPorId.get(f.id) ?? f.nombre_completo ?? null,
      is_active: f.is_active,
      access_expires_at: f.access_expires_at,
      dias_restantes: dias,
      estado: estadoDe(f.is_active, f.access_expires_at, dias),
      created_at: f.created_at,
    };
  });
}

/** Detalle de una cuenta (solo admin). */
export async function obtenerCuenta(id: string): Promise<CuentaCliente | null> {
  const cuentas = await listarCuentas();
  return cuentas.find((c) => c.id === id) ?? null;
}

/** Crea una cuenta de cliente con usuario, negocio y días de acceso (solo admin). */
export async function crearCuenta(input: unknown): Promise<ActionResult> {
  const admin = await requerirAdmin();
  if (!admin) return { ok: false, error: "Solo un administrador puede crear cuentas." };

  const parsed = crearCuentaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const { usuario, negocio, password } = parsed.data;
  const dias = diasDeVencimiento(parsed.data.vencimiento, parsed.data.dias_custom);
  const expira = dias === null ? null : new Date(Date.now() + dias * 86400000).toISOString();

  const email = usuarioAEmail(usuario);
  const svc = createAdminClient();

  const { data: creado, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre_completo: negocio },
  });
  if (error || !creado.user) {
    const msg = error?.message?.toLowerCase().includes("already")
      ? "Ya existe una cuenta con ese usuario."
      : "No se pudo crear la cuenta.";
    return { ok: false, error: msg };
  }

  // El trigger creó perfil ('usuario') + empresa_config. Ajustamos ambos.
  await svc
    .from("profiles")
    .update({ rol: "demo", access_expires_at: expira, nombre_completo: negocio })
    .eq("id", creado.user.id);
  await svc.from("empresa_config").update({ nombre: negocio }).eq("owner_id", creado.user.id);

  await bitacoraPortal(
    svc,
    admin,
    "crear",
    creado.user.id,
    `creó la cuenta "${usuario}" (${negocio})${
      dias === null ? " sin vencimiento" : ` con ${dias} día(s) de acceso`
    }`,
  );

  revalidatePath("/accesos");
  return { ok: true, id: creado.user.id };
}

/** Renueva / extiende una cuenta sumándole días (desde hoy o desde su vencimiento). */
export async function renovarCuenta(id: string, input: unknown): Promise<ActionResult> {
  const admin = await requerirAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const parsed = renovarCuentaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const svc = createAdminClient();
  const { data: perfil } = await svc
    .from("profiles")
    .select("rol, access_expires_at")
    .eq("id", id)
    .maybeSingle();
  if (!perfil || perfil.rol !== "demo") {
    return { ok: false, error: "Cuenta no válida." };
  }

  // Si ya venció (o no tenía fecha), cuenta desde hoy; si sigue vigente, suma al final.
  const base =
    perfil.access_expires_at && new Date(perfil.access_expires_at).getTime() > Date.now()
      ? new Date(perfil.access_expires_at).getTime()
      : Date.now();
  const nueva = new Date(base + parsed.data.dias * 86400000).toISOString();

  const { error } = await svc
    .from("profiles")
    .update({ access_expires_at: nueva, is_active: true })
    .eq("id", id);
  if (error) return { ok: false, error: "No se pudo renovar la cuenta." };

  await bitacoraPortal(svc, admin, "editar", id, `renovó una cuenta con ${parsed.data.dias} día(s) más`);
  revalidatePath("/accesos");
  return { ok: true, id };
}

/** Establece una cuenta como "sin vencimiento" (solo admin). */
export async function quitarVencimiento(id: string): Promise<ActionResult> {
  const admin = await requerirAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const svc = createAdminClient();
  const { error } = await svc
    .from("profiles")
    .update({ access_expires_at: null, is_active: true })
    .eq("id", id)
    .eq("rol", "demo");
  if (error) return { ok: false, error: "No se pudo actualizar la cuenta." };
  await bitacoraPortal(svc, admin, "editar", id, "quitó el vencimiento de una cuenta");
  revalidatePath("/accesos");
  return { ok: true };
}

/** Activa o desactiva una cuenta (solo admin). */
export async function alternarCuenta(id: string, activar: boolean): Promise<ActionResult> {
  const admin = await requerirAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const svc = createAdminClient();
  const { error } = await svc
    .from("profiles")
    .update({ is_active: activar })
    .eq("id", id)
    .eq("rol", "demo");
  if (error) return { ok: false, error: "No se pudo actualizar la cuenta." };
  await bitacoraPortal(
    svc,
    admin,
    "editar",
    id,
    activar ? "reactivó una cuenta" : "desactivó una cuenta",
  );
  revalidatePath("/accesos");
  return { ok: true };
}

/** Elimina una cuenta por completo (solo admin). */
export async function eliminarCuenta(id: string): Promise<ActionResult> {
  const admin = await requerirAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const svc = createAdminClient();
  const { data: perfil } = await svc.from("profiles").select("rol, email").eq("id", id).maybeSingle();
  if (perfil?.rol !== "demo") return { ok: false, error: "Solo se pueden eliminar cuentas de cliente." };
  await bitacoraPortal(svc, admin, "eliminar", null, `eliminó la cuenta "${emailAUsuario(perfil.email)}"`);
  const { error } = await svc.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: "No se pudo eliminar la cuenta." };
  revalidatePath("/accesos");
  return { ok: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { BitacoraFiltros, BitacoraEntrada } from "@/lib/bitacora/tipos";

const PAGE_SIZE = 50;

const SELECT =
  "id, usuario_email, accion, entidad, entidad_id, descripcion, datos_antes, datos_despues, ip, created_at";

type QueryLike = {
  gte: (c: string, v: string) => QueryLike;
  lt: (c: string, v: string) => QueryLike;
  eq: (c: string, v: string) => QueryLike;
  ilike: (c: string, v: string) => QueryLike;
  or: (v: string) => QueryLike;
};

function aplicarFiltros<T extends QueryLike>(q: T, f: BitacoraFiltros): T {
  let out = q;
  if (f.desde) out = out.gte("created_at", f.desde) as T;
  if (f.hasta) out = out.lt("created_at", f.hasta) as T;
  if (f.usuario) out = out.eq("usuario_email", f.usuario) as T;
  if (f.entidad) out = out.eq("entidad", f.entidad) as T;
  if (f.accion) {
    if (f.accion === "sesion") out = out.ilike("accion", "sesion%") as T;
    else out = out.eq("accion", f.accion) as T;
  }
  if (f.busqueda?.trim()) {
    const t = f.busqueda.trim().replace(/[%,]/g, "");
    out = out.ilike("descripcion", `%${t}%`) as T;
  }
  return out;
}

/** Página de entradas del historial (paginación en servidor). */
export async function obtenerBitacora(
  filtros: BitacoraFiltros,
  offset = 0,
): Promise<{ ok: boolean; rows: BitacoraEntrada[]; hasMore: boolean; total: number }> {
  const user = await getUser();
  if (!user) return { ok: false, rows: [], hasMore: false, total: 0 };
  const supabase = await createClient();

  let q = supabase.from("bitacora").select(SELECT, { count: "exact" });
  q = aplicarFiltros(q as unknown as QueryLike, filtros) as typeof q;
  const { data, count, error } = await q
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) return { ok: false, rows: [], hasMore: false, total: 0 };
  const rows = (data as unknown as BitacoraEntrada[]) ?? [];
  const total = count ?? rows.length;
  return { ok: true, rows, hasMore: offset + rows.length < total, total };
}

/** Todas las entradas del filtro (sin paginar) para exportar. */
export async function exportarBitacora(
  filtros: BitacoraFiltros,
): Promise<{ ok: boolean; rows: BitacoraEntrada[] }> {
  const user = await getUser();
  if (!user) return { ok: false, rows: [] };
  const supabase = await createClient();

  let q = supabase.from("bitacora").select(SELECT);
  q = aplicarFiltros(q as unknown as QueryLike, filtros) as typeof q;
  const { data, error } = await q.order("created_at", { ascending: false }).limit(5000);
  if (error) return { ok: false, rows: [] };
  return { ok: true, rows: (data as unknown as BitacoraEntrada[]) ?? [] };
}

/** Lista de usuarios que aparecen en la bitácora (para el filtro). */
export async function obtenerUsuariosBitacora(): Promise<string[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("bitacora")
    .select("usuario_email")
    .not("usuario_email", "is", null)
    .limit(2000);
  const set = new Set<string>();
  for (const r of (data as { usuario_email: string | null }[] | null) ?? []) {
    if (r.usuario_email) set.add(r.usuario_email);
  }
  return Array.from(set).sort();
}

type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>;
};

/** Registra un evento de sesión (inicio/cierre/fallido) en la bitácora. */
export async function registrarSesion(
  tipo: "sesion_inicio" | "sesion_cierre" | "sesion_fallida",
  email?: string,
): Promise<void> {
  try {
    const supabase = (await createClient()) as unknown as RpcClient;
    await supabase.rpc("fn_registrar_sesion", { p_tipo: tipo, p_email: email ?? null });
  } catch {
    // El registro de sesión nunca debe romper el flujo de login/logout.
  }
}

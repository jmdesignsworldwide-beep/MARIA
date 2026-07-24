import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { obtenerBitacora, obtenerUsuariosBitacora } from "@/lib/actions/bitacora";
import { BitacoraVista } from "@/components/bitacora/bitacora-vista";

export const metadata: Metadata = { title: "Bitácora" };

function iso(d: Date): string {
  return d.toISOString();
}

export default async function BitacoraPage() {
  await requireUser();
  const supabase = await createClient();

  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioSemana = new Date(inicioHoy);
  inicioSemana.setDate(inicioSemana.getDate() - 6);

  const [hoyRes, semanaRes, usuariosSemanaRes, inicial, usuarios] = await Promise.all([
    supabase
      .from("bitacora")
      .select("id", { count: "exact", head: true })
      .gte("created_at", iso(inicioHoy)),
    supabase
      .from("bitacora")
      .select("id", { count: "exact", head: true })
      .gte("created_at", iso(inicioSemana)),
    supabase
      .from("bitacora")
      .select("usuario_email")
      .gte("created_at", iso(inicioSemana))
      .not("usuario_email", "is", null)
      .limit(2000),
    obtenerBitacora({}, 0),
    obtenerUsuariosBitacora(),
  ]);

  const usuariosActivos = new Set(
    ((usuariosSemanaRes.data as { usuario_email: string | null }[] | null) ?? [])
      .map((r) => r.usuario_email)
      .filter(Boolean),
  ).size;

  return (
    <BitacoraVista
      kpis={{
        hoy: hoyRes.count ?? 0,
        semana: semanaRes.count ?? 0,
        usuariosActivos,
      }}
      inicial={inicial.rows}
      hasMoreInicial={inicial.hasMore}
      totalInicial={inicial.total}
      usuarios={usuarios}
    />
  );
}

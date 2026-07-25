import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión (Route Handler: sí puede escribir cookies) y lleva al
 * login. Se usa al detectar una cuenta vencida o inactiva.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const motivo = request.nextUrl.searchParams.get("motivo") ?? "";
  const url = request.nextUrl.clone();
  // Cuenta vencida → pantalla elegante de acceso expirado. Inactiva u otro → login.
  if (motivo === "vencido") {
    url.pathname = "/acceso-expirado";
    url.search = "";
  } else {
    url.pathname = "/login";
    url.search = motivo ? `?motivo=${motivo}` : "";
  }
  return NextResponse.redirect(url);
}

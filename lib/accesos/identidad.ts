/**
 * Mapeo transparente usuario ⇆ email fantasma.
 *
 * El cliente entra SOLO con usuario + contraseña. Supabase Auth exige un
 * email internamente, así que cada usuario se guarda como
 * `<usuario>@jmfacturacion.app`. Ese correo nunca se muestra ni se pide.
 * El dominio no envía correo (las cuentas se crean con email_confirm),
 * por eso no necesita ser real.
 */
export const DOMINIO_CUENTAS = "jmfacturacion.app";

/** Normaliza un nombre de usuario: minúsculas, sin espacios ni símbolos raros. */
export function normalizarUsuario(usuario: string): string {
  return usuario
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

/** Convierte un usuario en su email fantasma. */
export function usuarioAEmail(usuario: string): string {
  return `${normalizarUsuario(usuario)}@${DOMINIO_CUENTAS}`;
}

/** Extrae el usuario legible desde un email (fantasma o real). */
export function emailAUsuario(email: string | null | undefined): string {
  if (!email) return "—";
  const local = email.split("@")[0] ?? email;
  return local;
}

/** ¿Es un email fantasma del sistema de cuentas? */
export function esEmailFantasma(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${DOMINIO_CUENTAS}`);
}

const USUARIO_RE = /^[a-z0-9._-]{3,40}$/;

/** Valida el formato de un nombre de usuario ya normalizado. */
export function usuarioValido(usuario: string): boolean {
  return USUARIO_RE.test(usuario);
}

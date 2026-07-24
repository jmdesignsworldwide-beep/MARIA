import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  // Solo se aceptan rutas internas para evitar redirecciones abiertas.
  const destino =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : "/dashboard";

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col items-center text-center">
        <Brand size="lg" showName={false} />
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
          Bienvenida de nuevo
        </h1>
        <p className="mt-2 text-sm text-muted">
          Entra a tu panel de facturación y control financiero.
        </p>
      </div>

      <LoginForm redirectTo={destino} />
    </div>
  );
}

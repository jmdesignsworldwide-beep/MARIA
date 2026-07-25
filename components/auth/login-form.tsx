"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { registrarSesion } from "@/lib/actions/bitacora";
import { usuarioAEmail } from "@/lib/accesos/identidad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  usuario: z.string().trim().min(1, "Escribe tu usuario"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Traduce los errores comunes de Supabase Auth al español. */
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Usuario o contraseña incorrectos.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "No se pudo conectar. Revisa tu internet.";
  return "No se pudo iniciar sesión. Inténtalo de nuevo.";
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [mostrarClave, setMostrarClave] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usuario: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const supabase = createClient();
    // El cliente entra con usuario; se mapea a su email fantasma. Si escribe
    // un correo completo (recuperación de admin) se usa tal cual.
    const entrada = values.usuario.trim();
    const email = entrada.includes("@") ? entrada.toLowerCase() : usuarioAEmail(entrada);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: values.password,
    });

    if (error) {
      void registrarSesion("sesion_fallida", email);
      toast.error(traducirError(error.message));
      return;
    }

    void registrarSesion("sesion_inicio");
    toast.success("Sesión iniciada. Bienvenido.");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="space-y-5 rounded-card border border-line bg-surface/80 p-6 shadow-card backdrop-blur"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="usuario">Usuario</Label>
        <div className="relative">
          <User
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            id="usuario"
            type="text"
            autoCapitalize="none"
            autoComplete="username"
            placeholder="tu usuario"
            className="pl-10"
            aria-invalid={!!errors.usuario}
            {...register("usuario")}
          />
        </div>
        {errors.usuario && (
          <p className="text-xs text-danger">{errors.usuario.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            id="password"
            type={mostrarClave ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="px-10"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setMostrarClave((v) => !v)}
            aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-fg"
          >
            {mostrarClave ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-danger">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        loading={isSubmitting}
        className="w-full"
      >
        {!isSubmitting && (
          <>
            Entrar
            <ArrowRight className="h-4 w-4" />
          </>
        )}
        {isSubmitting && "Entrando…"}
      </Button>

      <p className="text-center text-xs text-muted">
        Acceso exclusivo para cuentas autorizadas.
      </p>
    </motion.form>
  );
}

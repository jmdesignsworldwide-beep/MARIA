"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toasts para toda acción exitosa o fallida (Regla innegociable #7).
 * Se adapta al tema activo y usa los tokens "Grafito & Ámbar".
 */
export function Toaster(props: ToasterProps) {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
        },
      }}
      {...props}
    />
  );
}

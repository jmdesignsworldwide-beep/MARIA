import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Layout de autenticación: pantalla centrada, sobria, con fondo
 * grafito y un halo ámbar sutil. Responsive hasta 390px.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* Aurora premium animada (grafito + ámbar), lenta y sutil. */}
      <div aria-hidden className="pointer-events-none aurora" />
      {/* Halo ámbar decorativo, muy sutil. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% -10%, var(--accent-soft) 0%, transparent 60%)",
          opacity: 0.5,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(70% 60% at 50% 40%, black 0%, transparent 75%)",
        }}
      />

      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-sm">{children}</main>

      <footer className="mt-10 text-center text-xs text-muted">
        © {new Date().getFullYear()} JM Facturación · República Dominicana
      </footer>
    </div>
  );
}

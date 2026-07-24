"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, ChevronDown } from "lucide-react";
import { cerrarSesion } from "@/lib/actions/auth";

function iniciales(texto: string) {
  const limpio = texto.trim();
  const partes = limpio.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0]![0]! + partes[1]![0]!).toUpperCase();
  const base = limpio.split("@")[0] ?? limpio;
  return base.slice(0, 2).toUpperCase();
}

/** Menú de usuario: muestra el nombre de la empresa; el correo va dentro. */
export function UserMenu({ email, nombre }: { email: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const etiqueta = nombre || email;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex items-center gap-2 rounded-field border border-line bg-elevated py-1.5 pl-1.5 pr-2.5 text-sm transition-colors hover:border-accent/50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-xs font-semibold text-accent">
          {iniciales(etiqueta)}
        </span>
        <span className="hidden max-w-[160px] truncate font-medium text-fg sm:inline">
          {etiqueta}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-card border border-line bg-elevated shadow-elevated"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-medium">{nombre || "Mi empresa"}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
            <form action={cerrarSesion}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-fg transition-colors hover:bg-surface"
              >
                <LogOut className="h-4 w-4 text-danger" aria-hidden />
                Cerrar sesión
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

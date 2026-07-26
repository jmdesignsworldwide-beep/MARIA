"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal con el patrón MÁS robusto que existe: la capa exterior hace scroll
 * y el modal simplemente fluye dentro. No hay `max-height`, ni `overflow:
 * hidden`, ni trucos de flex — por eso es IMPOSIBLE que corte el contenido:
 * si el modal es más alto que la pantalla, la capa se desplaza y todo (el
 * encabezado incluido) siempre es alcanzable. Alineado arriba para que el
 * título quede visible al abrir.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fondo fijo que cubre toda la pantalla. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "var(--overlay)",
              backdropFilter: "blur(3px)",
            }}
            aria-hidden
          />
          {/* Capa que hace SCROLL. El modal fluye dentro; nunca se corta. */}
          <div
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 50, overflowY: "auto" }}
            className="flex min-h-full items-start justify-center p-4 sm:py-10"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              style={{ marginTop: "auto", marginBottom: "auto" }}
              className={cn(
                "relative z-10 w-full rounded-modal border border-line bg-surface shadow-elevated",
                size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
              )}
            >
              {/* Encabezado */}
              <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-6">
                <div className="space-y-1">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {title}
                  </h2>
                  {description && (
                    <p className="text-sm leading-relaxed text-muted">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="-mr-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-field text-muted transition-colors hover:bg-elevated hover:text-fg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cuerpo — fluye con su contenido (sin tope ni scroll interno). */}
              <div className="px-6 py-5">{children}</div>

              {/* Pie opcional (los formularios traen su propio pie pegajoso). */}
              {footer && (
                <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

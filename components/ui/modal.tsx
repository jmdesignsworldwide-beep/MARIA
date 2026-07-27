"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal en TRES zonas: encabezado fijo, cuerpo con scroll interno y pie fijo.
 * El cuerpo es el que scrollea (por eso el pie pegajoso de los formularios se
 * queda abajo, no flotando en el medio). Tope de altura en `vh` puro + una
 * capa exterior con scroll de respaldo, para que el encabezado nunca quede
 * inalcanzable pase lo que pase.
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
          {/* Capa exterior con scroll de respaldo + centrado. */}
          <div
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 50, overflowY: "auto" }}
            className="flex min-h-full items-center justify-center p-4"
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
              /* Tres zonas EN LÍNEA (no dependen de la hoja de estilos):
                 flex columna + tope 90vh + overflow hidden. */
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                maxHeight: "90vh",
              }}
              className={cn(
                "relative z-10 my-auto w-full max-h-[90vh] rounded-modal border border-line bg-surface shadow-elevated",
                size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
              )}
            >
              {/* ZONA 1 — Encabezado fijo */}
              <div
                style={{ flexShrink: 0 }}
                className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-6"
              >
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

              {/* ZONA 2 — Cuerpo con scroll INTERNO (lo único que scrollea). */}
              <div
                style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}
                className="scrollbar-thin px-6 py-5"
              >
                {children}
              </div>

              {/* ZONA 3 — Pie fijo opcional */}
              {footer && (
                <div
                  style={{ flexShrink: 0 }}
                  className="flex items-center justify-end gap-3 border-t border-line px-6 py-4"
                >
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

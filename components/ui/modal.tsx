"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal accesible en TRES zonas: encabezado fijo, cuerpo con scroll y pie
 * fijo. La clave para que nunca se desborde es `max-h` en el contenedor +
 * `flex-1 min-h-0 overflow-y-auto` en el cuerpo (sin `min-h-0` el scroll no
 * funciona dentro de un flex y el modal crece hasta salirse de la pantalla).
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
  /** Pie fijo (botones). Si se omite, el contenido incluye sus propios botones. */
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
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: "var(--overlay)", backdropFilter: "blur(3px)" }}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            /* Estructura EN LÍNEA: no depende de la hoja de estilos (inmune a
               CSS viejo en caché). Así el modal SIEMPRE queda contenido. */
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              maxHeight: "min(90svh, 90vh)",
            }}
            className={cn(
              "relative z-10 w-full rounded-t-modal border border-line bg-surface shadow-elevated sm:rounded-modal",
              size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
            )}
          >
            {/* ZONA 1 — Encabezado fijo (no se encoge) */}
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

            {/* ZONA 2 — Cuerpo con scroll (lo único que scrollea).
                minHeight:0 en línea es la clave para que scrollee dentro del flex. */}
            <div
              style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}
              className="scrollbar-thin px-6 py-5"
            >
              {children}
            </div>

            {/* ZONA 3 — Pie fijo (siempre visible) */}
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
      )}
    </AnimatePresence>
  );
}

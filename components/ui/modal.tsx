"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal robusto y a prueba de "ancestros con transform".
 *
 * CLAVE: se renderiza con un PORTAL a `document.body`. Así el `position: fixed`
 * siempre se mide contra la ventana, nunca contra un ancestro con `transform`
 * (como el envoltorio `.page-enter` de las páginas), que era lo que atrapaba al
 * modal en una caja corta y lo cortaba pasara lo que pasara por dentro.
 *
 * Encima, el propio modal es el contenedor con scroll y el encabezado es
 * `sticky top-0`, así que el título nunca se corta.
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
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

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

  if (!montado) return null;

  const contenido = (
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
              zIndex: 100,
              background: "var(--overlay)",
              backdropFilter: "blur(3px)",
            }}
            aria-hidden
          />
          {/* Capa exterior: centra el modal y hace de scroll de respaldo. */}
          <div
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 100, overflowY: "auto" }}
            className="flex min-h-full items-center justify-center p-4"
          >
            {/* EL MODAL ES EL SCROLL. Encabezado sticky = nunca se corta. */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              style={{ maxHeight: "92vh", overflowY: "auto" }}
              className={cn(
                "scrollbar-thin relative z-10 my-auto w-full max-h-[92vh] rounded-modal border border-line bg-surface shadow-elevated",
                size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
              )}
            >
              {/* Encabezado PEGAJOSO arriba (primer hijo del scroll). */}
              <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-line bg-surface px-6 pb-4 pt-6">
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

              {/* Cuerpo en flujo normal: el scroll lo pone el modal. */}
              <div className="px-6 py-5">{children}</div>

              {/* Pie opcional (por prop): pegajoso al fondo del scroll. */}
              {footer && (
                <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 border-t border-line bg-surface px-6 py-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(contenido, document.body);
}

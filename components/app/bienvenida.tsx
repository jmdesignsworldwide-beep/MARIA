"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Pantalla de bienvenida cinematográfica. Se muestra una vez por sesión
 * del navegador al entrar al área autenticada, luego se desvanece.
 * Momento "wow" de la demo — respeta prefers-reduced-motion.
 */
export function Bienvenida({ nombre }: { nombre: string }) {
  const [mostrar, setMostrar] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vista = sessionStorage.getItem("jm_bienvenida");
    if (vista) return;
    setMostrar(true);
    sessionStorage.setItem("jm_bienvenida", "1");
    const t = setTimeout(() => setMostrar(false), reduce ? 900 : 2600);
    return () => clearTimeout(t);
  }, [reduce]);

  const saludo = nombre ? `Bienvenido, ${nombre}.` : "Tu control financiero, listo.";

  return (
    <AnimatePresence>
      {mostrar && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={() => setMostrar(false)}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#0A0C0F" }}
        >
          {/* Aurora sutil de fondo */}
          <div aria-hidden className="pointer-events-none aurora" style={{ opacity: 0.5 }} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 45% at 50% 45%, rgba(232,163,61,0.16) 0%, transparent 65%)",
            }}
          />

          <motion.img
            src="/logo-importaciones.png"
            alt="MCS Importaciones"
            initial={reduce ? { opacity: 0 } : { scale: 0.82, opacity: 0, y: 8 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 190, damping: 18, delay: 0.05 }}
            className="h-16 w-auto select-none sm:h-20"
            draggable={false}
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-7 text-lg font-medium text-white sm:text-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {saludo}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.5 }}
            className="mt-1.5 text-sm"
            style={{ color: "#98A2B3" }}
          >
            Facturación y finanzas, en un solo lugar.
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 1.4, ease: "easeInOut" }}
            className="mt-8 h-px w-44 origin-left"
            style={{ background: "linear-gradient(90deg, transparent, #E8A33D, transparent)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

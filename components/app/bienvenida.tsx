"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Pantalla de bienvenida cinematográfica. Se muestra una vez por sesión
 * del navegador al entrar al área autenticada, luego se desvanece.
 */
export function Bienvenida({ nombre }: { nombre: string }) {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vista = sessionStorage.getItem("jm_bienvenida");
    if (vista) return;
    setMostrar(true);
    sessionStorage.setItem("jm_bienvenida", "1");
    const t = setTimeout(() => setMostrar(false), 2400);
    return () => clearTimeout(t);
  }, []);

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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(55% 45% at 50% 45%, rgba(232,163,61,0.18) 0%, transparent 65%)",
            }}
          />

          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl ring-1 ring-white/10"
            style={{ background: "linear-gradient(140deg, #1B1F26, #13161B)" }}
          >
            <span
              className="font-semibold tracking-tight"
              style={{ color: "#E8A33D", fontFamily: "var(--font-display)", fontSize: 34 }}
            >
              JM
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-6 text-2xl font-semibold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            JM Facturación
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-2 text-sm"
            style={{ color: "#98A2B3" }}
          >
            {nombre ? `Bienvenida, ${nombre}.` : "Control financiero de tu negocio."}
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 1.4, ease: "easeInOut" }}
            className="mt-8 h-px w-40 origin-left"
            style={{ background: "linear-gradient(90deg, transparent, #E8A33D, transparent)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

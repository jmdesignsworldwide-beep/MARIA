"use client";

import { useEffect, useRef, useState } from "react";
import { formatearRD } from "@/lib/format";

/** Cuenta animada de 0 → valor con requestAnimationFrame (respeta
 *  prefers-reduced-motion). */
export function ContadorRD({
  valor,
  duracion = 900,
  className,
}: {
  valor: number;
  duracion?: number;
  className?: string;
}) {
  const [actual, setActual] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !Number.isFinite(valor)) {
      setActual(Number.isFinite(valor) ? valor : 0);
      return;
    }
    let inicio: number | null = null;
    const paso = (t: number) => {
      if (inicio === null) inicio = t;
      const p = Math.min((t - inicio) / duracion, 1);
      // easeOutCubic
      const e = 1 - Math.pow(1 - p, 3);
      setActual(valor * e);
      if (p < 1) rafRef.current = requestAnimationFrame(paso);
    };
    rafRef.current = requestAnimationFrame(paso);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [valor, duracion]);

  return <span className={`tabular-nums ${className ?? ""}`}>{formatearRD(actual)}</span>;
}

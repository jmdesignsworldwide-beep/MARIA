"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { formatearRD } from "@/lib/format";

/**
 * Barra de margen en vivo (el diferenciador estrella).
 * Rojo < 10% · Amarillo 10–25% · Verde > 25%. Cambia mientras factura.
 */
export function MargenBarra({
  utilidad,
  margenPct,
  costoTotal,
}: {
  utilidad: number;
  margenPct: number;
  costoTotal: number;
}) {
  const zona =
    margenPct < 10 ? "baja" : margenPct < 25 ? "media" : "alta";
  const color =
    zona === "baja" ? "var(--danger)" : zona === "media" ? "var(--warning)" : "var(--success)";
  const texto =
    zona === "baja" ? "text-danger" : zona === "media" ? "text-warning" : "text-success";
  const ancho = Math.max(0, Math.min(100, margenPct));

  const sinCosto = costoTotal <= 0;

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Margen de la operación</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${sinCosto ? "text-muted" : texto}`}>
            {margenPct.toFixed(1)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Utilidad</p>
          <p className={`text-lg font-semibold tabular-nums ${sinCosto ? "text-muted" : texto}`}>
            {formatearRD(utilidad)}
          </p>
        </div>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-elevated">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={false}
          animate={{ width: `${ancho}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {sinCosto ? (
          <span className="flex items-center gap-1.5 text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            Sin costo registrado: no se puede saber la ganancia real.
          </span>
        ) : zona === "baja" ? (
          <span className="flex items-center gap-1.5 text-danger">
            <TrendingDown className="h-3.5 w-3.5" />
            Margen bajo — revisa precios o costos.
          </span>
        ) : (
          <span className={`flex items-center gap-1.5 ${texto}`}>
            <TrendingUp className="h-3.5 w-3.5" />
            {zona === "media" ? "Margen aceptable." : "Buen margen."}
          </span>
        )}
      </div>
    </div>
  );
}

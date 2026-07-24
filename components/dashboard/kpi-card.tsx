"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { formatearRD } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Tarjeta KPI con contador ascendente animado. */
export function KpiCard({
  label,
  valor,
  icon: Icon,
  tono = "text-fg",
  sub,
}: {
  label: string;
  valor: number;
  icon: LucideIcon;
  tono?: string;
  sub?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, valor, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [valor]);

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-field bg-elevated ring-1 ring-line">
          <Icon className="h-4 w-4 text-accent" aria-hidden />
        </span>
      </div>
      <p className={cn("mt-3 text-2xl font-semibold tabular-nums", tono)}>
        {formatearRD(display)}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

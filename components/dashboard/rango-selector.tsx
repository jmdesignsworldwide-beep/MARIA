"use client";

import { useRouter } from "next/navigation";

const OPCIONES = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "anio", label: "Año" },
] as const;

export type Rango = (typeof OPCIONES)[number]["key"];

export function RangoSelector({ rango }: { rango: Rango }) {
  const router = useRouter();
  return (
    <div className="inline-flex rounded-field border border-line bg-elevated p-0.5">
      {OPCIONES.map((o) => (
        <button
          key={o.key}
          onClick={() => router.push(`/dashboard?rango=${o.key}`)}
          className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
            rango === o.key ? "bg-accent text-accent-contrast" : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

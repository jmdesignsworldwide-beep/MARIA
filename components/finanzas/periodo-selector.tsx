"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPCIONES: { valor: string; etiqueta: string }[] = [
  { valor: "mes", etiqueta: "Este mes" },
  { valor: "3m", etiqueta: "3 meses" },
  { valor: "6m", etiqueta: "6 meses" },
  { valor: "ano", etiqueta: "12 meses" },
];

export function PeriodoSelector({ actual }: { actual: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function cambiar(valor: string) {
    const p = new URLSearchParams(params.toString());
    p.set("p", valor);
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="inline-flex rounded-field border border-line bg-surface p-0.5">
      {OPCIONES.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => cambiar(o.valor)}
          aria-pressed={actual === o.valor}
          className={`rounded-[calc(theme(borderRadius.field)-2px)] px-3 py-1.5 text-xs font-medium transition-colors ${
            actual === o.valor
              ? "bg-accent text-accent-contrast"
              : "text-muted hover:text-fg"
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

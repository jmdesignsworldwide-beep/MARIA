"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Waves,
  BookOpen,
  Scale,
  CalendarClock,
  Gem,
} from "lucide-react";

const TABS = [
  { href: "/finanzas", label: "Flujo del mes", icon: Waves, exact: true },
  { href: "/finanzas/movimientos", label: "Movimientos", icon: BookOpen },
  { href: "/finanzas/resultados", label: "Resultados", icon: Scale },
  { href: "/finanzas/proyeccion", label: "Proyección", icon: CalendarClock },
  { href: "/finanzas/rentabilidad", label: "Rentabilidad", icon: Gem },
];

export function FinanzasNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 -mx-1 flex gap-1 overflow-x-auto pb-1">
      {TABS.map((t) => {
        const activo = t.exact
          ? pathname === t.href
          : pathname === t.href || pathname.startsWith(`${t.href}/`);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={activo ? "page" : undefined}
            className={`inline-flex flex-none items-center gap-1.5 rounded-field px-3.5 py-2 text-sm font-medium transition-colors ${
              activo
                ? "bg-accent text-accent-contrast"
                : "text-muted hover:bg-elevated hover:text-fg"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navGroups } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Contenido de navegación compartido entre la barra lateral (escritorio)
 * y el cajón móvil. Resalta el ítem activo con un indicador ámbar animado.
 */
export function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {navGroups.map((grupo) => (
        <div key={grupo.titulo} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {grupo.titulo}
          </p>
          {grupo.items.map((item) => {
            const activo =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-field px-3 py-2 text-sm transition-colors",
                  activo
                    ? "text-fg"
                    : "text-muted hover:bg-elevated hover:text-fg",
                )}
              >
                {activo && (
                  <motion.span
                    layoutId="nav-activo"
                    className="absolute inset-0 -z-10 rounded-field bg-elevated ring-1 ring-line"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] flex-none transition-colors",
                    activo
                      ? "text-accent"
                      : "text-muted group-hover:text-fg",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
